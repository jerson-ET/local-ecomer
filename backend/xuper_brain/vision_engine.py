"""
XuperBrain — VisionEngine.
Motor de visión artificial local basado en OpenCV y PyTesseract.
Permite a XuperBrain "ver" la pantalla, reconocer textos (OCR), detectar botones
de anuncios por su aspecto visual y ubicar coordenadas de captchas y elementos.
"""

import os
import re
import cv2
import numpy as np
from PIL import Image
import pytesseract
from typing import Dict, List, Tuple, Optional

class VisionEngine:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        # Configurar ruta opcional de tesseract si fuera necesario
        # pytesseract.pytesseract.tesseract_cmd = r'/usr/bin/tesseract'

    def detect_text_on_screen(self, image_path: str) -> List[Dict]:
        """
        Realiza OCR completo en la imagen y retorna todos los bloques de texto
        encontrados con sus coordenadas y confianza.
        """
        if not os.path.exists(image_path):
            return []

        try:
            # Cargar imagen y convertir a escala de grises para mejorar OCR
            img = cv2.imread(image_path)
            if img is None:
                return []
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Usar pytesseract para obtener el mapa de palabras completo
            data = pytesseract.image_to_data(gray, lang="spa+eng", output_type=pytesseract.Output.DICT)
            
            results = []
            n_boxes = len(data['text'])
            for i in range(n_boxes):
                text = data['text'][i].strip()
                conf = float(data['conf'][i])
                
                # Ignorar palabras vacías o con muy baja confianza
                if text and conf > 30:
                    results.append({
                        "text": text,
                        "confidence": conf,
                        "left": int(data['left'][i]),
                        "top": int(data['top'][i]),
                        "width": int(data['width'][i]),
                        "height": int(data['height'][i]),
                        "center_x": int(data['left'][i] + data['width'][i] / 2),
                        "center_y": int(data['top'][i] + data['height'][i] / 2)
                    })
            return results
        except Exception as e:
            print(f"[VisionEngine] Error en OCR: {str(e)}")
            return []

    def find_phrase_coordinates(self, image_path: str, phrase: str) -> Optional[Tuple[int, int]]:
        """
        Busca una frase o palabra específica (ej: "Saltar", "Skip Ad", "Omitir")
        en la captura y retorna sus coordenadas de centro (X, Y) si existe.
        """
        words = self.detect_text_on_screen(image_path)
        if not words:
            return None

        target = phrase.lower().strip()
        target_words = target.split()
        
        # Buscar palabras individuales
        for idx, w_info in enumerate(words):
            w_text = w_info["text"].lower()
            
            # Si coincide la primera palabra
            if target_words[0] in w_text or w_text in target_words[0]:
                # Verificar si las siguientes palabras coinciden en orden
                match_count = 1
                total_left = w_info["left"]
                total_top = w_info["top"]
                total_right = w_info["left"] + w_info["width"]
                total_bottom = w_info["top"] + w_info["height"]
                
                for offset in range(1, len(target_words)):
                    next_idx = idx + offset
                    if next_idx < len(words):
                        next_w = words[next_idx]
                        next_text = next_w["text"].lower()
                        # Si las palabras están en la misma línea y coinciden
                        if abs(next_w["top"] - w_info["top"]) < 20 and (target_words[offset] in next_text or next_text in target_words[offset]):
                            match_count += 1
                            total_right = max(total_right, next_w["left"] + next_w["width"])
                            total_bottom = max(total_bottom, next_w["top"] + next_w["height"])
                        else:
                            break
                            
                if match_count == len(target_words):
                    # Encontramos la frase completa. Retornar el centro geométrico.
                    cx = int((total_left + total_right) / 2)
                    cy = int((total_top + total_bottom) / 2)
                    return (cx, cy)
                    
        # Búsqueda difusa alternativa por si las palabras se unieron
        for w_info in words:
            if target in w_info["text"].lower() or w_info["text"].lower() in target:
                if len(w_info["text"]) >= min(3, len(target)):
                    return (w_info["center_x"], w_info["center_y"])
                    
        return None

    def find_template_on_screen(self, image_path: str, template_path: str, threshold: float = 0.8) -> List[Tuple[int, int, int, int]]:
        """
        Busca un patrón visual (template image) en la pantalla y retorna las
        coordenadas (x, y, w, h) de las coincidencias encontradas.
        """
        if not os.path.exists(image_path) or not os.path.exists(template_path):
            return []

        try:
            img = cv2.imread(image_path)
            template = cv2.imread(template_path)
            if img is None or template is None:
                return []

            img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            temp_gray = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)
            h, w = temp_gray.shape

            # Template matching normcoeff
            res = cv2.matchTemplate(img_gray, temp_gray, cv2.TM_CCOEFF_NORMED)
            loc = np.where(res >= threshold)
            
            matches = []
            for pt in zip(*loc[::-1]): # x, y
                # Filtrar duplicados muy cercanos (non-maxima suppression básica)
                too_close = False
                for existing in matches:
                    dist = np.sqrt((pt[0] - existing[0])**2 + (pt[1] - existing[1])**2)
                    if dist < 20:
                        too_close = True
                        break
                if not too_close:
                    matches.append((int(pt[0]), int(pt[1]), int(w), int(h)))
            return matches
        except Exception as e:
            print(f"[VisionEngine] Error en Template Matching: {str(e)}")
            return []

    def detect_skip_ad_button(self, image_path: str) -> Optional[Tuple[int, int]]:
        """
        Busca específicamente botones de omitir o saltar anuncios en la pantalla.
        """
        # Frases comunes de anuncios
        skip_phrases = [
            "saltar", 
            "omitir", 
            "saltar anuncio", 
            "omitir anuncio", 
            "skip ad", 
            "skipads",
            "skip",
            "anuncio",
            "no gracias",
            "no, gracias"
        ]
        
        for phrase in skip_phrases:
            coords = self.find_phrase_coordinates(image_path, phrase)
            if coords:
                print(f"[VisionEngine] Botón de omitir anuncio encontrado mediante OCR: '{phrase}' en {coords}")
                return coords
                
        # Si no se encuentra por texto, buscar patrones visuales comunes (como íconos 'x' de banners)
        # Podríamos hacer template matching de la "X" típica en el futuro.
        return None

    def segment_captcha_grid(self, image_path: str, grid_cols: int = 3, grid_rows: int = 3) -> List[Dict]:
        """
        Divide una sección de captcha (o toda la imagen) en una cuadrícula (grid)
        para poder interactuar con celdas individuales y compararlas.
        Retorna la caja delimitadora y el centro de cada celda.
        """
        if not os.path.exists(image_path):
            return []

        try:
            img = cv2.imread(image_path)
            if img is None:
                return []
                
            height, width, _ = img.shape
            
            cell_w = width / grid_cols
            cell_h = height / grid_rows
            
            cells = []
            for r in range(grid_rows):
                for c in range(grid_cols):
                    x1 = int(c * cell_w)
                    y1 = int(r * cell_h)
                    x2 = int((c + 1) * cell_w)
                    y2 = int((r + 1) * cell_h)
                    
                    # Recortar celda
                    crop = img[y1:y2, x1:x2]
                    
                    cells.append({
                        "row": r,
                        "col": c,
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                        "center_x": int(x1 + cell_w / 2),
                        "center_y": int(y1 + cell_h / 2),
                        "image_data": crop
                    })
            return cells
        except Exception as e:
            print(f"[VisionEngine] Error segmentando cuadrícula: {str(e)}")
            return []
