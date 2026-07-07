import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has a referral code
    const { data: myRef } = await supabase
      .from('referrals')
      .select('ref_code')
      .eq('referrer_id', user.id)
      .limit(1)
      .maybeSingle()

    let refCode = myRef?.ref_code

    // If no code, auto-generate one
    if (!refCode) {
      const { data: profile } = await supabase.from('profiles').select('name, nombre').eq('id', user.id).single()
      const name = String(profile?.name || profile?.nombre || 'USER').toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4)
      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      refCode = `${name}${randomDigits}`
      
      // We don't save it yet until they actively share/create their first real referral entry,
      // but we return the string so they have something to share. 
      // Actually, let's create a "master" record or just let the system know this code is reserved.
      // For simplicity, we just return the generated code. In a real system, the code might be a property of the profile.
      // Since `referrals` table tracks the *invitations*, we will create a dummy record to reserve the code.
      await supabase.from('referrals').insert({
        referrer_id: user.id,
        ref_code: refCode,
        status: 'pending' // Just a placeholder to reserve the code
      })
    }

    // Fetch all referrals by this user
    const { data: referrals } = await supabase
      .from('referrals')
      .select(`
        id, status, commission_amount, created_at, converted_at,
        referred_id,
        profiles!referrals_referred_id_fkey (name, email)
      `)
      .eq('referrer_id', user.id)
      .neq('referred_id', null) // Only show actual invited people, not the placeholder
      .order('created_at', { ascending: false })

    const validReferrals = referrals || []
    
    const stats = {
      totalReferred: validReferrals.length,
      converted: validReferrals.filter(r => r.status === 'converted' || r.status === 'paid').length,
      totalEarned: validReferrals.reduce((sum, r) => sum + (Number(r.commission_amount) || 0), 0)
    }

    const host = request.headers.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const refLink = `${protocol}://${host}/?ref=${refCode}`

    return NextResponse.json({
      refCode,
      refLink,
      stats,
      referrals: validReferrals.map((r: any) => ({
        id: r.id,
        status: r.status,
        commission_amount: r.commission_amount,
        created_at: r.created_at,
        converted_at: r.converted_at,
        referred_name: r.profiles?.name || 'Usuario Anónimo'
      }))
    })

  } catch (error: any) {
    console.error('Error in GET /api/referrals:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'generate') {
      const { data: profile } = await supabase.from('profiles').select('name, nombre').eq('id', user.id).single()
      const name = String(profile?.name || profile?.nombre || 'USER').toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4)
      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      const refCode = `${name}${randomDigits}`
      
      await supabase.from('referrals').insert({
        referrer_id: user.id,
        ref_code: refCode,
        status: 'pending'
      })

      return NextResponse.json({ refCode })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Error in POST /api/referrals:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
