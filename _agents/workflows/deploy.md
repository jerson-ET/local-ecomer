---
description: Como desplegar la aplicacion produccion sin usar Vercel CLI (Script Desplegar Rápido)
---
Para publicar los últimos cambios del código en el sitio web de producción (Vercel) sin necesidad de iniciar sesión en la herramienta CLI y sin que las reglas estrictas de sintaxis (Husky/Lint) bloqueen el proceso:

1. **Paso 1: Ejecutar el script central de despliegue principal.**
El repositorio cuenta con un wrapper optimizado llamado `desplegar.sh` que se encarga de guardar y enviar los archivos directamente a la rama `main` del Github conectado, activando la compilación automatizada de Vercel.

// turbo-all
2. Corre en la terminal:
```bash
./desplegar.sh "el mensaje de la actualización que realizaste"
```

3. **Verificación de finalización:** 
Una vez que el comando devuelve el texto "¡Listo! Los cambios están en proceso de despliegue.", la página será actualizada en aproximadamente 1 minuto. Puedes verificarlo recargando el dashboard de Vercel en el navegador o directamente ingresando a `https://localecomer.store/`.
