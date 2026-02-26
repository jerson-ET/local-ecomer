import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) {
        console.error('Error fetching users:', error)
        return
    }

    for (const user of users) {
        const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single()
        if (!profile) {
            console.log(`NO PROFILE FOUND FOR ${user.email}. Creating one...`)
            const { error: insertError } = await supabaseAdmin.from('profiles').insert({
                id: user.id,
                nombre: user.user_metadata?.nombre || user.email?.split('@')[0] || 'Unknown'
            })
            if (insertError) {
                console.error(`Failed to create profile:`, insertError)
            } else {
                console.log(`Successfully created profile for ${user.email}`)
            }
        }
    }
}

run()
