import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
    }

    // Look up the referrer_id by finding a referral row with that ref_code
    const { data: referrerData, error: referrerError } = await supabase
      .from('referrals')
      .select('referrer_id')
      .eq('ref_code', code)
      .limit(1)
      .single();

    if (referrerError || !referrerData) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
    }

    const referrerId = referrerData.referrer_id;

    if (referrerId === user.id) {
      return NextResponse.json({ error: 'No puedes usar tu propio código' }, { status: 400 });
    }

    // Check if the current user has already been referred
    const { data: existingReferral, error: existingError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', user.id)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: 'Error checking existing referral' }, { status: 500 });
    }

    if (existingReferral) {
      return NextResponse.json({ error: 'El usuario ya ha sido referido' }, { status: 400 });
    }

    // Create a new row in referrals
    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_id: user.id,
        ref_code: code,
        status: 'converted',
        commission_amount: 50000,
        converted_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting referral:', insertError);
      return NextResponse.json({ error: 'Error al procesar el referido' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Código canjeado exitosamente' });
  } catch (error) {
    console.error('Redeem referral error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
