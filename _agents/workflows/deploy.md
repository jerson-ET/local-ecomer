---
description: Como desplegar la aplicacion produccion sin usar Vercel CLI (Script Desplegar Rápido)
---
Para publicar los últimos cambios del código en el sitio web de producción (Vercel) sin necesidad de iniciar sesión en la herramienta CLI y sin que las reglas estrictas de sintaxis (Husky/Lint) bloqueen el proceso:

1. **Paso 1: Ejecutar el script central de despliegue principal.**
El repositorio cuenta con un wrapper optimizado llamado `desplegar.sh` que se encarga de:
- Guardar todos los cambios locales.
- Saltar validaciones de Lint/Husky (para mayor rapidez).
- Enviar los archivos directamente a GitHub (rama `main`).
- Resolver conflictos forzando la sincronización con la nube.

// turbo-all
2. Corre en la terminal:
```bash
./desplegar.sh "Corrección de logo, SEO y Splash screen"
```

3. **Verificación de finalización:** 
Una vez que el comando finalice, Vercel iniciará la compilación.
- La página `https://localecomer.store/` se actualizará en unos **90 segundos**.
- **IMPORTANTE:** Si no ves el nuevo logo de la tienda (techo rojo), presiona `CTRL + F5` para limpiar la caché del navegador.
- Para verificar el icono en Google, puede tomar unos días mientras Google vuelve a rastrear el sitio.
