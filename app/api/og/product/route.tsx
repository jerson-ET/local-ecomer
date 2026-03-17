import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const imgUrl = searchParams.get('img')

    if (!imgUrl) {
      return new Response('Missing img', { status: 400 })
    }

    return new ImageResponse(
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#050505',
          position: 'relative',
        }}
      >
        {/* Satori maneja mejor los <img> absolutos para cover que backgroundImage */}
        <img
          src={imgUrl}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          alt="Fondo"
        />
        {/* Capa de oscurecimiento si lo deseas */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        />

        {/* Contenedor Flex para centrar el botón flotante en el eje X */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: 100,
            left: 0,
            right: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Sofisticado, serio, futurista */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(10, 15, 25, 0.85)',
              borderRadius: 40,
              padding: '24px 48px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(99, 102, 241, 0.3)',
              border: '2px solid rgba(139, 92, 246, 0.6)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 24,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              Para ver catálogo toca en
            </div>
            <div
              style={{
                display: 'flex',
                color: '#fff',
                fontSize: 44,
                fontWeight: 900,
                textShadow: '0 0 20px rgba(139, 92, 246, 0.8)',
              }}
            >
              LOCAL ECOMER
            </div>
          </div>
        </div>
      </div>,
      {
        width: 1080,
        height: 1920,
      }
    )
  } catch (e: unknown) {
    console.error(e)
    return new Response('Failed to generate image', { status: 500 })
  }
}
