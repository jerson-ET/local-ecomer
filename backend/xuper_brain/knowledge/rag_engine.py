"""
XuperBrain — Motor de Conocimiento RAG desde cero.
Retrieval-Augmented Generation: aprende de textos, URLs y archivos.

Proceso:
1. INGERIR: Recibe texto, URL o archivo → extrae texto limpio.
2. CHUNKING: Divide el texto en fragmentos de ~300 palabras con overlap.
3. VECTORIZAR: Convierte cada fragmento en un vector TF-IDF.
4. ALMACENAR: Guarda vectores + texto en disco (base de vectores local).
5. BUSCAR: Ante una pregunta, vectoriza la consulta y encuentra
   los fragmentos más similares por similitud coseno.
6. RAZONAR: Envía los fragmentos relevantes + pregunta al Transformer.

Todo local, sin Pinecone, sin Weaviate, sin ChromaDB.
"""

import os
import re
import json
import math
import hashlib
import time
import numpy as np
from typing import List, Dict, Optional, Tuple
from collections import Counter


class TextExtractor:
    """Extrae texto limpio de diferentes fuentes."""

    @staticmethod
    def from_url(url: str) -> str:
        """Extrae texto de una URL (página web)."""
        import requests
        from bs4 import BeautifulSoup

        headers = {
            "User-Agent": "XuperBrain/1.0 (Knowledge Crawler)"
        }

        try:
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            response.encoding = response.apparent_encoding

            soup = BeautifulSoup(response.text, "html.parser")

            # Eliminar scripts, estilos y nav
            for tag in soup(["script", "style", "nav", "footer", "header", "aside", "iframe"]):
                tag.decompose()

            # Extraer texto
            text = soup.get_text(separator="\n", strip=True)

            # Limpiar líneas vacías y espacios excesivos
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            text = "\n".join(lines)

            return text
        except Exception as e:
            raise ValueError(f"Error extrayendo texto de {url}: {e}")

    @staticmethod
    def from_file(filepath: str) -> str:
        """Extrae texto de un archivo local (.txt, .md, .py, etc.)."""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Archivo no encontrado: {filepath}")

        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    @staticmethod
    def from_text(text: str) -> str:
        """Limpia texto directo."""
        return text.strip()


class TextChunker:
    """Divide texto en fragmentos con overlap para mejor contexto."""

    def __init__(self, chunk_size: int = 300, overlap: int = 50):
        """
        Args:
            chunk_size: Número de palabras por fragmento.
            overlap: Palabras de solapamiento entre fragmentos.
        """
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk(self, text: str) -> List[Dict]:
        """Divide texto en fragmentos con metadata."""
        words = text.split()
        chunks = []
        start = 0

        while start < len(words):
            end = min(start + self.chunk_size, len(words))
            chunk_words = words[start:end]
            chunk_text = " ".join(chunk_words)

            chunks.append({
                "text": chunk_text,
                "word_count": len(chunk_words),
                "start_word": start,
                "end_word": end,
            })

            if end >= len(words):
                break

            start += self.chunk_size - self.overlap

        return chunks


class VectorStore:
    """
    Base de datos de vectores local construida desde cero.
    Usa TF-IDF + similitud coseno para búsqueda semántica.
    """

    def __init__(self, store_path: str):
        self.store_path = store_path
        os.makedirs(store_path, exist_ok=True)

        self.documents: List[Dict] = []  # {text, source, chunk_id, ...}
        self.vocabulary: Dict[str, int] = {}
        self.idf: Optional[np.ndarray] = None
        self.vectors: Optional[np.ndarray] = None
        self._index_dirty = True

        # Cargar si existe
        self._load()

    def add_document(self, text: str, source: str, metadata: Dict = None):
        """Agrega un documento a la base."""
        doc_id = hashlib.md5(text.encode()).hexdigest()[:12]

        # Verificar que no esté duplicado
        for doc in self.documents:
            if doc.get("doc_id") == doc_id:
                return  # Ya existe

        doc = {
            "doc_id": doc_id,
            "text": text,
            "source": source,
            "metadata": metadata or {},
            "added_at": time.time(),
        }
        self.documents.append(doc)
        self._index_dirty = True

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Busca los documentos más relevantes para una consulta."""
        if not self.documents:
            return []

        if self._index_dirty:
            self._rebuild_index()

        # Vectorizar la consulta
        query_vec = self._vectorize_query(query)

        # Calcular similitud coseno con todos los documentos
        scores = []
        for i in range(len(self.documents)):
            sim = self._cosine_sim(query_vec, self.vectors[i])
            if sim > 0.01:
                scores.append((i, sim))

        # Ordenar por relevancia
        scores.sort(key=lambda x: x[1], reverse=True)

        results = []
        for idx, score in scores[:top_k]:
            doc = dict(self.documents[idx])
            doc["relevance_score"] = round(score, 4)
            results.append(doc)

        return results

    def _tokenize(self, text: str) -> List[str]:
        """Tokenización simple para TF-IDF."""
        text = text.lower()
        text = re.sub(r"[^a-záéíóúüñ0-9\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()

        # Stopwords en español
        stopwords = {
            "el", "la", "los", "las", "un", "una", "de", "del", "al", "en",
            "con", "por", "para", "a", "y", "o", "que", "es", "son", "ser",
            "estar", "ha", "he", "fue", "como", "más", "muy", "no", "si",
            "su", "sus", "mi", "tu", "este", "esta", "estos", "estas",
            "se", "le", "les", "lo", "me", "te", "nos", "todo", "hay",
        }

        words = text.split()
        return [w for w in words if w not in stopwords and len(w) > 1]

    def _rebuild_index(self):
        """Reconstruye el índice TF-IDF de todos los documentos."""
        if not self.documents:
            return

        # Extraer tokens de cada documento
        all_tokens = [self._tokenize(doc["text"]) for doc in self.documents]

        # Construir vocabulario
        vocab_set = set()
        for tokens in all_tokens:
            vocab_set.update(tokens)
        self.vocabulary = {w: i for i, w in enumerate(sorted(vocab_set))}

        vocab_size = len(self.vocabulary)
        n_docs = len(self.documents)

        # Calcular IDF
        doc_freq = np.zeros(vocab_size)
        for tokens in all_tokens:
            seen = set()
            for t in tokens:
                if t in self.vocabulary and t not in seen:
                    doc_freq[self.vocabulary[t]] += 1
                    seen.add(t)
        doc_freq = np.maximum(doc_freq, 1)
        self.idf = np.log(n_docs / doc_freq) + 1.0

        # Vectorizar todos los documentos
        self.vectors = np.zeros((n_docs, vocab_size))
        for i, tokens in enumerate(all_tokens):
            self.vectors[i] = self._compute_tfidf(tokens)

        self._index_dirty = False
        self._save()

    def _compute_tfidf(self, tokens: List[str]) -> np.ndarray:
        """Calcula vector TF-IDF para una lista de tokens."""
        vec = np.zeros(len(self.vocabulary))
        if not tokens:
            return vec

        counts = Counter(tokens)
        total = len(tokens)

        for term, count in counts.items():
            if term in self.vocabulary:
                idx = self.vocabulary[term]
                tf = count / total
                vec[idx] = tf * self.idf[idx]

        # Normalización L2
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm

        return vec

    def _vectorize_query(self, query: str) -> np.ndarray:
        """Vectoriza una consulta."""
        tokens = self._tokenize(query)
        return self._compute_tfidf(tokens)

    def _cosine_sim(self, a: np.ndarray, b: np.ndarray) -> float:
        """Similitud coseno entre dos vectores."""
        dot = np.dot(a, b)
        na = np.linalg.norm(a)
        nb = np.linalg.norm(b)
        if na == 0 or nb == 0:
            return 0.0
        return float(dot / (na * nb))

    def _save(self):
        """Guarda la base de vectores en disco."""
        data = {
            "documents": self.documents,
            "vocabulary": self.vocabulary,
        }
        path = os.path.join(self.store_path, "vector_store.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        if self.idf is not None:
            np.save(os.path.join(self.store_path, "idf.npy"), self.idf)
        if self.vectors is not None:
            np.save(os.path.join(self.store_path, "vectors.npy"), self.vectors)

    def _load(self):
        """Carga la base de vectores desde disco."""
        path = os.path.join(self.store_path, "vector_store.json")
        if not os.path.exists(path):
            return

        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.documents = data.get("documents", [])
            self.vocabulary = data.get("vocabulary", {})

            idf_path = os.path.join(self.store_path, "idf.npy")
            vec_path = os.path.join(self.store_path, "vectors.npy")
            if os.path.exists(idf_path) and os.path.exists(vec_path):
                self.idf = np.load(idf_path)
                self.vectors = np.load(vec_path)
                self._index_dirty = False
            else:
                self._index_dirty = True
        except Exception:
            self.documents = []
            self._index_dirty = True

    @property
    def total_documents(self) -> int:
        return len(self.documents)

    @property
    def total_words(self) -> int:
        return sum(len(d["text"].split()) for d in self.documents)


class KnowledgeEngine:
    """
    Motor de conocimiento completo.
    Orquesta: Extracción → Chunking → Vectorización → Búsqueda.
    """

    def __init__(self, store_path: str):
        self.extractor = TextExtractor()
        self.chunker = TextChunker(chunk_size=300, overlap=50)
        self.store = VectorStore(store_path)

    def ingest_text(self, text: str, source_name: str = "texto_directo") -> Dict:
        """Ingiere texto directo en la base de conocimientos."""
        clean_text = self.extractor.from_text(text)
        chunks = self.chunker.chunk(clean_text)

        for chunk in chunks:
            self.store.add_document(
                text=chunk["text"],
                source=source_name,
                metadata={"word_count": chunk["word_count"]},
            )

        self.store._rebuild_index()
        return {"source": source_name, "chunks_added": len(chunks), "total_docs": self.store.total_documents}

    def ingest_url(self, url: str) -> Dict:
        """Extrae texto de una URL y lo indexa."""
        raw_text = self.extractor.from_url(url)
        chunks = self.chunker.chunk(raw_text)

        for chunk in chunks:
            self.store.add_document(
                text=chunk["text"],
                source=url,
                metadata={"word_count": chunk["word_count"]},
            )

        self.store._rebuild_index()
        return {"source": url, "chunks_added": len(chunks), "total_docs": self.store.total_documents}

    def ingest_file(self, filepath: str) -> Dict:
        """Lee un archivo local y lo indexa."""
        raw_text = self.extractor.from_file(filepath)
        chunks = self.chunker.chunk(raw_text)

        for chunk in chunks:
            self.store.add_document(
                text=chunk["text"],
                source=filepath,
                metadata={"word_count": chunk["word_count"]},
            )

        self.store._rebuild_index()
        return {"source": filepath, "chunks_added": len(chunks), "total_docs": self.store.total_documents}

    def query(self, question: str, top_k: int = 5) -> List[Dict]:
        """Busca los fragmentos más relevantes para una pregunta."""
        return self.store.search(question, top_k=top_k)

    def get_context_for_prompt(self, question: str, max_chunks: int = 3) -> str:
        """
        Genera el contexto RAG formateado para inyectar en el prompt
        del modelo Transformer.
        """
        results = self.query(question, top_k=max_chunks)
        if not results:
            return ""

        context_parts = []
        for i, r in enumerate(results):
            context_parts.append(f"[Fuente: {r['source']}]\n{r['text']}")

        return "\n\n---\n\n".join(context_parts)

    @property
    def stats(self) -> Dict:
        return {
            "total_documents": self.store.total_documents,
            "total_words": self.store.total_words,
            "vocabulary_size": len(self.store.vocabulary),
        }
