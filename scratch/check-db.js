const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://aonmnmyqtsxqjfqwohiy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbm1ubXlxdHN4cWpmcXdvaGl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQyNjUyNywiZXhwIjoyMDg3MDAyNTI3fQ.NCrQCmlsoER7e8CHqQc9KCP4A3Y2LtL_ms-f3_XiAhw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('--- FIXING MISSING PROFILE FOR jerson@acesor ---')
  
  const userId = '51445d4f-d1a4-4dfb-8ad9-442e06687277'
  
  const { data, error } = await supabase.from('profiles').upsert({
    id: userId,
    email: 'jerson@acesor',
    nombre: 'jerson masa',
    role: 'sales',
    telefono: '3005730682',
    phone_verified: true
  }).select()

  if (error) {
    console.error('Error creating profile:', error)
  } else {
    console.log('Profile fixed successfully:', data)
  }
}

main()
