import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  // we use rpc instead
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(
    'c968160a-44aa-4916-ae56-d6c16330c121'
  )
  console.log(data)
}

run()
