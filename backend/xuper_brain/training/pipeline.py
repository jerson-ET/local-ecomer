"""
XuperBrain — Pipeline de Entrenamiento desde cero.
Entrena el modelo Transformer con los datos ingeridos.

Proceso:
1. Recopilar todos los textos de la base de conocimientos.
2. Entrenar el tokenizador BPE sobre esos textos.
3. Crear dataset de entrenamiento (predicción del siguiente token).
4. Entrenar el Transformer con AdamW + cosine annealing.
5. Guardar checkpoints del modelo.
"""

import os
import time
import json
import math
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from typing import List, Dict, Optional, Callable

from xuper_brain.tokenizer_bpe import BPETokenizer
from xuper_brain.model.transformer import XuperTransformer
from xuper_brain.knowledge.rag_engine import KnowledgeEngine


class TextDataset(Dataset):
    """Dataset para entrenamiento de lenguaje (predicción del siguiente token)."""

    def __init__(self, token_ids: List[int], seq_len: int = 128):
        self.seq_len = seq_len
        self.data = torch.tensor(token_ids, dtype=torch.long)

    def __len__(self):
        return max(0, len(self.data) - self.seq_len - 1)

    def __getitem__(self, idx):
        x = self.data[idx: idx + self.seq_len]
        y = self.data[idx + 1: idx + self.seq_len + 1]
        return x, y


class TrainingPipeline:
    """Pipeline completo para entrenar XuperBrain desde cero."""

    def __init__(self, brain_dir: str):
        self.brain_dir = brain_dir
        self.models_dir = os.path.join(brain_dir, "checkpoints")
        self.tokenizer_path = os.path.join(brain_dir, "tokenizer.json")
        os.makedirs(self.models_dir, exist_ok=True)

        self.tokenizer: Optional[BPETokenizer] = None
        self.model: Optional[XuperTransformer] = None
        self.knowledge: Optional[KnowledgeEngine] = None

    def train_full(
        self,
        knowledge_engine: KnowledgeEngine,
        model_size: str = "nano",
        vocab_size: int = 4000,
        epochs: int = 10,
        batch_size: int = 16,
        learning_rate: float = 3e-4,
        seq_len: int = 128,
        progress_callback: Optional[Callable] = None,
    ) -> Dict:
        """
        Pipeline completo de entrenamiento:
        1. Recopila textos → 2. Entrena tokenizador → 3. Entrena modelo
        """
        self.knowledge = knowledge_engine
        logs = []

        def log(msg):
            logs.append(msg)
            print(msg)
            if progress_callback:
                progress_callback(msg)

        # ── Paso 1: Recopilar textos ──
        log("📚 [1/4] Recopilando textos de la base de conocimientos...")
        all_texts = [doc["text"] for doc in knowledge_engine.store.documents]

        if not all_texts:
            return {"status": "error", "message": "No hay textos en la base de conocimientos. Ingiere datos primero."}

        total_words = sum(len(t.split()) for t in all_texts)
        log(f"   Documentos: {len(all_texts)} | Palabras totales: {total_words:,}")

        # ── Paso 2: Entrenar tokenizador BPE ──
        log(f"🔤 [2/4] Entrenando tokenizador BPE (vocab_size={vocab_size})...")
        self.tokenizer = BPETokenizer(vocab_size=vocab_size)
        self.tokenizer.train(all_texts)
        self.tokenizer.save(self.tokenizer_path)
        log(f"   Vocabulario final: {self.tokenizer.vocab_len} tokens")

        # ── Paso 3: Tokenizar corpus completo ──
        log("🧮 [3/4] Tokenizando corpus de entrenamiento...")
        all_token_ids = []
        for text in all_texts:
            ids = self.tokenizer.encode(text, add_special=True)
            all_token_ids.extend(ids)

        log(f"   Total tokens: {len(all_token_ids):,}")

        if len(all_token_ids) < seq_len + 1:
            return {"status": "error", "message": f"Corpus muy pequeño ({len(all_token_ids)} tokens). Necesitas al menos {seq_len + 1}. Agrega más textos."}

        # Crear dataset
        dataset = TextDataset(all_token_ids, seq_len=seq_len)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, drop_last=True)

        log(f"   Muestras de entrenamiento: {len(dataset):,}")
        log(f"   Batches por época: {len(dataloader)}")

        # ── Paso 4: Crear y entrenar modelo ──
        log(f"🧠 [4/4] Construyendo Transformer '{model_size}' y entrenando...")
        self.model = XuperTransformer.from_config(
            model_size,
            vocab_size=self.tokenizer.vocab_len,
            max_seq_len=seq_len,
        )

        n_params = self.model.count_parameters()
        log(f"   Parámetros: {n_params:,} ({n_params / 1e6:.1f}M)")
        log(f"   Config: d_model={self.model.d_model}, layers={len(self.model.blocks)}")

        # Optimizador AdamW
        optimizer = torch.optim.AdamW(
            self.model.parameters(),
            lr=learning_rate,
            weight_decay=0.01,
            betas=(0.9, 0.95),
        )

        # Cosine annealing scheduler
        total_steps = len(dataloader) * epochs
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=total_steps)

        # Loss function
        criterion = nn.CrossEntropyLoss(ignore_index=self.tokenizer.token_to_id.get("<PAD>", 0))

        # Training loop
        self.model.train()
        best_loss = float("inf")
        training_start = time.time()

        for epoch in range(epochs):
            epoch_loss = 0.0
            epoch_start = time.time()
            n_batches = 0

            for batch_idx, (x, y) in enumerate(dataloader):
                optimizer.zero_grad()

                logits = self.model(x)
                loss = criterion(logits.view(-1, logits.size(-1)), y.view(-1))

                loss.backward()

                # Gradient clipping
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)

                optimizer.step()
                scheduler.step()

                epoch_loss += loss.item()
                n_batches += 1

            avg_loss = epoch_loss / max(n_batches, 1)
            epoch_time = time.time() - epoch_start
            perplexity = math.exp(min(avg_loss, 20))

            log(f"   [Época {epoch+1}/{epochs}] Loss: {avg_loss:.4f} | Perplejidad: {perplexity:.1f} | Tiempo: {epoch_time:.1f}s | LR: {scheduler.get_last_lr()[0]:.6f}")

            # Guardar mejor modelo
            if avg_loss < best_loss:
                best_loss = avg_loss
                self._save_checkpoint("best")

        # Guardar checkpoint final
        self._save_checkpoint("latest")

        total_time = time.time() - training_start
        log(f"\n✅ Entrenamiento completado en {total_time:.1f}s")
        log(f"   Mejor Loss: {best_loss:.4f} | Perplejidad: {math.exp(min(best_loss, 20)):.1f}")

        return {
            "status": "success",
            "epochs": epochs,
            "best_loss": round(best_loss, 4),
            "perplexity": round(math.exp(min(best_loss, 20)), 1),
            "parameters": n_params,
            "vocab_size": self.tokenizer.vocab_len,
            "training_time_seconds": round(total_time, 1),
            "logs": logs,
        }

    def _save_checkpoint(self, name: str):
        """Guarda modelo y metadata."""
        path = os.path.join(self.models_dir, f"{name}.pt")
        torch.save({
            "model_state_dict": self.model.state_dict(),
            "model_config": {
                "vocab_size": self.tokenizer.vocab_len,
                "d_model": self.model.d_model,
                "n_heads": self.model.blocks[0].attention.n_heads,
                "n_layers": len(self.model.blocks),
                "d_ff": self.model.blocks[0].feed_forward.linear1.out_features,
                "max_seq_len": self.model.max_seq_len,
            },
        }, path)

    def load_model(self) -> bool:
        """Carga el modelo más reciente desde disco."""
        # Intentar cargar 'best', luego 'latest'
        for name in ["best", "latest"]:
            path = os.path.join(self.models_dir, f"{name}.pt")
            if os.path.exists(path):
                checkpoint = torch.load(path, map_location="cpu", weights_only=False)
                config = checkpoint["model_config"]

                self.model = XuperTransformer(
                    vocab_size=config["vocab_size"],
                    d_model=config["d_model"],
                    n_heads=config["n_heads"],
                    n_layers=config["n_layers"],
                    d_ff=config["d_ff"],
                    max_seq_len=config["max_seq_len"],
                )
                self.model.load_state_dict(checkpoint["model_state_dict"])
                self.model.eval()

                # Cargar tokenizador
                if os.path.exists(self.tokenizer_path):
                    self.tokenizer = BPETokenizer()
                    self.tokenizer.load(self.tokenizer_path)

                print(f"✅ Modelo '{name}' cargado: {self.model.count_parameters():,} params")
                return True

        return False

    def generate_response(self, prompt: str, context: str = "", max_tokens: int = 150, temperature: float = 0.8) -> str:
        """
        Genera una respuesta usando el Transformer + contexto RAG.
        """
        if not self.model or not self.tokenizer:
            return "[Error: Modelo no cargado. Entrena primero con /api/brain/train]"

        # Construir prompt con contexto RAG
        if context:
            full_prompt = f"Contexto:\n{context}\n\nPregunta: {prompt}\nRespuesta:"
        else:
            full_prompt = f"Pregunta: {prompt}\nRespuesta:"

        # Tokenizar
        input_ids = self.tokenizer.encode(full_prompt, add_special=True)

        # Truncar si es muy largo
        max_input = self.model.max_seq_len - max_tokens
        if len(input_ids) > max_input:
            input_ids = input_ids[:max_input]

        input_tensor = torch.tensor([input_ids], dtype=torch.long)

        # Generar
        with torch.no_grad():
            output_ids = self.model.generate(
                input_tensor,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_k=50,
                top_p=0.9,
                eos_token_id=self.tokenizer.token_to_id.get("<EOS>", 3),
            )

        # Decodificar solo los tokens nuevos
        generated_ids = output_ids[0, len(input_ids):].tolist()
        response = self.tokenizer.decode(generated_ids)

        return response
