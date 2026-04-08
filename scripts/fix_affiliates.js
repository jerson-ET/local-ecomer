import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data: usersData, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error(error);
        return;
    }
    const users = usersData.users;
    console.log(`Analizando ${users.length} usuarios totales...`);
    for (const user of users) {
        const meta = user.user_metadata || {};
        // Si tiene un codigo de referido que haya usado:
        const codeUsed = meta.referred_by || meta.referred_by_code || null;
        const isPro = meta.paid_until && new Date(meta.paid_until).getTime() > Date.now() + 7 * 24 * 60 * 60 * 1000;
        if (codeUsed && isPro) {
            console.log(`✅ [PRO USER] ${meta.nombre || user.email} usó el código ${codeUsed}`);
            // Busquemos a su papá
            const parent = users.find(u => u.user_metadata?.referral_code === codeUsed.toUpperCase());
            if (parent) {
                console.log(`   -> Su papá es ${parent.user_metadata?.nombre || parent.email}`);
                const pMeta = parent.user_metadata || {};
                const prospects = Array.isArray(pMeta.affiliate_prospects) ? pMeta.affiliate_prospects : [];
                const prospectMatch = prospects.find(p => p.id === user.id || p.whatsapp === meta.telefono || p.name.includes(meta.nombre));
                if (prospectMatch) {
                    console.log(`   -> Prospect detectado en el papá: Estado actual: ${prospectMatch.status}`);
                    if (prospectMatch.status === 'pending') {
                        console.log(`   🔥 CORRIGIENDO: actualizando a active y dando comisión!`);
                        const updatedProspects = prospects.map(p => p.id === prospectMatch.id ? { ...p, status: 'active', id: user.id } : p);
                        const earnings = Array.isArray(pMeta.earnings) ? pMeta.earnings : [];
                        // Ver si ya se le pagó por esta persona (por nombre)
                        const alreadyPaid = earnings.some((e) => e.description.includes(meta.nombre || user.email));
                        let updatedEarnings = earnings;
                        if (!alreadyPaid) {
                            updatedEarnings = [{
                                    id: Math.random().toString(36),
                                    amount: 10000,
                                    description: `Comisión recuperada por activación Pro: ${meta.nombre || user.email}`,
                                    createdAt: new Date().toISOString()
                                }, ...earnings];
                        }
                        await supabase.auth.admin.updateUserById(parent.id, {
                            user_metadata: {
                                ...pMeta,
                                affiliate_prospects: updatedProspects,
                                earnings: updatedEarnings
                            }
                        });
                        console.log(`   🌟 Arreglado papá de ${meta.nombre}`);
                    }
                }
                else {
                    console.log(`   🚨 ALERTA: ${meta.nombre || user.email} usó el código ${codeUsed} pero NO ESTÁ en la lista affiliate_prospects de su papá!`);
                    console.log(`   🔥 CORRIGIENDO: agregándolo directamente!`);
                    const newProspect = {
                        id: user.id,
                        name: meta.nombre || user.email,
                        whatsapp: meta.telefono || '',
                        status: 'active',
                        createdAt: new Date().toISOString()
                    };
                    const earnings = Array.isArray(pMeta.earnings) ? pMeta.earnings : [];
                    const alreadyPaid = earnings.some(e => e.description.includes(meta.nombre || user.email));
                    let updatedEarnings = earnings;
                    if (!alreadyPaid) {
                        updatedEarnings = [{
                                id: Math.random().toString(36),
                                amount: 10000,
                                description: `Comisión recuperada por activación Pro: ${meta.nombre || user.email}`,
                                createdAt: new Date().toISOString()
                            }, ...earnings];
                    }
                    await supabase.auth.admin.updateUserById(parent.id, {
                        user_metadata: {
                            ...pMeta,
                            affiliate_prospects: [newProspect, ...prospects],
                            earnings: updatedEarnings
                        }
                    });
                    console.log(`   🌟 Agregado y activado.`);
                }
            }
            else {
                console.log(`   ⚠️ Padren con código ${codeUsed} no existe!`);
            }
        }
    }
    console.log('Finalizado.');
}
run();
