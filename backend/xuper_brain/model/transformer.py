"""
XuperBrain — Modelo Transformer desde cero.
Arquitectura GPT-style (decoder-only) construida 100% con PyTorch puro.

Matemáticas implementadas:
- Multi-Head Self-Attention: Q·K^T / √d_k (Vaswani et al. 2017)
- Positional Encoding sinusoidal
- Layer Normalization
- Feed-Forward Networks con GELU activation
- Causal masking para generación autoregresiva

Sin dependencias de HuggingFace transformers.
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional, Tuple


class PositionalEncoding(nn.Module):
    """
    Codificación posicional sinusoidal.
    PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
    PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
    """

    def __init__(self, d_model: int, max_seq_len: int = 2048, dropout: float = 0.1):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)

        pe = torch.zeros(max_seq_len, d_model)
        position = torch.arange(0, max_seq_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))

        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)  # (1, max_seq_len, d_model)

        self.register_buffer("pe", pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)


class MultiHeadAttention(nn.Module):
    """
    Atención Multi-Cabeza desde cero.
    Attention(Q, K, V) = softmax(Q·K^T / √d_k) · V
    """

    def __init__(self, d_model: int, n_heads: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % n_heads == 0, "d_model debe ser divisible por n_heads"

        self.d_model = d_model
        self.n_heads = n_heads
        self.d_k = d_model // n_heads

        # Proyecciones lineales para Q, K, V
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

        self.dropout = nn.Dropout(p=dropout)

    def forward(self, x: torch.Tensor, mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        batch_size, seq_len, _ = x.shape

        # Proyectar Q, K, V y dividir en cabezas
        Q = self.W_q(x).view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)
        K = self.W_k(x).view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)
        V = self.W_v(x).view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)

        # Calcular atención: softmax(Q·K^T / √d_k) · V
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, float("-inf"))

        attention_weights = F.softmax(scores, dim=-1)
        attention_weights = self.dropout(attention_weights)

        context = torch.matmul(attention_weights, V)

        # Concatenar cabezas y proyectar
        context = context.transpose(1, 2).contiguous().view(batch_size, seq_len, self.d_model)
        output = self.W_o(context)

        return output


class FeedForward(nn.Module):
    """Red Feed-Forward con GELU activation."""

    def __init__(self, d_model: int, d_ff: int, dropout: float = 0.1):
        super().__init__()
        self.linear1 = nn.Linear(d_model, d_ff)
        self.linear2 = nn.Linear(d_ff, d_model)
        self.dropout = nn.Dropout(p=dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.linear2(self.dropout(F.gelu(self.linear1(x))))


class TransformerBlock(nn.Module):
    """Un bloque Transformer (Pre-LayerNorm style)."""

    def __init__(self, d_model: int, n_heads: int, d_ff: int, dropout: float = 0.1):
        super().__init__()
        self.attention = MultiHeadAttention(d_model, n_heads, dropout)
        self.feed_forward = FeedForward(d_model, d_ff, dropout)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(p=dropout)

    def forward(self, x: torch.Tensor, mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        # Pre-LN Transformer: Norm → Attention → Residual
        normed = self.norm1(x)
        attended = self.attention(normed, mask)
        x = x + self.dropout(attended)

        # Pre-LN: Norm → FFN → Residual
        normed = self.norm2(x)
        fed = self.feed_forward(normed)
        x = x + self.dropout(fed)

        return x


class XuperTransformer(nn.Module):
    """
    Modelo Transformer GPT-style construido desde cero.

    Configuraciones disponibles:
    - "nano":  d=128,  h=4,  L=4,  ~2M params  (entrena rápido en CPU)
    - "micro": d=256,  h=8,  L=6,  ~10M params (bueno para CPU 16GB)
    - "small": d=512,  h=8,  L=8,  ~40M params (necesita paciencia en CPU)
    """

    CONFIGS = {
        "nano": {"d_model": 128, "n_heads": 4, "n_layers": 4, "d_ff": 512, "dropout": 0.1},
        "micro": {"d_model": 256, "n_heads": 8, "n_layers": 6, "d_ff": 1024, "dropout": 0.1},
        "small": {"d_model": 512, "n_heads": 8, "n_layers": 8, "d_ff": 2048, "dropout": 0.1},
    }

    def __init__(
        self,
        vocab_size: int,
        d_model: int = 256,
        n_heads: int = 8,
        n_layers: int = 6,
        d_ff: int = 1024,
        max_seq_len: int = 512,
        dropout: float = 0.1,
        pad_token_id: int = 0,
    ):
        super().__init__()
        self.d_model = d_model
        self.max_seq_len = max_seq_len
        self.pad_token_id = pad_token_id

        # Token embedding + positional encoding
        self.token_embedding = nn.Embedding(vocab_size, d_model, padding_idx=pad_token_id)
        self.pos_encoding = PositionalEncoding(d_model, max_seq_len, dropout)

        # Stack de bloques Transformer
        self.blocks = nn.ModuleList([
            TransformerBlock(d_model, n_heads, d_ff, dropout) for _ in range(n_layers)
        ])

        self.final_norm = nn.LayerNorm(d_model)

        # Head de generación de lenguaje (predicción del siguiente token)
        self.lm_head = nn.Linear(d_model, vocab_size, bias=False)

        # Weight tying (compartir pesos entre embedding y lm_head)
        self.lm_head.weight = self.token_embedding.weight

        # Inicialización de pesos
        self.apply(self._init_weights)

    def _init_weights(self, module):
        if isinstance(module, nn.Linear):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.padding_idx is not None:
                module.weight.data[module.padding_idx].zero_()

    def forward(self, input_ids: torch.Tensor) -> torch.Tensor:
        batch_size, seq_len = input_ids.shape

        # Crear máscara causal (triangular inferior) para autoregresión
        causal_mask = torch.tril(torch.ones(seq_len, seq_len, device=input_ids.device))
        causal_mask = causal_mask.unsqueeze(0).unsqueeze(0)  # (1, 1, seq, seq)

        # Embedding + posición
        x = self.token_embedding(input_ids) * math.sqrt(self.d_model)
        x = self.pos_encoding(x)

        # Pasar por cada bloque Transformer
        for block in self.blocks:
            x = block(x, mask=causal_mask)

        x = self.final_norm(x)

        # Proyectar a vocabulario para predicción
        logits = self.lm_head(x)

        return logits

    @torch.no_grad()
    def generate(
        self,
        input_ids: torch.Tensor,
        max_new_tokens: int = 200,
        temperature: float = 0.8,
        top_k: int = 50,
        top_p: float = 0.9,
        eos_token_id: int = 3,
    ) -> torch.Tensor:
        """
        Genera texto token por token (autoregresivo).
        Usa sampling con temperature, top-k y top-p (nucleus sampling).
        """
        self.eval()
        generated = input_ids.clone()

        for _ in range(max_new_tokens):
            # Tomar solo los últimos max_seq_len tokens
            context = generated[:, -self.max_seq_len:]

            # Forward pass
            logits = self.forward(context)

            # Tomar logits del último token
            next_logits = logits[:, -1, :] / temperature

            # Top-K filtering
            if top_k > 0:
                indices_to_remove = next_logits < torch.topk(next_logits, top_k)[0][..., -1, None]
                next_logits[indices_to_remove] = float("-inf")

            # Top-P (nucleus) filtering
            if top_p < 1.0:
                sorted_logits, sorted_indices = torch.sort(next_logits, descending=True)
                cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
                sorted_indices_to_remove = cumulative_probs > top_p
                sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
                sorted_indices_to_remove[..., 0] = 0
                indices_to_remove = sorted_indices_to_remove.scatter(1, sorted_indices, sorted_indices_to_remove)
                next_logits[indices_to_remove] = float("-inf")

            # Muestrear siguiente token
            probs = F.softmax(next_logits, dim=-1)
            next_token = torch.multinomial(probs, num_samples=1)

            generated = torch.cat([generated, next_token], dim=1)

            # Parar si encontramos EOS
            if next_token.item() == eos_token_id:
                break

        return generated

    def count_parameters(self) -> int:
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

    @classmethod
    def from_config(cls, config_name: str, vocab_size: int, **kwargs) -> "XuperTransformer":
        """Crea un modelo desde una configuración predefinida."""
        if config_name not in cls.CONFIGS:
            raise ValueError(f"Config '{config_name}' no existe. Opciones: {list(cls.CONFIGS.keys())}")

        config = cls.CONFIGS[config_name].copy()
        config.update(kwargs)
        return cls(vocab_size=vocab_size, **config)
