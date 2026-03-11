export type TaskStep = {
  id: string
  type: 'CHOICE' | 'TEXT_INPUT' | 'NUMBER_INPUT' | 'FILE_UPLOAD' | 'CONFIRMATION' | 'DISPLAY'
  message: string
  options?: string[]
  next?: (input: string | null) => string | null // Returns ID of next step or null if end
}

export type TaskFlow = {
  id: string
  name: string
  icon: string // Lucide icon name
  steps: Record<string, TaskStep>
  initialStep: string
}

export const TASK_FLOWS: Record<string, TaskFlow> = {
  'create-product': {
    id: 'create-product',
    name: 'Publicar Producto',
    icon: 'PlusCircle',
    initialStep: 'category',
    steps: {
      category: {
        id: 'category',
        type: 'CHOICE',
        message: '¿En qué categoría quieres publicar tu producto?',
        options: ['Moda', 'Tecnología', 'Hogar', 'Deportes', 'Mascotas', 'Otras'],
        next: () => 'name',
      },
      name: {
        id: 'name',
        type: 'TEXT_INPUT',
        message: 'Perfecto. ¿Cuál es el nombre del producto?',
        next: () => 'price',
      },
      price: {
        id: 'price',
        type: 'NUMBER_INPUT',
        message: '¿Qué precio tiene? (Solo números, sin signos)',
        next: () => 'images',
      },
      images: {
        id: 'images',
        type: 'FILE_UPLOAD',
        message: 'Sube las fotos de tu producto. Recomiendo al menos 3 ángulos.',
        next: () => 'description-mode',
      },
      'description-mode': {
        id: 'description-mode',
        type: 'CHOICE',
        message: '¿Cómo quieres la descripción?',
        options: [
          'Escribir manual',
          'Generar con IA (Vendedor Experto)',
          'Generar con IA (Divertido)',
        ],
        next: (choice) => (choice?.includes('IA') ? 'generating' : 'manual-description'),
      },
      'manual-description': {
        id: 'manual-description',
        type: 'TEXT_INPUT',
        message: 'Escribe la descripción detallada de tu producto:',
        next: () => 'review',
      },
      generating: {
        id: 'generating',
        type: 'DISPLAY',
        message: 'Generando una descripción vendedora increíble para ti...',
        next: () => 'review-auto',
      },
      'review-auto': {
        id: 'review-auto',
        type: 'CONFIRMATION',
        message: 'He creado esta publicación. ¿La publicamos ahora?',
        next: () => 'success',
      },
      review: {
        id: 'review',
        type: 'CONFIRMATION',
        message: 'Todo listo. ¿Publicamos el producto en tu tienda y en el feed de la comunidad?',
        next: () => 'success',
      },
      success: {
        id: 'success',
        type: 'DISPLAY',
        message:
          '¡Excelente! Tu producto ha sido publicado exitosamente. Puedes verlo en tu tienda.',
        next: () => null,
      },
    },
  },
  'organize-store': {
    id: 'organize-store',
    name: 'Organizar Tienda',
    icon: 'Store',
    initialStep: 'scan',
    steps: {
      scan: {
        id: 'scan',
        type: 'DISPLAY',
        message: 'Analizando el estado de tu tienda...',
        next: () => 'audit-result',
      },
      'audit-result': {
        id: 'audit-result',
        type: 'CHOICE',
        message:
          'He notado que te faltan algunos elementos clave para vender más. ¿Por dónde empezamos?',
        options: [
          'Subir Logo/Banner',
          'Crear Categorías',
          'Configurar Horarios',
          'Política de Envíos',
        ],
        next: (choice) => {
          if (choice?.includes('Logo')) return 'upload-logo'
          if (choice?.includes('Categorías')) return 'create-categories'
          return 'info-config'
        },
      },
      'upload-logo': {
        id: 'upload-logo',
        type: 'FILE_UPLOAD',
        message: 'Sube tu logo aquí. Debe ser cuadrado y de alta calidad.',
        next: () => 'success-update',
      },
      'create-categories': {
        id: 'create-categories',
        type: 'TEXT_INPUT',
        message:
          'Escribe los nombres de las categorías separados por comas (ej: Camisas, Pantalones):',
        next: () => 'success-update',
      },
      'info-config': {
        id: 'info-config',
        type: 'TEXT_INPUT',
        message: 'Ingresa la información solicitada:',
        next: () => 'success-update',
      },
      'success-update': {
        id: 'success-update',
        type: 'DISPLAY',
        message: '¡Tienda actualizada! Se ve mucho más profesional ahora.',
        next: () => null,
      },
    },
  },
  'create-ad': {
    id: 'create-ad',
    name: 'Crear Anuncio',
    icon: 'Megaphone',
    initialStep: 'select-product',
    steps: {
      'select-product': {
        id: 'select-product',
        type: 'TEXT_INPUT',
        message: '¿De qué producto quieres crear un anuncio? (Escribe el nombre)',
        next: () => 'select-tone',
      },
      'select-tone': {
        id: 'select-tone',
        type: 'CHOICE',
        message: '¿Qué tono quieres para el anuncio?',
        options: ['Urgencia (Oferta Limitada)', 'Profesional', 'Divertido/Viral'],
        next: () => 'generating-ad',
      },
      'generating-ad': {
        id: 'generating-ad',
        type: 'DISPLAY',
        message: 'Redactando el copy perfecto para redes sociales...',
        next: () => 'show-ad',
      },
      'show-ad': {
        id: 'show-ad',
        type: 'CONFIRMATION',
        message:
          'Aquí tienes tu anuncio:\n\n"¡NO TE LO PIERDAS! 🚀\nOferta exclusiva por tiempo limitado.\nConsigue tu producto YA antes de que se agote.\n\n👉 Compra aquí"',
        next: () => 'post-community',
      },
      'post-community': {
        id: 'post-community',
        type: 'CHOICE',
        message: '¿Quieres publicarlo automáticamente en el chat de la comunidad?',
        options: ['Sí, publicar', 'No, solo copiar'],
        next: () => 'finish-ad',
      },
      'finish-ad': {
        id: 'finish-ad',
        type: 'DISPLAY',
        message: '¡Listo! Tu estrategia de marketing está en marcha.',
        next: () => null,
      },
    },
  },
}
