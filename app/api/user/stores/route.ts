import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json([], { status: 200 })
    }

    const { data: stores } = await supabase
      .from('stores')
      .select('id, name, slug')
      .eq('user_id', user.id)

    return NextResponse.json(stores || [])
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
