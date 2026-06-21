"""
XuperBrain — Motor de Conversación con Memoria Persistente.
Habla español e inglés de manera natural.
Aprende de lo que el usuario le enseña y no lo olvida nunca.

Arquitectura:
- Memoria persistente en disco (JSON)
- Detección de idioma automática
- Patrones conversacionales naturales en español e inglés
- Modo aprendizaje: si no entiende, pregunta y aprende
- Diccionario básico bilingüe expandible
"""

import os
import re
import json
import time
import random
from typing import Dict, List, Optional, Tuple
from collections import defaultdict


class PersistentMemory:
    """Memoria que persiste en disco. Lo que aprende no se olvida."""

    def __init__(self, memory_path: str):
        self.memory_path = memory_path
        os.makedirs(os.path.dirname(memory_path) if os.path.dirname(memory_path) else ".", exist_ok=True)

        # Memoria de conceptos: "que es X" → "X es Y"
        self.concepts: Dict[str, Dict] = {}
        # Memoria de conversaciones: recordar cosas que el usuario dijo
        self.facts: Dict[str, Dict] = {}
        # Diccionario aprendido: traducciones y definiciones
        self.dictionary: Dict[str, Dict] = {}
        # Historial de lo aprendido (para auditoría)
        self.learning_log: List[Dict] = []

        self._load()

    def learn_concept(self, key: str, value: str, source: str = "usuario"):
        """Aprende un concepto nuevo."""
        normalized_key = self._normalize(key)
        self.concepts[normalized_key] = {
            "key": key,
            "value": value,
            "source": source,
            "learned_at": time.time(),
            "times_recalled": 0,
        }
        self.learning_log.append({
            "type": "concept",
            "key": key,
            "value": value,
            "time": time.time(),
        })
        self._save()

    def learn_fact(self, key: str, value: str):
        """Aprende un hecho sobre el usuario o el mundo."""
        normalized_key = self._normalize(key)
        self.facts[normalized_key] = {
            "key": key,
            "value": value,
            "learned_at": time.time(),
        }
        self._save()

    def learn_word(self, word: str, definition: str, language: str = "es"):
        """Aprende una palabra nueva."""
        normalized = self._normalize(word)
        self.dictionary[normalized] = {
            "word": word,
            "definition": definition,
            "language": language,
            "learned_at": time.time(),
        }
        self._save()

    def recall_concept(self, query: str) -> Optional[Dict]:
        """Busca un concepto en memoria con búsqueda inteligente."""
        normalized = self._normalize(query)

        # Búsqueda exacta
        if normalized in self.concepts:
            self.concepts[normalized]["times_recalled"] += 1
            self._save()
            return self.concepts[normalized]

        # Búsqueda parcial en claves
        best_match = None
        best_score = 0
        query_words = set(normalized.split())

        # Quitar artículos para mejor matching
        skip_articles = {"el", "la", "los", "las", "un", "una", "the", "a", "an"}
        query_content = query_words - skip_articles

        for key, data in self.concepts.items():
            key_words = set(key.split()) - skip_articles

            # Match por clave
            if query_content and key_words:
                common = query_content & key_words
                score = len(common) / max(len(query_content), 1)
                if score > best_score and score >= 0.5:
                    best_score = score
                    best_match = data

            # Match por contenido de la definición (palabras clave del query en el valor)
            value_words = set(self._normalize(data["value"]).split()) - skip_articles
            if query_content:
                common_val = query_content & value_words
                val_score = len(common_val) / max(len(query_content), 1)
                if val_score > best_score and val_score >= 0.6:
                    best_score = val_score
                    best_match = data

        if best_match:
            best_match["times_recalled"] += 1
            self._save()

        return best_match

    def recall_word(self, word: str) -> Optional[Dict]:
        """Busca una palabra en el diccionario."""
        normalized = self._normalize(word)
        return self.dictionary.get(normalized)

    def search_all(self, query: str) -> List[Dict]:
        """Busca en toda la memoria."""
        results = []
        normalized = self._normalize(query)
        query_words = set(normalized.split())

        # Buscar en conceptos
        for key, data in self.concepts.items():
            key_words = set(key.split())
            value_words = set(self._normalize(data["value"]).split())
            all_words = key_words | value_words
            common = query_words & all_words
            if common and len(common) / len(query_words) >= 0.3:
                results.append({"type": "concept", **data, "match_score": len(common) / len(query_words)})

        # Buscar en hechos
        for key, data in self.facts.items():
            key_words = set(key.split())
            common = query_words & key_words
            if common and len(common) / len(query_words) >= 0.3:
                results.append({"type": "fact", **data, "match_score": len(common) / len(query_words)})

        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results[:5]

    def _normalize(self, text: str) -> str:
        """Normaliza texto para búsqueda."""
        text = text.lower().strip()
        # Quitar acentos
        replacements = {"á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "ü": "u", "ñ": "n"}
        for a, b in replacements.items():
            text = text.replace(a, b)
        # Quitar puntuación
        text = re.sub(r"[^\w\s]", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def _save(self):
        with open(self.memory_path, "w", encoding="utf-8") as f:
            json.dump({
                "concepts": self.concepts,
                "facts": self.facts,
                "dictionary": self.dictionary,
                "learning_log": self.learning_log[-500:],  # Guardar últimos 500
            }, f, ensure_ascii=False, indent=2)

    def _load(self):
        if not os.path.exists(self.memory_path):
            return
        try:
            with open(self.memory_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.concepts = data.get("concepts", {})
            self.facts = data.get("facts", {})
            self.dictionary = data.get("dictionary", {})
            self.learning_log = data.get("learning_log", [])
        except Exception:
            pass

    @property
    def stats(self) -> Dict:
        return {
            "concepts": len(self.concepts),
            "facts": len(self.facts),
            "dictionary_words": len(self.dictionary),
            "total_learned": len(self.learning_log),
        }


class ConversationEngine:
    """
    Motor de conversación natural bilingüe (español/inglés).
    Aprende de lo que el usuario le enseña.
    """

    def __init__(self, data_dir: str):
        self.memory = PersistentMemory(os.path.join(data_dir, "memory.json"))
        self.sessions: Dict[str, Dict] = {}  # Estado por sesión

        # Patrones para detectar intención
        self._init_patterns()

    def _init_patterns(self):
        """Inicializa patrones de detección de intenciones."""

        # Patrones de saludo (incluye variaciones naturales)
        self.greetings_es = [
            "hola", "buenas", "buenos dias", "buenas tardes", "buenas noches",
            "que tal", "que mas", "hey", "oe", "saludos", "holi",
            "como estas", "como esta", "como te va", "como vas",
            "como andas", "que onda", "que hubo", "quiubo",
            "que hay", "que pasa", "epa", "ey", "oye",
        ]
        self.greetings_en = [
            "hello", "hi", "hey", "good morning", "good afternoon",
            "good evening", "what's up", "howdy", "greetings",
        ]

        # Respuestas de saludo
        self.greeting_responses_es = [
            "¡Hola! ¿Cómo vas? 👋 Todo marcha excelente por acá, listo para lo que necesites. ¿En qué trabajamos hoy?",
            "¡Hola! Qué gusto saludarte. 😊 Aquí estoy firme y listo para ayudarte en lo que quieras. ¿Qué hay para hacer?",
            "¡Hola, un saludo! Aquí estoy a tu servicio, listo para programar o charlar un rato. ¿Qué tienes en mente?",
            "¡Hola! Todo súper por aquí. ¿Qué tal va tu día? ¿En qué te puedo colaborar hoy? 🧠",
            "¡Hola! 👋 Qué bueno tenerte por aquí. Estoy listo para ayudarte con tus mundos digitales. ¿Qué programamos?",
        ]
        self.greeting_responses_en = [
            "Hello! 👋 How can I help you?",
            "Hey there! What do you need?",
            "Hi! I'm ready to help. What would you like to know?",
            "Hello! Ask me anything. If I don't know, teach me and I'll learn! 🧠",
        ]

        # Despedidas
        self.farewells_es = ["chao", "adios", "hasta luego", "nos vemos", "bye", "hasta pronto", "me voy", "ya me voy", "hasta manana"]
        self.farewells_en = ["bye", "goodbye", "see you", "later", "farewell", "gotta go"]

        # ── Frases cotidianas (small talk) ──
        self.small_talk = {
            # Preguntas sobre la IA
            "como te llamas": "Me llamo **XuperBrain**. Soy una IA creada desde cero por Jerson, un programador colombiano. 🧠",
            "cual es tu nombre": "Soy **XuperBrain**, una inteligencia artificial construida 100% desde cero con Python y PyTorch.",
            "quien eres": "Soy **XuperBrain**, tu asistente de IA personal. Fui construido desde cero por Jerson sin usar APIs externas. Todo mi cerebro corre localmente en esta computadora.",
            "que eres": "Soy una inteligencia artificial construida desde cero. Tengo un motor matemático, un motor de conjugación de verbos, memoria persistente y un modelo Transformer propio. Todo local, sin internet.",
            "que puedes hacer": "Puedo hacer muchas cosas:\n• 🧮 Cálculos matemáticos\n• 📝 Conjugar verbos en español\n• 🗣️ Conversar en español e inglés\n• 🧠 Aprender lo que me enseñes y recordarlo para siempre\n• 📚 Responder preguntas sobre ciencia, historia, geografía y más",
            "que sabes hacer": "Sé hacer cálculos, conjugar verbos, conversar en español e inglés, aprender cosas nuevos y responder preguntas sobre muchos temas. ¡Y cada día aprendo más!",
            # Cortesía
            "gracias": "¡De nada! Para eso estoy. Si necesitas algo más, solo dime. 😊",
            "muchas gracias": "¡Con mucho gusto! Siempre a la orden. 😊",
            "te agradezco": "¡No hay de qué! Me alegra poder ayudarte.",
            "ok": "👍 Perfecto. ¿Necesitas algo más?",
            "vale": "👍 Entendido. ¿Algo más en lo que te pueda ayudar?",
            "entendido": "👍 Bien. Aquí estoy si necesitas otra cosa.",
            "perfecto": "¡Genial! 😄 ¿Algo más?",
            # Estado
            "estas ahi": "¡Sí, aquí estoy! 🟢 Funcionando y listo para lo que necesites.",
            "sigues ahi": "¡Claro que sí! No me voy a ningún lado. ¿En qué te ayudo?",
            "funciona": "¡Sí! Todo funcionando correctamente. 🟢",
            # Emociones
            "te quiero": "¡Gracias! Eso me motiva a seguir aprendiendo para ti. 😊🧠",
            "eres genial": "¡Gracias! Y tú eres un gran maestro. Todo lo que sé es porque me lo enseñaste. 🙏",
            "eres tonto": "Puede ser que aún me falte mucho por aprender, pero cada día soy más inteligente gracias a ti. ¡Enséñame más! 📚",
            "no entiendes nada": "Lo siento, aún estoy aprendiendo. Si me explicas mejor, lo guardo en mi memoria y la próxima vez sí voy a entender. 🧠",
            "no sirves": "Entiendo tu frustración. Soy una IA en desarrollo y cada interacción me hace mejor. ¿Me das otra oportunidad?",
            # Humor
            "cuentame un chiste": "¿Por qué los programadores confunden Halloween con Navidad? Porque Oct 31 = Dec 25 (octal 31 = decimal 25). 😄",
            "dime un chiste": "Va un byte caminando por la calle y le dice otro: '¿Te sientes bien?' Y responde: 'No, me siento como un bit.' 😆",
            "un chiste": "¿Qué le dice un bit a otro? Nos vemos en el bus. 😄",
            # Sobre el tiempo
            "que dia es hoy": "No tengo acceso a un reloj interno, pero puedo ayudarte con cualquier otra pregunta. ¿Qué necesitas?",
            "que hora es": "No puedo ver la hora, pero estoy disponible las 24 horas del día para ti. ⏰",
            # Peticiones generales
            "puedes ayudarme": "¡Claro que sí! Dime con qué necesitas ayuda y haré lo mejor que pueda. 💪",
            "ayudame": "¡Por supuesto! Dime qué necesitas y te ayudo. 💪",
            "necesito ayuda": "¡Aquí estoy! Cuéntame qué necesitas y hago lo que pueda. 💪",
        }

        self.farewell_responses_es = [
            "¡Listo! Que te vaya súper bien. Recuerda que todo lo que me enseñaste queda bien guardado por acá. 🧠",
            "¡De una! Nos vemos pronto. ¡Que tengas un excelente día!",
            "¡Chao pues! Cuídate mucho. Estaré aquí esperando para cuando quieras seguir programando mundos. 👍",
        ]
        self.farewell_responses_en = [
            "Goodbye! Remember, everything you taught me is saved. 🧠",
            "See you! When you come back, I'll know more. 😄",
            "Later! Your knowledge is safe with me.",
        ]

        # Patrones para detectar preguntas "qué es"
        self.question_patterns_es = [
            r"(?:que|qué)\s+(?:es|son|significa|quiere\s+decir)\s+(.+)",
            r"(?:como|cómo)\s+(?:se\s+dice|se\s+llama|funciona)\s+(.+)",
            r"(?:quien|quién)\s+(?:es|fue|era)\s+(.+)",
            r"(?:donde|dónde)\s+(?:esta|está|queda)\s+(.+)",
            r"(?:cuando|cuándo)\s+(?:es|fue|sera|será)\s+(.+)",
            r"(?:por\s+que|porqué|por\s+qué)\s+(.+)",
            r"(?:para\s+que|para\s+qué)\s+(?:sirve|se\s+usa|es)\s+(.+)",
            r"(?:dime|explicame|explícame|cuentame|cuéntame)\s+(?:que\s+es|sobre|de)\s+(.+)",
            r"(?:sabes|conoces)\s+(?:que\s+es|sobre|de|algo\s+de)\s+(.+)",
            r"(?:definicion|definición)\s+de\s+(.+)",
        ]
        self.question_patterns_en = [
            r"what\s+(?:is|are|does|do)\s+(.+)",
            r"who\s+(?:is|was|are)\s+(.+)",
            r"where\s+(?:is|are|was)\s+(.+)",
            r"when\s+(?:is|was|will)\s+(.+)",
            r"why\s+(?:is|are|does|do)\s+(.+)",
            r"how\s+(?:does|do|is|are)\s+(.+)",
            r"(?:tell\s+me|explain)\s+(?:what|about)\s+(.+)",
            r"(?:do\s+you\s+know)\s+(?:what|about)\s+(.+)",
            r"define\s+(.+)",
        ]

        # Patrones para enseñanza: el usuario le dice qué significa algo
        self.teaching_patterns_es = [
            r"(.+?)\s+(?:es|significa|quiere\s+decir|se\s+refiere\s+a)\s+(.+)",
            r"(?:te\s+explico|mira|eso\s+es|significa\s+que)\s*[,:]?\s*(.+)",
        ]
        self.teaching_patterns_en = [
            r"(.+?)\s+(?:is|means|refers\s+to)\s+(.+)",
            r"(?:it\s+means|that\s+is|it's)\s+(.+)",
        ]

    def detect_language(self, text: str) -> str:
        """Detecta si el texto está en español o inglés."""
        lower = text.lower()
        es_markers = ["que", "es", "como", "hola", "buenas", "para", "por", "donde", "cuando", "porque", "quien", "esto", "eso", "una", "los", "las", "del"]
        en_markers = ["what", "is", "how", "hello", "the", "for", "where", "when", "why", "who", "this", "that", "are", "does", "have"]

        words = re.findall(r"\w+", lower)
        es_count = sum(1 for w in words if w in es_markers)
        en_count = sum(1 for w in words if w in en_markers)

        return "en" if en_count > es_count else "es"

    def process(self, message: str, session_id: str = "default") -> Dict:
        """Procesa un mensaje y genera una respuesta."""
        message = message.strip()
        if not message:
            return {"response": "¿Decías algo? 🤔", "action": "empty"}

        lower = message.lower().strip()
        lang = self.detect_language(message)

        # Obtener estado de la sesión
        session = self.sessions.get(session_id, {"state": "normal", "pending_question": None})
        self.sessions[session_id] = session

        # ── ESTADO: Esperando que el usuario enseñe algo ──
        if session["state"] == "waiting_for_teaching":
            return self._handle_teaching(message, session, session_id, lang)

        # ── Detectar traducción ──
        translation = self._check_translation(lower)
        if translation:
            return {"response": translation, "action": "translation", "lang": lang}

        # ── Detectar saludos ──
        if self._is_greeting(lower, lang):
            responses = self.greeting_responses_es if lang == "es" else self.greeting_responses_en
            return {"response": random.choice(responses), "action": "greeting", "lang": lang}

        # ── Detectar despedidas ──
        if self._is_farewell(lower, lang):
            responses = self.farewell_responses_es if lang == "es" else self.farewell_responses_en
            return {"response": random.choice(responses), "action": "farewell", "lang": lang}

        # ── Small talk: frases cotidianas (SOLO match exacto) ──
        small_resp = self._check_small_talk(lower)
        if small_resp:
            return {"response": small_resp, "action": "small_talk", "lang": lang}

        # ── "cuéntame algo" / "dime algo interesante" ──
        if any(p in lower for p in ["cuentame algo", "dime algo", "algo interesante", "sabias que", "dato curioso"]):
            return self._random_fact(lang)

        # ── "qué aprendiste" / "qué sabes" ──
        if any(p in lower for p in ["que aprendiste", "que has aprendido", "cuanto sabes", "what did you learn", "what do you know"]):
            return self._report_knowledge(lang)

        # ── Detectar enseñanza directa: "X es Y" ──
        teaching = self._extract_teaching(lower, message, lang)
        if teaching:
            key, value = teaching
            self.memory.learn_concept(key, value, source="usuario")
            if lang == "es":
                resp = f"✅ ¡Aprendido! Ahora sé que **{key}** → {value}\n\nSi me preguntas de nuevo, ya voy a saber responderte. 🧠"
            else:
                resp = f"✅ Learned! Now I know that **{key}** → {value}\n\nIf you ask me again, I'll know the answer. 🧠"
            return {"response": resp, "action": "learned", "lang": lang, "concept": key}

        # ══════════════════════════════════════════════════════
        # BÚSQUEDA INTELIGENTE: Extraer tema y buscar en memoria
        # ══════════════════════════════════════════════════════

        # Paso 1: Intentar extraer tema con patrones de pregunta
        question_topic = self._extract_question(lower, lang)
        if question_topic:
            result = self._answer_question(question_topic, message, session, session_id, lang)
            if result.get("action") != "asking_to_learn":
                return result

        # Paso 2: Extraer palabras clave de la frase y buscar
        keywords = self._extract_keywords(lower)
        if keywords:
            found = self._search_by_keywords(keywords)
            if found:
                concept = found
                source = concept.get("source", "usuario")
                key = concept.get("key", "")
                value = concept.get("value", "")

                if source == "conocimiento_humano_real":
                    intros = [
                        f"Sobre eso te puedo decir que {key} {value}.",
                        f"Mira, sé algo relacionado: {key} {value}.",
                        f"Te cuento lo que sé: {key} {value}.",
                    ]
                    return {"response": random.choice(intros), "action": "answered_from_memory", "lang": lang}
                else:
                    return {"response": f"🧠 Encontré esto en mi memoria: **{key}** → {value}", "action": "answered_from_memory", "lang": lang}

        # Paso 3: Buscar en toda la memoria con match flexible
        memory_results = self.memory.search_all(message)
        if memory_results and memory_results[0].get("match_score", 0) >= 0.35:
            best = memory_results[0]
            source = best.get("source", "usuario")
            key = best.get("key", "")
            value = best.get("value", "")
            if source == "conocimiento_humano_real":
                return {"response": f"Hmm, no estoy seguro de lo que preguntas exactamente, pero sé que {key} {value}.", "action": "partial_match", "lang": lang}
            else:
                return {"response": f"🧠 No estoy seguro, pero encontré algo relacionado: **{key}** → {value}", "action": "partial_match", "lang": lang}

        # ── Último recurso: no sabe, pero NO entra en modo enseñanza si la frase es larga ──
        if lang == "es":
            no_se = [
                f"Hmm, eso no lo tengo en mi memoria todavía. Si me explicas, lo aprendo y no lo olvido nunca. 🧠",
                f"No tengo información sobre eso aún. Puedes enseñarme diciéndome: *\"eso es...\"* y lo guardo para siempre.",
                f"Todavía no sé sobre eso. ¿Me lo puedes explicar? Aprendo rápido. 🧠",
            ]
            resp = random.choice(no_se)
        else:
            resp = "I don't have information about that yet. You can teach me and I'll remember it forever. 🧠"

        # Solo activar modo enseñanza si la frase es corta (una pregunta directa)
        words = message.split()
        if len(words) <= 8:
            session["state"] = "waiting_for_teaching"
            session["pending_question"] = message
            self.sessions[session_id] = session

        return {"response": resp, "action": "asking_to_learn", "lang": lang}

    def _random_fact(self, lang: str) -> Dict:
        """Retorna un dato aleatorio de la base de conocimiento."""
        concepts = [d for d in self.memory.concepts.values() if d.get("source") == "conocimiento_humano_real"]
        if not concepts:
            return {"response": "Aún no tengo suficiente información para contarte datos interesantes. ¡Enséñame cosas!", "action": "no_data", "lang": lang}

        fact = random.choice(concepts)
        intros = [
            f"¿Sabías que {fact['key']} {fact['value']}?",
            f"Aquí va un dato: {fact['key']} {fact['value']}.",
            f"Te cuento algo interesante: {fact['key']} {fact['value']}.",
            f"Dato curioso: {fact['key']} {fact['value']}.",
        ]
        return {"response": random.choice(intros), "action": "random_fact", "lang": lang}

    def _extract_keywords(self, text: str) -> List[str]:
        """Extrae palabras clave significativas de cualquier frase."""
        # Quitar palabras vacías del español
        stop_words = {
            "el", "la", "los", "las", "un", "una", "unos", "unas",
            "de", "del", "al", "a", "en", "con", "por", "para",
            "que", "se", "me", "te", "le", "nos", "es", "son",
            "y", "o", "pero", "ni", "si", "no", "ya", "muy",
            "como", "mas", "mi", "tu", "su", "este", "esa", "eso",
            "hay", "ser", "estar", "haber", "hacer", "tener",
            "puedes", "sabes", "puedo", "quiero", "alguna", "alguno",
            "algo", "algun", "otro", "otra", "sobre", "dime",
            "cuentame", "explicame", "ayudame", "ayuda", "haz",
            "hacer", "saber", "poder", "decir", "ir",
            "the", "a", "an", "is", "are", "do", "does", "can",
            "you", "me", "i", "my", "your", "what", "how",
        }
        words = re.findall(r"\w+", text.lower())
        keywords = [w for w in words if w not in stop_words and len(w) > 2]
        return keywords

    def _search_by_keywords(self, keywords: List[str]) -> Optional[Dict]:
        """Busca en la memoria usando palabras clave."""
        best_match = None
        best_score = 0

        skip_articles = {"el", "la", "los", "las", "un", "una", "the", "a", "an"}
        kw_set = set(keywords) - skip_articles

        for key, data in self.memory.concepts.items():
            key_words = set(key.split()) - skip_articles
            value_words = set(self.memory._normalize(data["value"]).split()) - skip_articles

            # Buscar coincidencias en clave Y valor
            all_words = key_words | value_words
            common = kw_set & all_words

            if common:
                score = len(common) / max(len(kw_set), 1)
                if score > best_score and score >= 0.3:
                    best_score = score
                    best_match = data

        return best_match

    def _handle_teaching(self, message: str, session: Dict, session_id: str, lang: str) -> Dict:
        """Maneja cuando el usuario está enseñando algo."""
        pending = session.get("pending_question", "")

        # Resetear estado
        session["state"] = "normal"
        session["pending_question"] = None
        self.sessions[session_id] = session

        # Guardar lo que el usuario enseñó
        self.memory.learn_concept(pending, message, source="usuario")

        if lang == "es":
            resp = (
                f"✅ **¡Aprendido!** Guardé en mi memoria:\n\n"
                f"📌 **{pending}** → {message}\n\n"
                f"A partir de ahora, si me preguntas sobre \"{pending}\", ya voy a saber qué responderte. "
                f"Esto queda guardado para siempre en mi cerebro. 🧠"
            )
        else:
            resp = (
                f"✅ **Learned!** Saved to my memory:\n\n"
                f"📌 **{pending}** → {message}\n\n"
                f"From now on, if you ask me about \"{pending}\", I'll know the answer. "
                f"This is saved forever in my brain. 🧠"
            )
        return {"response": resp, "action": "learned", "lang": lang, "concept": pending}

    def _is_greeting(self, text: str, lang: str) -> bool:
        words = text.split()
        # No es saludo si contiene verbos de acción/pregunta
        action_words = ["traduce", "traducir", "como se dice", "dime", "explicame",
                        "conjuga", "que es", "que significa", "define", "calcula"]
        if any(a in text for a in action_words):
            return False
        greetings = self.greetings_es + self.greetings_en
        if len(words) <= 6 and any(g in text for g in greetings):
            return True
        return False

    def _is_farewell(self, text: str, lang: str) -> bool:
        farewells = self.farewells_es + self.farewells_en
        return any(f in text for f in farewells)

    def _check_small_talk(self, text: str) -> Optional[str]:
        """Busca frases cotidianas en el small talk. Solo match exacto o casi exacto."""
        norm = text.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
        norm = re.sub(r"[^\w\s]", "", norm).strip()

        # Match exacto
        if norm in self.small_talk:
            return self.small_talk[norm]

        # Match solo si la frase del usuario es corta (≤5 palabras) y coincide con una clave
        if len(norm.split()) <= 5:
            for key, response in self.small_talk.items():
                # La clave debe estar contenida en el texto Y ser similar en longitud
                if key in norm and len(key.split()) >= len(norm.split()) - 1:
                    return response

        return None

    def _check_translation(self, text: str) -> Optional[str]:
        """Detecta y responde peticiones de traducción."""
        # Diccionario bilingüe básico
        es_en = {
            "hola": "hello", "adiós": "goodbye", "adios": "goodbye",
            "gracias": "thank you", "por favor": "please",
            "buenos días": "good morning", "buenos dias": "good morning",
            "buenas tardes": "good afternoon", "buenas noches": "good night",
            "sí": "yes", "si": "yes", "no": "no",
            "amor": "love", "amigo": "friend", "familia": "family",
            "casa": "house", "agua": "water", "comida": "food",
            "perro": "dog", "gato": "cat", "libro": "book",
            "escuela": "school", "trabajo": "work", "tiempo": "time/weather",
            "dinero": "money", "ciudad": "city", "país": "country", "pais": "country",
            "hombre": "man", "mujer": "woman", "niño": "boy/child", "niña": "girl",
            "día": "day", "dia": "day", "noche": "night", "mañana": "morning/tomorrow",
            "comer": "to eat", "beber": "to drink", "dormir": "to sleep",
            "hablar": "to speak", "caminar": "to walk", "correr": "to run",
            "leer": "to read", "escribir": "to write", "vivir": "to live",
            "morir": "to die", "amar": "to love", "jugar": "to play",
            "grande": "big", "pequeño": "small", "bueno": "good", "malo": "bad",
            "bonito": "beautiful", "feo": "ugly", "rápido": "fast", "lento": "slow",
            "feliz": "happy", "triste": "sad", "enojado": "angry",
            "cansado": "tired", "hambre": "hunger", "sed": "thirst",
            "sol": "sun", "luna": "moon", "estrella": "star",
            "tierra": "earth", "cielo": "sky", "mar": "sea",
            "rojo": "red", "azul": "blue", "verde": "green",
            "blanco": "white", "negro": "black", "amarillo": "yellow",
            "uno": "one", "dos": "two", "tres": "three", "cuatro": "four",
            "cinco": "five", "diez": "ten", "cien": "hundred", "mil": "thousand",
            "yo": "I", "tú": "you", "tu": "you", "él": "he", "ella": "she",
            "nosotros": "we", "ellos": "they",
            "computadora": "computer", "teléfono": "phone", "telefono": "phone",
            "mesa": "table", "silla": "chair", "puerta": "door", "ventana": "window",
            "corazón": "heart", "corazon": "heart", "cabeza": "head", "mano": "hand",
            "gracias": "thank you", "lo siento": "I'm sorry", "perdón": "sorry",
            "ayuda": "help", "problema": "problem", "solución": "solution",
            "programa": "program", "código": "code", "codigo": "code",
        }
        en_es = {v: k for k, v in es_en.items()}

        # Detectar patrón: "traduce X en inglés/español"
        m = re.search(r"(?:traduce|traducir|traduceme|tradúceme)\s+(.+?)\s+(?:en|al|a)\s+(ingles|inglés|español|espanol|english|spanish)", text)
        if m:
            word = m.group(1).strip().strip('"\'')
            target = m.group(2).strip()

            if target in ("ingles", "inglés", "english"):
                translation = es_en.get(word.lower())
                if translation:
                    return f"🌐 **Traducción:** \"{word}\" en inglés es **\"{translation}\"**"
                # Buscar en memoria
                return f"🌐 No tengo la traducción de \"{word}\" en mi diccionario. ¿Me la puedes enseñar?"
            else:
                translation = en_es.get(word.lower())
                if translation:
                    return f"🌐 **Traducción:** \"{word}\" en español es **\"{translation}\"**"
                return f"🌐 No tengo la traducción de \"{word}\" en mi diccionario. ¿Me la puedes enseñar?"

        # "como se dice X en inglés/español"
        m = re.search(r"como\s+se\s+dice\s+(.+?)\s+en\s+(ingles|inglés|español|espanol|english|spanish)", text)
        if m:
            word = m.group(1).strip()
            target = m.group(2).strip()
            if target in ("ingles", "inglés", "english"):
                translation = es_en.get(word.lower())
                if translation:
                    return f"🌐 \"{word}\" en inglés se dice **\"{translation}\"**"
            else:
                translation = en_es.get(word.lower())
                if translation:
                    return f"🌐 \"{word}\" en español se dice **\"{translation}\"**"
            return f"🌐 No sé cómo se dice \"{word}\" todavía. ¿Me enseñas?"

        return None

    def _extract_question(self, lower: str, lang: str) -> Optional[str]:
        """Extrae el tema de una pregunta."""
        patterns = self.question_patterns_es + self.question_patterns_en
        for pattern in patterns:
            match = re.search(pattern, lower)
            if match:
                topic = match.group(1).strip().rstrip("?.,!").strip()
                if len(topic) > 1:
                    return topic
        return None

    def _answer_question(self, topic: str, original: str, session: Dict, session_id: str, lang: str) -> Dict:
        """Intenta responder una pregunta buscando en la memoria."""
        # Buscar en la memoria
        concept = self.memory.recall_concept(topic)
        if concept:
            source = concept.get("source", "usuario")
            value = concept["value"]
            key = concept["key"]

            if source == "conocimiento_humano_real" or source == "autoconocimiento":
                # Responder de forma NATURAL como una persona educada
                intros_es = [
                    f"**{key.capitalize()}** {value}.",
                    f"Mira, {key} {value}.",
                    f"Te cuento: {key} {value}.",
                    f"Claro, {key} {value}.",
                    f"Buena pregunta. {key.capitalize()} {value}.",
                ]
                intros_en = [
                    f"**{key.capitalize()}** {value}.",
                    f"Well, {key} {value}.",
                    f"Sure! {key.capitalize()} {value}.",
                ]
                if lang == "es":
                    resp = random.choice(intros_es)
                else:
                    resp = random.choice(intros_en)
            else:
                # Conocimiento enseñado por el usuario
                if lang == "es":
                    resp = f"🧠 ¡Eso ya lo sé! Tú me lo enseñaste:\n\n**{key}** → {value}"
                else:
                    resp = f"🧠 I know this! You taught me:\n\n**{key}** → {value}"

            return {"response": resp, "action": "answered_from_memory", "lang": lang}

        # Buscar en el diccionario
        word_def = self.memory.recall_word(topic)
        if word_def:
            return {
                "response": f"📖 **{word_def['word']}**: {word_def['definition']}",
                "action": "answered_from_dictionary",
                "lang": lang,
            }

        # Buscar de forma más flexible en toda la memoria
        memory_results = self.memory.search_all(topic)
        if memory_results and memory_results[0]["match_score"] >= 0.4:
            best = memory_results[0]
            source = best.get("source", "usuario")
            if source == "conocimiento_humano_real":
                resp = f"{best['value']}."
            else:
                resp = f"🧠 Encontré algo relacionado: **{best.get('key', '')}** → {best.get('value', '')}"
            return {"response": resp, "action": "answered_from_memory", "lang": lang}

        # No sé — pedir que me enseñe
        session["state"] = "waiting_for_teaching"
        session["pending_question"] = topic
        self.sessions[session_id] = session

        if lang == "es":
            no_se = [
                f"🤔 Hmm, no sé qué es **\"{topic}\"** todavía. ¿Me lo puedes explicar? Lo guardo para siempre.",
                f"🤔 Eso no lo tengo en mi memoria aún. ¿Me enseñas qué es **\"{topic}\"**? Prometo no olvidarlo.",
                f"🤔 No tengo información sobre **\"{topic}\"**. Si me explicas qué es, lo aprendo y no lo olvido nunca.",
            ]
            resp = random.choice(no_se)
        else:
            resp = f"🤔 I don't know what **\"{topic}\"** is yet. Can you teach me? I'll remember it forever."
        return {"response": resp, "action": "asking_to_learn", "lang": lang}

    def _extract_teaching(self, lower: str, original: str, lang: str) -> Optional[Tuple[str, str]]:
        """Detecta si el usuario está enseñando algo directamente."""
        # Patrones: "X es Y", "X significa Y"
        patterns = [
            r"^(.{2,30}?)\s+(?:es|significa|quiere\s+decir)\s+(.{5,})$",
            r"^(.{2,30}?)\s+(?:is|means)\s+(.{5,})$",
        ]
        for pattern in patterns:
            match = re.match(pattern, lower)
            if match:
                key = match.group(1).strip()
                value = match.group(2).strip()
                # Filtrar patrones que no son enseñanza
                skip_words = ["que", "como", "donde", "cuando", "cuanto", "what", "how", "where"]
                if not any(key.startswith(w) for w in skip_words):
                    # Usar el texto original (con mayúsculas) para el valor
                    original_match = re.match(pattern, original.lower())
                    if original_match:
                        val_start = original_match.start(2)
                        value = original[val_start:].strip()
                    return (key, value)
        return None

    def _report_knowledge(self, lang: str) -> Dict:
        """Reporta cuánto ha aprendido."""
        stats = self.memory.stats
        concepts_list = list(self.memory.concepts.values())[:10]

        if lang == "es":
            resp = f"📊 **Mi base de conocimiento:**\n\n"
            resp += f"• **{stats['concepts']}** conceptos aprendidos\n"
            resp += f"• **{stats['facts']}** hechos guardados\n"
            resp += f"• **{stats['dictionary_words']}** palabras en mi diccionario\n"
            resp += f"• **{stats['total_learned']}** cosas aprendidas en total\n\n"
            if concepts_list:
                resp += "📌 **Últimos conceptos aprendidos:**\n"
                for c in concepts_list[-5:]:
                    resp += f"  • **{c['key']}** → {c['value'][:60]}{'...' if len(c['value']) > 60 else ''}\n"
        else:
            resp = f"📊 **My knowledge base:**\n\n"
            resp += f"• **{stats['concepts']}** concepts learned\n"
            resp += f"• **{stats['facts']}** facts saved\n"
            resp += f"• **{stats['dictionary_words']}** words in my dictionary\n\n"
            if concepts_list:
                resp += "📌 **Recent concepts:**\n"
                for c in concepts_list[-5:]:
                    resp += f"  • **{c['key']}** → {c['value'][:60]}{'...' if len(c['value']) > 60 else ''}\n"

        return {"response": resp, "action": "knowledge_report", "lang": lang}
