require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users.users.find(u => u.email === 'etjerson@gmail.com')
  
  if (!user) {
    console.log('user not found')
    return
  }
  
  console.log('User found:', user.id)
  
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  console.log('Profile:', profile)
  
  if (!profile) {
   const res = await supabase.from('profiles').insert({
                id: user.id,
                email: user.email,
                role: 'seller',
                name: 'etjerson',
            })
   console.log('insert profile res', res)
  }
}

test()
