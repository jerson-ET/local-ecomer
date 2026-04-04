import { redirect } from 'next/navigation'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  /community → Redirige a la comunidad de Telegram                         */
/*  La red de afiliados fue eliminada del proyecto.                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function CommunityPage() {
  redirect('https://t.me/localecomer')
}
