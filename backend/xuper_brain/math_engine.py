"""
XuperBrain — Motor de Razonamiento Matemático desde cero.
Evalúa expresiones aritméticas y resuelve problemas matemáticos.

Capacidades:
- Aritmética: suma, resta, multiplicación, división
- Potencias y raíces cuadradas
- Porcentajes
- Detección automática de operaciones en lenguaje natural (español)
- Explicación paso a paso de las operaciones

Sin sympy, sin eval(), sin dependencias externas. Pura matemática.
"""

import re
import math
from typing import Optional, Tuple, List, Dict


class MathEngine:
    """Motor matemático que entiende español y calcula con precisión."""

    # Patrones para detectar operaciones en lenguaje natural
    PATTERNS = {
        "suma": [
            r"(?:cuanto|cuánto)\s+es\s+([\d.,]+)\s*(?:\+|mas|más)\s*([\d.,]+)",
            r"(?:suma|sumar|sumame|súmame)\s+([\d.,]+)\s*(?:\+|y|mas|más|con)\s*([\d.,]+)",
            r"([\d.,]+)\s*\+\s*([\d.,]+)",
            r"([\d.,]+)\s+(?:mas|más)\s+([\d.,]+)",
        ],
        "resta": [
            r"(?:cuanto|cuánto)\s+es\s+([\d.,]+)\s*(?:\-|menos)\s*([\d.,]+)",
            r"(?:resta|restar|restame|réstame)\s+([\d.,]+)\s*(?:\-|y|menos|a)\s*([\d.,]+)",
            r"([\d.,]+)\s*\-\s*([\d.,]+)",
            r"([\d.,]+)\s+menos\s+([\d.,]+)",
        ],
        "multiplicacion": [
            r"(?:cuanto|cuánto)\s+es\s+([\d.,]+)\s*(?:\*|x|×|por)\s*([\d.,]+)",
            r"(?:multiplica|multiplicar|multiplicame)\s+([\d.,]+)\s*(?:\*|x|×|por|y)\s*([\d.,]+)",
            r"([\d.,]+)\s*(?:\*|×)\s*([\d.,]+)",
            r"([\d.,]+)\s+(?:por|multiplicado\s+por)\s+([\d.,]+)",
        ],
        "division": [
            r"(?:cuanto|cuánto)\s+es\s+([\d.,]+)\s*(?:\/|÷|entre|dividido)\s*([\d.,]+)",
            r"(?:divide|dividir|divideme)\s+([\d.,]+)\s*(?:\/|÷|entre|por|y)\s*([\d.,]+)",
            r"([\d.,]+)\s*(?:\/|÷)\s*([\d.,]+)",
            r"([\d.,]+)\s+(?:entre|dividido\s+entre|dividido\s+por)\s+([\d.,]+)",
        ],
        "potencia": [
            r"([\d.,]+)\s+(?:elevado\s+a|a\s+la)\s+([\d.,]+)",
            r"([\d.,]+)\s*\*\*\s*([\d.,]+)",
            r"([\d.,]+)\s+(?:al\s+cuadrado)",
            r"([\d.,]+)\s+(?:al\s+cubo)",
        ],
        "raiz": [
            r"(?:raiz|raíz)\s+(?:cuadrada\s+de\s+)?([\d.,]+)",
            r"√\s*([\d.,]+)",
        ],
        "porcentaje": [
            r"(?:cuanto|cuánto|cual|cuál)\s+es\s+(?:el\s+)?([\d.,]+)\s*%\s+de\s+([\d.,]+)",
            r"([\d.,]+)\s*%\s+de\s+([\d.,]+)",
        ],
    }

    # Palabras clave para detectar si es una pregunta matemática
    MATH_KEYWORDS = [
        "cuanto es", "cuánto es", "suma", "resta", "multiplica", "divide",
        "calcular", "calcula", "resultado", "operacion", "operación",
        "+", "-", "*", "/", "×", "÷", "por ciento", "%",
        "mas ", "más ", "menos ", " por ", " entre ",
        "raiz", "raíz", "cuadrado", "cubo", "elevado",
        "sumar", "restar", "multiplicar", "dividir",
    ]

    def __init__(self):
        pass

    def is_math_question(self, text: str) -> bool:
        """Detecta si el texto contiene una pregunta matemática."""
        lower = text.lower()
        # Verificar palabras clave
        if any(kw in lower for kw in self.MATH_KEYWORDS):
            return True
        # Verificar si tiene números y operadores
        if re.search(r"\d+\s*[\+\-\*\/×÷]\s*\d+", text):
            return True
        return False

    def solve(self, text: str) -> Optional[Dict]:
        """
        Intenta resolver una expresión matemática del texto.
        Retorna el resultado con explicación paso a paso.
        """
        lower = text.lower().strip()

        # Intentar cada tipo de operación
        for op_type, patterns in self.PATTERNS.items():
            for pattern in patterns:
                match = re.search(pattern, lower)
                if match:
                    return self._execute_operation(op_type, match, text)

        # Intentar evaluar expresión directa (ej: "2+3*4")
        expr_result = self._try_direct_expression(text)
        if expr_result:
            return expr_result

        return None

    def _parse_number(self, s: str) -> float:
        """Convierte string a número, manejando comas y puntos."""
        s = s.strip().replace(",", "")
        return float(s)

    def _format_number(self, n: float) -> str:
        """Formatea un número para mostrar."""
        if n == int(n):
            return f"{int(n):,}".replace(",", ".")
        return f"{n:,.4f}".replace(",", "X").replace(".", ",").replace("X", ".")

    def _execute_operation(self, op_type: str, match: re.Match, original: str) -> Dict:
        """Ejecuta la operación matemática detectada."""
        groups = match.groups()

        if op_type == "suma":
            a, b = self._parse_number(groups[0]), self._parse_number(groups[1])
            result = a + b
            symbol = "+"
            op_name = "Suma"
            explanation = f"{self._format_number(a)} + {self._format_number(b)} = {self._format_number(result)}"

        elif op_type == "resta":
            a, b = self._parse_number(groups[0]), self._parse_number(groups[1])
            result = a - b
            symbol = "−"
            op_name = "Resta"
            explanation = f"{self._format_number(a)} − {self._format_number(b)} = {self._format_number(result)}"

        elif op_type == "multiplicacion":
            a, b = self._parse_number(groups[0]), self._parse_number(groups[1])
            result = a * b
            symbol = "×"
            op_name = "Multiplicación"
            explanation = f"{self._format_number(a)} × {self._format_number(b)} = {self._format_number(result)}"

        elif op_type == "division":
            a, b = self._parse_number(groups[0]), self._parse_number(groups[1])
            if b == 0:
                return {
                    "operation": "División",
                    "error": True,
                    "response": "⚠️ **Error matemático:** No se puede dividir entre cero. En matemáticas, la división por cero es indefinida.",
                }
            result = a / b
            symbol = "÷"
            op_name = "División"
            remainder = a % b if b != 0 else 0
            explanation = f"{self._format_number(a)} ÷ {self._format_number(b)} = {self._format_number(result)}"
            if remainder != 0 and a == int(a) and b == int(b):
                explanation += f"\n   Cociente entero: {int(a // b)}, Residuo: {int(remainder)}"

        elif op_type == "potencia":
            a = self._parse_number(groups[0])
            if len(groups) > 1 and groups[1]:
                b = self._parse_number(groups[1])
            elif "cuadrado" in original.lower():
                b = 2
            elif "cubo" in original.lower():
                b = 3
            else:
                b = 2
            result = a ** b
            symbol = "^"
            op_name = "Potencia"
            explanation = f"{self._format_number(a)}^{self._format_number(b)} = {self._format_number(result)}"

        elif op_type == "raiz":
            a = self._parse_number(groups[0])
            if a < 0:
                return {
                    "operation": "Raíz cuadrada",
                    "error": True,
                    "response": "⚠️ **Error:** No se puede calcular la raíz cuadrada de un número negativo en los números reales.",
                }
            result = math.sqrt(a)
            symbol = "√"
            op_name = "Raíz cuadrada"
            explanation = f"√{self._format_number(a)} = {self._format_number(result)}"

        elif op_type == "porcentaje":
            pct, total = self._parse_number(groups[0]), self._parse_number(groups[1])
            result = (pct / 100) * total
            symbol = "%"
            op_name = "Porcentaje"
            explanation = f"{self._format_number(pct)}% de {self._format_number(total)} = {self._format_number(result)}"

        else:
            return None

        response = (
            f"🧮 **{op_name}**\n\n"
            f"   {explanation}\n\n"
            f"   **Resultado: {self._format_number(result)}**"
        )

        return {
            "operation": op_name,
            "result": result,
            "formatted_result": self._format_number(result),
            "explanation": explanation,
            "response": response,
            "error": False,
        }

    def _try_direct_expression(self, text: str) -> Optional[Dict]:
        """Intenta evaluar una expresión matemática directa de forma segura."""
        # Extraer solo la parte numérica/operadores
        expr_match = re.search(r"([\d.,]+(?:\s*[\+\-\*\/\^]\s*[\d.,]+)+)", text)
        if not expr_match:
            return None

        expr = expr_match.group(1).strip()
        # Reemplazar ^ por **
        safe_expr = expr.replace("^", "**").replace(",", "")
        # Verificar que solo contiene caracteres seguros
        if not re.match(r"^[\d\s\+\-\*\/\.\(\)]+$", safe_expr):
            return None

        try:
            # Evaluación segura: solo operaciones aritméticas
            result = self._safe_eval(safe_expr)
            if result is not None:
                return {
                    "operation": "Expresión",
                    "result": result,
                    "formatted_result": self._format_number(result),
                    "explanation": f"{expr} = {self._format_number(result)}",
                    "response": f"🧮 **Cálculo**\n\n   {expr} = **{self._format_number(result)}**",
                    "error": False,
                }
        except Exception:
            pass

        return None

    def _safe_eval(self, expr: str) -> Optional[float]:
        """Evaluador seguro de expresiones aritméticas (sin eval())."""
        tokens = self._tokenize_expr(expr)
        if not tokens:
            return None
        try:
            result, pos = self._parse_expression(tokens, 0)
            if pos == len(tokens):
                return result
        except Exception:
            pass
        return None

    def _tokenize_expr(self, expr: str) -> List:
        """Tokeniza una expresión aritmética."""
        tokens = []
        i = 0
        expr = expr.replace(" ", "")
        while i < len(expr):
            if expr[i].isdigit() or expr[i] == ".":
                j = i
                while j < len(expr) and (expr[j].isdigit() or expr[j] == "."):
                    j += 1
                tokens.append(float(expr[i:j]))
                i = j
            elif expr[i] in "+-*/()":
                tokens.append(expr[i])
                i += 1
            else:
                i += 1
        return tokens

    def _parse_expression(self, tokens: List, pos: int) -> Tuple[float, int]:
        """Parser recursivo descendente para expresiones aritméticas."""
        result, pos = self._parse_term(tokens, pos)
        while pos < len(tokens) and tokens[pos] in ("+", "-"):
            op = tokens[pos]
            pos += 1
            right, pos = self._parse_term(tokens, pos)
            if op == "+":
                result += right
            else:
                result -= right
        return result, pos

    def _parse_term(self, tokens: List, pos: int) -> Tuple[float, int]:
        """Parsea términos (multiplicación y división)."""
        result, pos = self._parse_factor(tokens, pos)
        while pos < len(tokens) and tokens[pos] in ("*", "/"):
            op = tokens[pos]
            pos += 1
            right, pos = self._parse_factor(tokens, pos)
            if op == "*":
                result *= right
            else:
                if right == 0:
                    raise ValueError("División por cero")
                result /= right
        return result, pos

    def _parse_factor(self, tokens: List, pos: int) -> Tuple[float, int]:
        """Parsea factores (números y paréntesis)."""
        if pos < len(tokens) and tokens[pos] == "(":
            pos += 1
            result, pos = self._parse_expression(tokens, pos)
            if pos < len(tokens) and tokens[pos] == ")":
                pos += 1
            return result, pos
        elif pos < len(tokens) and isinstance(tokens[pos], float):
            return tokens[pos], pos + 1
        elif pos < len(tokens) and tokens[pos] == "-":
            pos += 1
            result, pos = self._parse_factor(tokens, pos)
            return -result, pos
        raise ValueError("Token inesperado")
