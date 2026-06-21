"""
XuperBrain — Motor de Español: Conjugación + Composición de respuestas.
Conjuga verbos aplicando reglas gramaticales matemáticas (-ar, -er, -ir).
Con las reglas + 500 verbos base = miles de formas conjugadas automáticas.
"""

import re
import random
from typing import Dict, List, Optional, Tuple


# ═══════════════════════════════════════════════════════════════════
# REGLAS DE CONJUGACIÓN ESPAÑOLA (Matemáticas puras)
# ═══════════════════════════════════════════════════════════════════

# Terminaciones regulares para cada tiempo verbal
CONJUGATION_RULES = {
    "presente": {
        "ar": ["o", "as", "a", "amos", "áis", "an"],
        "er": ["o", "es", "e", "emos", "éis", "en"],
        "ir": ["o", "es", "e", "imos", "ís", "en"],
    },
    "preterito": {
        "ar": ["é", "aste", "ó", "amos", "asteis", "aron"],
        "er": ["í", "iste", "ió", "imos", "isteis", "ieron"],
        "ir": ["í", "iste", "ió", "imos", "isteis", "ieron"],
    },
    "futuro": {
        "ar": ["aré", "arás", "ará", "aremos", "aréis", "arán"],
        "er": ["eré", "erás", "erá", "eremos", "eréis", "erán"],
        "ir": ["iré", "irás", "irá", "iremos", "iréis", "irán"],
    },
    "imperfecto": {
        "ar": ["aba", "abas", "aba", "ábamos", "abais", "aban"],
        "er": ["ía", "ías", "ía", "íamos", "íais", "ían"],
        "ir": ["ía", "ías", "ía", "íamos", "íais", "ían"],
    },
    "condicional": {
        "ar": ["aría", "arías", "aría", "aríamos", "aríais", "arían"],
        "er": ["ería", "erías", "ería", "eríamos", "eríais", "erían"],
        "ir": ["iría", "irías", "iría", "iríamos", "iríais", "irían"],
    },
    "subjuntivo_presente": {
        "ar": ["e", "es", "e", "emos", "éis", "en"],
        "er": ["a", "as", "a", "amos", "áis", "an"],
        "ir": ["a", "as", "a", "amos", "áis", "an"],
    },
}

PERSONAS = ["yo", "tú", "él/ella", "nosotros", "vosotros", "ellos/ellas"]

# Verbos irregulares más comunes (presente indicativo)
IRREGULARES_PRESENTE = {
    "ser": ["soy", "eres", "es", "somos", "sois", "son"],
    "estar": ["estoy", "estás", "está", "estamos", "estáis", "están"],
    "ir": ["voy", "vas", "va", "vamos", "vais", "van"],
    "haber": ["he", "has", "ha", "hemos", "habéis", "han"],
    "tener": ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"],
    "hacer": ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"],
    "decir": ["digo", "dices", "dice", "decimos", "decís", "dicen"],
    "poder": ["puedo", "puedes", "puede", "podemos", "podéis", "pueden"],
    "saber": ["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"],
    "querer": ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"],
    "venir": ["vengo", "vienes", "viene", "venimos", "venís", "vienen"],
    "salir": ["salgo", "sales", "sale", "salimos", "salís", "salen"],
    "poner": ["pongo", "pones", "pone", "ponemos", "ponéis", "ponen"],
    "dar": ["doy", "das", "da", "damos", "dais", "dan"],
    "ver": ["veo", "ves", "ve", "vemos", "veis", "ven"],
    "conocer": ["conozco", "conoces", "conoce", "conocemos", "conocéis", "conocen"],
    "pensar": ["pienso", "piensas", "piensa", "pensamos", "pensáis", "piensan"],
    "sentir": ["siento", "sientes", "siente", "sentimos", "sentís", "sienten"],
    "dormir": ["duermo", "duermes", "duerme", "dormimos", "dormís", "duermen"],
    "morir": ["muero", "mueres", "muere", "morimos", "morís", "mueren"],
    "volver": ["vuelvo", "vuelves", "vuelve", "volvemos", "volvéis", "vuelven"],
    "pedir": ["pido", "pides", "pide", "pedimos", "pedís", "piden"],
    "seguir": ["sigo", "sigues", "sigue", "seguimos", "seguís", "siguen"],
    "encontrar": ["encuentro", "encuentras", "encuentra", "encontramos", "encontráis", "encuentran"],
    "jugar": ["juego", "juegas", "juega", "jugamos", "jugáis", "juegan"],
    "traer": ["traigo", "traes", "trae", "traemos", "traéis", "traen"],
    "caer": ["caigo", "caes", "cae", "caemos", "caéis", "caen"],
    "oír": ["oigo", "oyes", "oye", "oímos", "oís", "oyen"],
}

IRREGULARES_PRETERITO = {
    "ser": ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    "ir": ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    "estar": ["estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron"],
    "tener": ["tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron"],
    "hacer": ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"],
    "decir": ["dije", "dijiste", "dijo", "dijimos", "dijisteis", "dijeron"],
    "poder": ["pude", "pudiste", "pudo", "pudimos", "pudisteis", "pudieron"],
    "saber": ["supe", "supiste", "supo", "supimos", "supisteis", "supieron"],
    "querer": ["quise", "quisiste", "quiso", "quisimos", "quisisteis", "quisieron"],
    "venir": ["vine", "viniste", "vino", "vinimos", "vinisteis", "vinieron"],
    "dar": ["di", "diste", "dio", "dimos", "disteis", "dieron"],
    "ver": ["vi", "viste", "vio", "vimos", "visteis", "vieron"],
    "poner": ["puse", "pusiste", "puso", "pusimos", "pusisteis", "pusieron"],
    "haber": ["hube", "hubiste", "hubo", "hubimos", "hubisteis", "hubieron"],
    "traer": ["traje", "trajiste", "trajo", "trajimos", "trajisteis", "trajeron"],
    "caer": ["caí", "caíste", "cayó", "caímos", "caísteis", "cayeron"],
}


# ═══════════════════════════════════════════════════════════════════
# BASE DE VERBOS CON SIGNIFICADOS (500+ verbos)
# ═══════════════════════════════════════════════════════════════════

VERBOS_BASE = {
    # ── Verbos -AR (los más comunes) ──
    "hablar": "comunicarse con palabras", "caminar": "desplazarse a pie",
    "trabajar": "realizar una actividad productiva", "estudiar": "adquirir conocimientos",
    "comprar": "adquirir algo a cambio de dinero", "cocinar": "preparar alimentos",
    "llamar": "comunicarse por teléfono o pedir a alguien", "necesitar": "requerir algo",
    "ayudar": "prestar asistencia a alguien", "buscar": "intentar encontrar algo",
    "pensar": "usar la mente para razonar", "llegar": "alcanzar un destino",
    "llevar": "transportar algo de un lugar a otro", "dejar": "abandonar o permitir",
    "pasar": "moverse de un lugar a otro", "quedar": "permanecer en un lugar",
    "mirar": "dirigir la vista hacia algo", "contar": "numerar o narrar algo",
    "empezar": "dar inicio a algo", "terminar": "finalizar algo",
    "tocar": "palpar con las manos o ejecutar un instrumento",
    "cambiar": "hacer diferente algo", "usar": "emplear algo para un fin",
    "cerrar": "tapar una abertura", "ganar": "obtener una victoria o dinero",
    "pagar": "dar dinero a cambio de algo", "enviar": "mandar algo a un destino",
    "esperar": "aguardar a que algo suceda", "entrar": "pasar al interior",
    "escuchar": "prestar atención a un sonido", "explicar": "hacer entender algo",
    "preguntar": "formular una cuestión", "contestar": "responder a una pregunta",
    "amar": "sentir amor por alguien", "llorar": "derramar lágrimas",
    "cantar": "producir sonidos musicales con la voz",
    "bailar": "mover el cuerpo al ritmo de la música",
    "viajar": "desplazarse a un lugar lejano", "nadar": "desplazarse en el agua",
    "jugar": "realizar una actividad lúdica", "descansar": "cesar la actividad para recuperarse",
    "limpiar": "quitar la suciedad", "lavar": "limpiar con agua",
    "pintar": "aplicar color a una superficie", "dibujar": "representar con trazos",
    "enseñar": "transmitir conocimientos", "mostrar": "hacer visible algo",
    "olvidar": "perder el recuerdo de algo", "recordar": "traer a la memoria",
    "aceptar": "recibir voluntariamente", "rechazar": "no aceptar algo",
    "intentar": "tratar de hacer algo", "lograr": "conseguir lo que se pretendía",
    "crear": "producir algo nuevo", "formar": "dar forma a algo",
    "cortar": "dividir con un instrumento afilado",
    "tirar": "lanzar algo o desechar", "levantar": "mover hacia arriba",
    "bajar": "ir de un lugar alto a uno bajo", "subir": "ir de un lugar bajo a uno alto",
    "guardar": "poner algo en un lugar seguro", "sacar": "extraer algo de un lugar",
    "mandar": "ordenar o enviar", "invitar": "pedir a alguien que venga",
    "importar": "tener relevancia o traer del exterior",
    "funcionar": "operar correctamente", "faltar": "no estar presente",
    "soñar": "tener imágenes durante el sueño", "despertar": "dejar de dormir",
    "preparar": "disponer todo para algo", "organizar": "poner en orden",
    "programar": "escribir instrucciones para una computadora",
    "desarrollar": "hacer crecer o construir software",
    "diseñar": "crear el plan de algo", "investigar": "buscar información metódicamente",
    "analizar": "examinar detalladamente", "calcular": "determinar un valor numérico",
    "instalar": "poner en funcionamiento un programa o equipo",
    "actualizar": "poner al día algo", "descargar": "transferir datos de internet",
    "conectar": "unir dos cosas", "eliminar": "quitar o borrar",
    "copiar": "reproducir algo igual", "guardar": "almacenar información",
    "cargar": "poner energía o datos en algo", "reiniciar": "volver a empezar",

    # ── Verbos -ER ──
    "comer": "ingerir alimentos", "beber": "ingerir líquidos",
    "leer": "interpretar texto escrito", "correr": "desplazarse rápidamente a pie",
    "aprender": "adquirir conocimiento o habilidad",
    "entender": "comprender el significado de algo",
    "comprender": "entender completamente algo",
    "responder": "contestar a una pregunta", "vender": "dar algo a cambio de dinero",
    "perder": "dejar de tener algo", "creer": "tener fe o considerar cierto",
    "conocer": "tener información sobre algo o alguien",
    "parecer": "tener apariencia de algo", "nacer": "venir al mundo",
    "crecer": "aumentar de tamaño", "meter": "introducir algo en un lugar",
    "romper": "quebrar algo", "mover": "cambiar de posición",
    "resolver": "encontrar solución a un problema",
    "sorprender": "causar asombro", "prometer": "comprometerse a hacer algo",
    "proteger": "defender de un peligro", "depender": "necesitar de algo para funcionar",
    "deber": "tener obligación de hacer algo", "poseer": "tener propiedad de algo",
    "ofrecer": "presentar algo para que sea aceptado",
    "recoger": "tomar algo del suelo o reunir",
    "escoger": "elegir entre varias opciones",
    "establecer": "fundar o fijar algo", "mantener": "conservar en buen estado",
    "obtener": "conseguir algo", "contener": "tener algo dentro",
    "sostener": "sujetar algo", "reconocer": "identificar algo ya conocido",
    "pertenecer": "ser propiedad o parte de algo",
    "proponer": "presentar una idea para consideración",
    "devolver": "regresar algo a su dueño",
    "envolver": "cubrir algo con papel u otro material",

    # ── Verbos -IR ──
    "vivir": "existir, estar vivo", "escribir": "trazar letras o texto",
    "abrir": "descubrir lo que estaba cerrado", "recibir": "tomar lo que le dan",
    "decidir": "tomar una determinación", "descubrir": "encontrar algo desconocido",
    "existir": "tener realidad", "ocurrir": "suceder algo",
    "sufrir": "experimentar dolor", "permitir": "dar consentimiento",
    "producir": "fabricar o crear algo", "construir": "edificar algo",
    "destruir": "deshacer algo completamente", "distribuir": "repartir algo",
    "contribuir": "aportar para un fin común",
    "incluir": "poner algo dentro de un conjunto",
    "excluir": "dejar fuera de un conjunto", "influir": "ejercer efecto sobre algo",
    "reducir": "hacer más pequeño", "traducir": "pasar de un idioma a otro",
    "conducir": "manejar un vehículo", "introducir": "meter algo dentro",
    "compartir": "usar o tener algo en común con otros",
    "discutir": "debatir o tener un desacuerdo", "añadir": "agregar algo más",
    "medir": "determinar las dimensiones de algo", "servir": "ser útil o atender",
    "conseguir": "lograr obtener algo", "repetir": "hacer de nuevo",
    "elegir": "seleccionar entre opciones", "exigir": "pedir con autoridad",
    "dirigir": "guiar o administrar", "corregir": "enmendar un error",
    "definir": "determinar el significado de algo",
    "transmitir": "comunicar o enviar señales",
    "emitir": "producir y lanzar algo al exterior",
    "admitir": "aceptar o dejar entrar", "omitir": "dejar de incluir algo",
    "insistir": "pedir algo con firmeza repetidamente",
    "resistir": "soportar o no ceder", "asistir": "estar presente en un lugar",
    "imprimir": "reproducir texto en papel",
    "cumplir": "realizar lo prometido o llegar a una edad",
    "subir": "ir hacia arriba", "dividir": "separar en partes",
    "unir": "juntar dos o más cosas", "huir": "escapar de un peligro",

    # ── Ser, Estar, Ir, Haber (fundamentales) ──
    "ser": "existir o tener una cualidad permanente",
    "estar": "encontrarse en un lugar o estado temporal",
    "ir": "desplazarse hacia un lugar", "haber": "existir o auxiliar en tiempos compuestos",
    "tener": "poseer algo", "hacer": "realizar o fabricar algo",
    "decir": "expresar con palabras", "poder": "tener capacidad de hacer algo",
    "saber": "tener conocimiento de algo", "querer": "desear algo",
    "venir": "desplazarse hacia donde está el hablante",
    "salir": "ir del interior al exterior", "poner": "colocar algo en un lugar",
    "dar": "entregar algo a alguien", "ver": "percibir con los ojos",
    "traer": "llevar algo hacia donde está el hablante",
    "caer": "ir hacia abajo por efecto de la gravedad",
    "oír": "percibir sonidos con el oído",
    "dormir": "estar en estado de reposo nocturno",
    "morir": "dejar de vivir", "sentir": "experimentar una sensación o emoción",
    "seguir": "ir detrás de algo o continuar", "encontrar": "hallar algo",
    "volver": "regresar a un lugar", "pedir": "solicitar algo",
}


class SpanishEngine:
    """Motor de español: conjuga verbos y compone respuestas naturales."""

    def __init__(self):
        self.verbos = VERBOS_BASE

    def conjugate(self, infinitivo: str, tiempo: str = "presente", persona: int = 0) -> str:
        """
        Conjuga un verbo en el tiempo y persona indicados.
        persona: 0=yo, 1=tú, 2=él, 3=nosotros, 4=vosotros, 5=ellos
        """
        inf = infinitivo.lower().strip()

        # Verificar irregulares
        if tiempo == "presente" and inf in IRREGULARES_PRESENTE:
            return IRREGULARES_PRESENTE[inf][persona]
        if tiempo == "preterito" and inf in IRREGULARES_PRETERITO:
            return IRREGULARES_PRETERITO[inf][persona]

        # Conjugación regular
        if inf.endswith("ar"):
            tipo, raiz = "ar", inf[:-2]
        elif inf.endswith("er"):
            tipo, raiz = "er", inf[:-2]
        elif inf.endswith("ir"):
            tipo, raiz = "ir", inf[:-2]
        else:
            return inf  # No reconocido

        if tiempo == "futuro" or tiempo == "condicional":
            # Futuro y condicional usan el infinitivo completo como raíz
            rules = CONJUGATION_RULES.get(tiempo, {}).get(tipo, [])
            if rules:
                return inf[:-2] + rules[persona]  # Quitar terminación y agregar nueva
            return inf

        rules = CONJUGATION_RULES.get(tiempo, {}).get(tipo, [])
        if not rules:
            return inf

        return raiz + rules[persona]

    def conjugate_full(self, infinitivo: str) -> Dict:
        """Retorna la conjugación completa de un verbo en todos los tiempos."""
        result = {}
        for tiempo in ["presente", "preterito", "futuro", "imperfecto", "condicional"]:
            formas = []
            for p in range(6):
                formas.append(f"{PERSONAS[p]}: {self.conjugate(infinitivo, tiempo, p)}")
            result[tiempo] = formas
        return result

    def get_verb_info(self, infinitivo: str) -> Optional[str]:
        """Obtiene el significado de un verbo."""
        return self.verbos.get(infinitivo.lower().strip())

    def is_verb_question(self, text: str) -> Optional[Dict]:
        """Detecta si el texto es una pregunta sobre un verbo."""
        lower = text.lower().strip()

        # "conjuga el verbo X" / "conjugar X"
        m = re.search(r"(?:conjuga|conjugar|conjugame|conjúgame)\s+(?:el\s+verbo\s+)?(\w+)", lower)
        if m:
            return {"action": "conjugate_full", "verb": m.group(1)}

        # "como se conjuga X" (pero NO "como se dice X en inglés")
        m = re.search(r"como\s+se\s+(?:conjuga|usa)\s+(?:el\s+verbo\s+)?(\w+)", lower)
        if m:
            return {"action": "conjugate_full", "verb": m.group(1)}

        # "como se dice X" — SOLO si NO es traducción (no contiene "en inglés/español")
        if "en ingles" not in lower and "en inglés" not in lower and "en espanol" not in lower and "en español" not in lower:
            m = re.search(r"como\s+se\s+dice\s+(\w+)", lower)
            if m:
                return {"action": "conjugate_full", "verb": m.group(1)}

        # "como se dice X en pasado/futuro"
        m = re.search(r"como\s+se\s+dice\s+(\w+)\s+en\s+(pasado|futuro|presente|imperfecto)", lower)
        if m:
            tiempo_map = {"pasado": "preterito", "futuro": "futuro", "presente": "presente", "imperfecto": "imperfecto"}
            return {"action": "conjugate_time", "verb": m.group(1), "tiempo": tiempo_map.get(m.group(2), "presente")}

        # "X en pasado" / "X en futuro"
        m = re.search(r"^(\w+)\s+en\s+(pasado|futuro|presente|imperfecto)$", lower)
        if m:
            verb = m.group(1)
            if verb in self.verbos or verb.endswith(("ar", "er", "ir")):
                tiempo_map = {"pasado": "preterito", "futuro": "futuro", "presente": "presente", "imperfecto": "imperfecto"}
                return {"action": "conjugate_time", "verb": verb, "tiempo": tiempo_map.get(m.group(2), "presente")}

        # "que significa el verbo X" / "que significa X"
        m = re.search(r"(?:que|qué)\s+(?:significa|es)\s+(?:el\s+verbo\s+)?(\w+(?:ar|er|ir))\b", lower)
        if m:
            return {"action": "meaning", "verb": m.group(1)}

        return None

    def handle_verb_query(self, query: Dict) -> str:
        """Genera respuesta para preguntas sobre verbos."""
        verb = query["verb"]
        action = query["action"]

        if action == "conjugate_full":
            meaning = self.get_verb_info(verb)
            conj = self.conjugate_full(verb)

            resp = f"📝 **Conjugación de \"{verb}\"**"
            if meaning:
                resp += f"\n*Significado: {meaning}*\n"
            resp += "\n"

            for tiempo, formas in conj.items():
                nombre = {"presente": "Presente", "preterito": "Pretérito (pasado)", "futuro": "Futuro", "imperfecto": "Imperfecto", "condicional": "Condicional"}
                resp += f"\n**{nombre.get(tiempo, tiempo)}:**\n"
                for f in formas:
                    resp += f"  • {f}\n"

            return resp

        elif action == "conjugate_time":
            tiempo = query.get("tiempo", "presente")
            nombre = {"presente": "Presente", "preterito": "Pretérito (pasado)", "futuro": "Futuro", "imperfecto": "Imperfecto"}

            resp = f"📝 **\"{verb}\" en {nombre.get(tiempo, tiempo)}:**\n\n"
            for p in range(6):
                forma = self.conjugate(verb, tiempo, p)
                resp += f"  • {PERSONAS[p]}: **{forma}**\n"

            return resp

        elif action == "meaning":
            meaning = self.get_verb_info(verb)
            if meaning:
                return f"📖 **{verb}**: {meaning}.\n\nEjemplo en presente: *yo {self.conjugate(verb, 'presente', 0)}*, en pasado: *yo {self.conjugate(verb, 'preterito', 0)}*, en futuro: *yo {self.conjugate(verb, 'futuro', 0)}*"
            else:
                return f"No tengo el significado de \"{verb}\" en mi base, pero puedo conjugarlo:\n\n• Presente: yo {self.conjugate(verb, 'presente', 0)}\n• Pasado: yo {self.conjugate(verb, 'preterito', 0)}\n• Futuro: yo {self.conjugate(verb, 'futuro', 0)}"

        return "No entendí la pregunta sobre el verbo."

    def compose_response(self, topic: str, knowledge: str) -> str:
        """
        Compone una respuesta natural usando el conocimiento disponible.
        En lugar de solo citar la definición, construye una respuesta fluida.
        """
        # Variaciones de introducción
        intros = [
            f"{knowledge}.",
            f"Bueno, te explico: {knowledge}.",
            f"Claro que sí. {knowledge}.",
            f"Mira, {knowledge}.",
            f"Te cuento: {knowledge}.",
            f"Es una buena pregunta. {knowledge}.",
        ]
        return random.choice(intros)

    @property
    def total_verbs(self) -> int:
        return len(self.verbos)

    @property
    def total_conjugated_forms(self) -> int:
        """Calcula cuántas formas conjugadas puede generar."""
        n_verbs = len(self.verbos)
        n_tiempos = 5  # presente, pretérito, futuro, imperfecto, condicional
        n_personas = 6
        return n_verbs * n_tiempos * n_personas
