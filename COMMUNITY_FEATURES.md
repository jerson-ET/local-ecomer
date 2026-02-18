# Documentación de Funcionalidades de Comunidad y Tienda (Feed Inteligente y Checkout WhatsApp)

Esta documentación describe las mejoras implementadas en la sección de Comunidad, Búsqueda Inteligente e Integración con Tiendas, realizadas en la sesión del 15 de Febrero de 2026.

## 1. Feed Comunitario Categorizado (`app/community/page.tsx`)

Transformamos la sección de comunidad en un **Feed de Productos** organizado por categorías, similar a un marketplace social.

### Características Principales:
- **Categorías**: Implementamos un scroll horizontal de "pills" para filtrar publicaciones por:
  - Modas (`Moda`)
  - Hogar (`Hogar`)
  - Tecnología (`Tecnología`)
  - Mascotas (`Mascotas`)
  - Alimentos (`Comida`)
  - Belleza (`Belleza`)
  - Otros
- **Búsqueda Global**: Al buscar algo (ej: "zapatos"), se ignora la categoría actual y se busca en todo el catálogo de publicaciones.
- **Interacción Social**: Mantuvimos Likes, Comentarios y Guardados.
- **Enlaces Directos**:
  - **"Ver más"**: Lleva a la tienda del vendedor.
  - **"Ver detalles"**: Lleva a la tienda y abre automáticamente el modal del producto específico.

### Estilos (`app/community/community.css`):
- Se añadieron estilos para `.cm-categories-scroll` (scroll de categorías).
- Se implementó `.cm-search-overlay` para una experiencia de búsqueda inmersiva.
- Se actualizó el diseño de los botones de acción para ser más claros ("Ver detalles" con icono de ojo).

---

## 2. Búsqueda Inteligente "Fuzzy Search" (`lib/fuzzySearch.ts`)

Implementamos un algoritmo de búsqueda difusa que "adivina" la intención del usuario incluso con errores ortográficos.

### Cómo funciona:
1. **Normalización**: Convierte texto a minúsculas y elimina acentos.
2. **Coincidencia Exacta**: Prioridad máxima (100 puntos).
3. **Contención de Palabras**: Si la palabra buscada está contenida en el texto (50 puntos).
4. **Coincidencia Aproximada**: Compara caracteres secuenciales para detectar similitudes (ej: "zapato" vs "zapatio") (10 puntos).
5. **Ranking**: Ordena los resultados por puntuación descendente.

Esto permite que búsquedas como "comida perr" encuentren "Alimento para Perro".

---

## 3. Integración Tienda y Modal de Producto (`app/store/mascotas/page.tsx`)

Mejoramos la experiencia de compra permitiendo ver detalles de productos sin salir del contexto de la tienda, y facilitando pedidos por WhatsApp.

### Modal de Detalle de Producto:
- **Activación por URL**: La tienda detecta el parámetro `?product=ID` en la URL.
  - Ejemplo: `tienda.com/store/mascotas?product=pet-4`
- **Contenido del Modal**:
  - Imagen grande.
  - Título y Precio.
  - Descripción detallada (campo nuevo añadido a la interfaz `Product`).
  - Selector de **Colores** y **Tallas** (S, M, L).
  - Botón "Agregar al Carrito".
- **Estilos (`mascotas.css`)**: Se añadieron clases `.pet-modal-overlay` y animaciones de entrada (`petScaleIn`).

### Integración con Comunidad:
- Desde el feed de comunidad, los productos enlazan directamente a este modal usando la URL con parámetros.

---

## 4. Checkout por WhatsApp

Reemplazamos el flujo de pago tradicional por un pedido directo a WhatsApp, ideal para comercio local.

### Funcionamiento:
- En el carrito de compras, el botón "Pagar Ahora" se cambió por **"Pedir por WhatsApp"**.
- Al hacer clic, se genera automáticamente un mensaje con:
  - Saludo a la tienda.
  - Lista de productos con cantidades y precios.
  - Total calculado.
  - Pregunta sobre disponibilidad y envío.
- Se abre la API de WhatsApp (`wa.me`) con el mensaje pre-llenado.

---

## Resumen de Archivos Modificados

1.  **`app/community/page.tsx`**: Lógica de feed, categorías y enlaces a producto.
2.  **`app/community/community.css`**: Estilos de categorías y búsqueda.
3.  **`lib/fuzzySearch.ts`**: (Nuevo) Utilidad de búsqueda inteligente.
4.  **`app/store/mascotas/page.tsx`**: Lógica de modal de producto y checkout WhatsApp.
5.  **`app/store/mascotas/mascotas.css`**: Estilos del modal y botón WhatsApp.
6.  **`app/dashboard/dashboard.css`**: Estilos para analíticas de comunidad en el panel.

---

**Nota para el usuario**: Para replicar la funcionalidad del Modal de Producto en otras tiendas (ej: `calzado`, `moda`), se debe copiar la lógica de `useEffect` con `useSearchParams` y el bloque del modal desde `app/store/mascotas/page.tsx` hacia los archivos `page.tsx` de las respectivas tiendas.
