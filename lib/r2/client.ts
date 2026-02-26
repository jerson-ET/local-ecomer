/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                   CLIENTE DE CLOUDFLARE R2                                   */
/*                                                                              */
/*   Propósito     : Manejar almacenamiento de imágenes en Cloudflare R2        */
/*   Uso           : Subir y eliminar imágenes de productos y tiendas           */
/*   Archivo       : lib/r2/client.ts                                           */
/*                                                                              */
/*   ¿QUÉ ES CLOUDFLARE R2?                                                     */
/*   R2 es un servicio de almacenamiento de objetos (similar a AWS S3)          */
/*   pero con costo CERO en transferencia de datos (egress).                    */
/*   Perfecto para almacenar imágenes de productos que se acceden mucho.        */
/*                                                                              */
/*   FUNCIONALIDADES DE ESTE MÓDULO:                                            */
/*   - Subir imágenes al bucket de R2                                           */
/*   - Eliminar imágenes del bucket                                             */
/*   - Obtener URLs públicas de las imágenes                                    */
/*                                                                              */
/*   VARIABLES DE ENTORNO NECESARIAS:                                           */
/*   - R2_ENDPOINT         : URL del endpoint de R2                             */
/*   - R2_ACCESS_KEY_ID    : ID de la clave de acceso                           */
/*   - R2_SECRET_ACCESS_KEY: Clave secreta de acceso                            */
/*   - R2_BUCKET_NAME      : Nombre del bucket                                  */
/*   - R2_PUBLIC_URL       : URL pública del bucket                             */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────────────────────────────────── */
/*                              IMPORTACIONES                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/* Cliente S3 de AWS SDK - R2 es compatible con la API de S3                    */
import {
    DeleteObjectCommand,  /* Comando para eliminar un objeto del bucket         */
    PutObjectCommand,     /* Comando para subir un objeto al bucket             */
    S3Client,             /* Cliente S3 para conectar con R2                    */
} from '@aws-sdk/client-s3'

import dns from 'dns'
if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first')
}


/* ─────────────────────────────────────────────────────────────────────────── */
/*                       CONFIGURACIÓN DEL CLIENTE                              */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Cliente de S3 configurado para Cloudflare R2
 * ──────────────────────────────────────────────
 * 
 * Cloudflare R2 es compatible con la API de S3, por lo que
 * podemos usar el SDK de AWS para conectarnos.
 * 
 * NOTA: Las variables de entorno se leen en runtime, por lo que
 * el cliente se crea aunque las variables no estén definidas.
 * Los errores ocurrirán en el momento de usar el cliente.
 */
/* Obtener variables de entorno con valores por defecto                         */
const r2Endpoint = process.env.R2_ENDPOINT ?? ''
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID ?? ''
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? ''

/**
 * Cliente de S3 configurado para Cloudflare R2
 * ──────────────────────────────────────────────
 * 
 * Cloudflare R2 es compatible con la API de S3, por lo que
 * podemos usar el SDK de AWS para conectarnos.
 * 
 * NOTA: Si las variables de entorno no están definidas,
 * el cliente usará strings vacíos y fallará en runtime.
 */
const s3Client = new S3Client({

    /* Región: R2 usa 'auto' para seleccionar automáticamente                   */
    region: 'auto',

    /* Endpoint personalizado de Cloudflare R2                                   */
    /* Formato: https://<ACCOUNT_ID>.r2.cloudflarestorage.com                    */
    ...(r2Endpoint && { endpoint: r2Endpoint }),

    /* Credenciales de acceso al bucket                                          */
    credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
    },

    /* ⚠️ CRÍTICO para Cloudflare R2:                                            */
    /* R2 NO soporta virtual-hosted-style URLs (bucket.endpoint.com).           */
    /* Con forcePathStyle=true el SDK usa: endpoint.com/bucket/key              */
    /* Sin esto la firma falla porque el host calculado no coincide.            */
    forcePathStyle: true,

    /* Deshabilitar checksum automático CRC32 del SDK v3 que R2 rechaza         */
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
})

/**
 * Nombre del bucket donde se almacenan las imágenes
 * ───────────────────────────────────────────────────
 * 
 * Se lee de la variable de entorno R2_BUCKET_NAME.
 * Default: 'localecomer' si no está definida.
 */
const bucketName = process.env.R2_BUCKET_NAME ?? 'localecomer'


/* ─────────────────────────────────────────────────────────────────────────── */
/*                    FUNCIONES DE ALMACENAMIENTO                               */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Sube una imagen al bucket de R2
 * ─────────────────────────────────
 * 
 * @param   {Buffer} file        - Contenido del archivo en formato Buffer
 * @param   {string} key         - Ruta/nombre del archivo en el bucket
 * @param   {string} contentType - Tipo MIME del archivo (ej: 'image/webp')
 * @returns {Promise<string>}    - URL pública del archivo subido
 * 
 * EJEMPLO DE USO:
 *   const imageBuffer = await processImage(file)
 *   const publicUrl = await uploadToR2(
 *     imageBuffer,
 *     'products/123/main.webp',
 *     'image/webp'
 *   )
 * 
 * FLUJO:
 *   1. Crear comando de subida con los datos del archivo
 *   2. Enviar el comando al cliente S3/R2
 *   3. Retornar la URL pública del archivo
 */
export async function uploadToR2(
    file: Buffer,  /* Contenido binario del archivo                       */
    key: string,  /* Ruta del archivo (ej: 'products/123/main.webp')     */
    contentType: string   /* Tipo MIME (ej: 'image/webp', 'image/jpeg')          */
): Promise<string> {

    /* ─────────────────────────────────────────────────────────────────────── */
    /*                     CREAR COMANDO DE SUBIDA                              */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* PutObjectCommand prepara la subida con todos los parámetros              */
    const command = new PutObjectCommand({
        Bucket: bucketName,   /* Nombre del bucket destino                 */
        Key: key,          /* Ruta/nombre del archivo                   */
        Body: file,         /* Contenido del archivo                     */
        ContentType: contentType,  /* Tipo MIME para headers de respuesta      */
    })

    /* ─────────────────────────────────────────────────────────────────────── */
    /*                        EJECUTAR SUBIDA                                   */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* Enviar el comando al cliente S3/R2                                        */
    /* Esto sube el archivo y espera la confirmación                             */
    await s3Client.send(command)

    /* ─────────────────────────────────────────────────────────────────────── */
    /*                     CONSTRUIR Y RETORNAR URL                             */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* La URL pública se construye con la URL base + ruta del archivo            */
    /* Ejemplo: https://images.localecomer.com/products/123/main.webp            */
    return `${process.env.R2_PUBLIC_URL}/${key}`
}

/**
 * Elimina una imagen del bucket de R2
 * ─────────────────────────────────────
 * 
 * @param {string} key - Ruta/nombre del archivo a eliminar
 * @returns {Promise<void>}
 * 
 * EJEMPLO DE USO:
 *   await deleteFromR2('products/123/main.webp')
 * 
 * NOTA: Esta función no lanza error si el archivo no existe.
 * Esto es por diseño de la API de S3 (operación idempotente).
 */
export async function deleteFromR2(key: string): Promise<void> {

    /* ─────────────────────────────────────────────────────────────────────── */
    /*                   CREAR COMANDO DE ELIMINACIÓN                           */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* DeleteObjectCommand prepara la eliminación del archivo                    */
    const command = new DeleteObjectCommand({
        Bucket: bucketName, /* Nombre del bucket                                 */
        Key: key,        /* Ruta del archivo a eliminar                       */
    })

    /* ─────────────────────────────────────────────────────────────────────── */
    /*                      EJECUTAR ELIMINACIÓN                                */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* Enviar el comando al cliente S3/R2                                        */
    await s3Client.send(command)
}

/**
 * Construye la URL pública de un archivo en R2
 * ──────────────────────────────────────────────
 * 
 * @param   {string} key - Ruta/nombre del archivo
 * @returns {string}     - URL pública completa
 * 
 * EJEMPLO DE USO:
 *   const url = getPublicUrl('products/123/main.webp')
 *   // Resultado: https://images.localecomer.com/products/123/main.webp
 */
export function getPublicUrl(key: string): string {

    /* Concatenar la URL base con la ruta del archivo                            */
    return `${process.env.R2_PUBLIC_URL}/${key}`
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            FIN DEL ARCHIVO                                   */
/*                                                                              */
/*   CONFIGURACIÓN EN CLOUDFLARE:                                               */
/*   1. Crear un bucket en R2 (Panel de Cloudflare -> R2)                       */
/*   2. Crear una API Token con permisos de Object Read & Write                 */
/*   3. Configurar un dominio público para el bucket                            */
/*   4. Agregar las variables de entorno en .env.local                          */
/*                                                                              */
/*   VARIABLES DE ENTORNO EJEMPLO:                                              */
/*   R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com                           */
/*   R2_ACCESS_KEY_ID=xxxxxx                                                    */
/*   R2_SECRET_ACCESS_KEY=xxxxxx                                                */
/*   R2_BUCKET_NAME=localecomer                                                 */
/*   R2_PUBLIC_URL=https://images.localecomer.com                               */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
