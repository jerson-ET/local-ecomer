"""
XuperBrain — Tokenizador BPE (Byte Pair Encoding) desde cero.
Convierte texto humano en secuencias de tokens numéricos.

Construido 100% desde cero por Jerson. Sin dependencias de tokenizers
de terceros (no HuggingFace, no tiktoken, no SentencePiece).

Algoritmo BPE:
1. Empieza con un vocabulario de caracteres individuales (bytes).
2. Cuenta los pares de tokens más frecuentes en el corpus.
3. Fusiona el par más frecuente en un nuevo token.
4. Repite hasta alcanzar el tamaño de vocabulario deseado.
"""

import re
import json
import os
from typing import List, Dict, Tuple, Optional
from collections import Counter


class BPETokenizer:
    """Tokenizador Byte Pair Encoding construido desde cero."""

    # Tokens especiales
    PAD_TOKEN = "<PAD>"
    UNK_TOKEN = "<UNK>"
    BOS_TOKEN = "<BOS>"   # Beginning of sequence
    EOS_TOKEN = "<EOS>"   # End of sequence
    SEP_TOKEN = "<SEP>"   # Separator

    SPECIAL_TOKENS = [PAD_TOKEN, UNK_TOKEN, BOS_TOKEN, EOS_TOKEN, SEP_TOKEN]

    def __init__(self, vocab_size: int = 8000):
        self.vocab_size = vocab_size
        self.token_to_id: Dict[str, int] = {}
        self.id_to_token: Dict[int, str] = {}
        self.merges: List[Tuple[str, str]] = []
        self._trained = False

    def train(self, texts: List[str]):
        """
        Entrena el tokenizador BPE sobre un corpus de textos.
        Aprende las fusiones de pares más frecuentes.
        """
        # 1. Inicializar vocabulario con tokens especiales
        vocab = {}
        for i, token in enumerate(self.SPECIAL_TOKENS):
            vocab[token] = i

        # 2. Pre-tokenizar: dividir en palabras y convertir a caracteres
        word_freqs: Dict[Tuple[str, ...], int] = Counter()

        for text in texts:
            # Limpiar y dividir en palabras
            words = self._pre_tokenize(text)
            for word in words:
                # Cada palabra es una tupla de caracteres + marcador de fin de palabra
                chars = tuple(list(word) + ["</w>"])
                word_freqs[chars] += 1

        # 3. Agregar todos los caracteres individuales al vocabulario
        all_chars = set()
        for word_chars in word_freqs.keys():
            all_chars.update(word_chars)

        for char in sorted(all_chars):
            if char not in vocab:
                vocab[char] = len(vocab)

        # 4. Iterativamente fusionar los pares más frecuentes
        merges = []
        current_words = dict(word_freqs)

        target_merges = self.vocab_size - len(vocab)
        print(f"   Vocabulario base: {len(vocab)} tokens")
        print(f"   Fusiones a aprender: {target_merges}")

        for i in range(target_merges):
            # Contar frecuencia de todos los pares adyacentes
            pair_freqs = Counter()
            for word_chars, freq in current_words.items():
                for j in range(len(word_chars) - 1):
                    pair = (word_chars[j], word_chars[j + 1])
                    pair_freqs[pair] += freq

            if not pair_freqs:
                break

            # Encontrar el par más frecuente
            best_pair = pair_freqs.most_common(1)[0][0]
            best_freq = pair_freqs[best_pair]

            if best_freq < 2:
                break  # No vale la pena fusionar pares que aparecen solo 1 vez

            # Crear nuevo token fusionado
            new_token = best_pair[0] + best_pair[1]
            merges.append(best_pair)
            vocab[new_token] = len(vocab)

            # Aplicar la fusión a todas las palabras
            new_words = {}
            for word_chars, freq in current_words.items():
                new_word = self._apply_merge(word_chars, best_pair, new_token)
                new_words[new_word] = freq
            current_words = new_words

            if (i + 1) % 500 == 0:
                print(f"   Fusión {i+1}/{target_merges}: '{best_pair[0]}' + '{best_pair[1]}' → '{new_token}' (freq: {best_freq})")

        # Guardar resultado
        self.token_to_id = vocab
        self.id_to_token = {v: k for k, v in vocab.items()}
        self.merges = merges
        self._trained = True

        print(f"   ✅ Tokenizador entrenado: {len(vocab)} tokens, {len(merges)} fusiones")

    def encode(self, text: str, add_special: bool = True) -> List[int]:
        """Convierte texto a una lista de IDs de tokens."""
        if not self._trained:
            raise ValueError("Tokenizador no entrenado.")

        tokens = []
        if add_special:
            tokens.append(self.token_to_id[self.BOS_TOKEN])

        words = self._pre_tokenize(text)
        for word in words:
            word_tokens = list(word) + ["</w>"]

            # Aplicar todas las fusiones aprendidas en orden
            for merge_pair in self.merges:
                new_token = merge_pair[0] + merge_pair[1]
                i = 0
                new_word_tokens = []
                while i < len(word_tokens):
                    if i < len(word_tokens) - 1 and word_tokens[i] == merge_pair[0] and word_tokens[i + 1] == merge_pair[1]:
                        new_word_tokens.append(new_token)
                        i += 2
                    else:
                        new_word_tokens.append(word_tokens[i])
                        i += 1
                word_tokens = new_word_tokens

            # Convertir tokens a IDs
            for t in word_tokens:
                tokens.append(self.token_to_id.get(t, self.token_to_id[self.UNK_TOKEN]))

        if add_special:
            tokens.append(self.token_to_id[self.EOS_TOKEN])

        return tokens

    def decode(self, ids: List[int]) -> str:
        """Convierte una lista de IDs de tokens a texto."""
        if not self._trained:
            raise ValueError("Tokenizador no entrenado.")

        tokens = []
        for token_id in ids:
            token = self.id_to_token.get(token_id, self.UNK_TOKEN)
            if token in self.SPECIAL_TOKENS:
                continue
            tokens.append(token)

        text = "".join(tokens)
        # Restaurar espacios donde estaba el marcador de fin de palabra
        text = text.replace("</w>", " ")
        return text.strip()

    def _pre_tokenize(self, text: str) -> List[str]:
        """Divide texto en palabras individuales."""
        text = text.lower().strip()
        # Separar por espacios y puntuación
        words = re.findall(r"[a-záéíóúüñ]+|[0-9]+|[^\sa-záéíóúüñ0-9]", text)
        return [w for w in words if w.strip()]

    def _apply_merge(self, word: Tuple[str, ...], pair: Tuple[str, str], new_token: str) -> Tuple[str, ...]:
        """Aplica una fusión de par a una palabra tokenizada."""
        result = []
        i = 0
        while i < len(word):
            if i < len(word) - 1 and word[i] == pair[0] and word[i + 1] == pair[1]:
                result.append(new_token)
                i += 2
            else:
                result.append(word[i])
                i += 1
        return tuple(result)

    def save(self, path: str):
        """Guarda el tokenizador en disco."""
        os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
        data = {
            "vocab_size": self.vocab_size,
            "token_to_id": self.token_to_id,
            "merges": self.merges,
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)

    def load(self, path: str):
        """Carga un tokenizador desde disco."""
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.vocab_size = data["vocab_size"]
        self.token_to_id = data["token_to_id"]
        self.id_to_token = {int(v): k for k, v in self.token_to_id.items()}
        self.merges = [tuple(m) for m in data["merges"]]
        self._trained = True

    @property
    def vocab_len(self) -> int:
        return len(self.token_to_id)
