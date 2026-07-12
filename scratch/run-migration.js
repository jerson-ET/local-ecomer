const { Client } = require('pg')

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:J1e2r3s4;777@db.aonmnmyqtsxqjfqwohiy.supabase.co:5432/postgres'
  })

  try {
    await client.connect()
    console.log('Connected to Supabase Postgres!')
    
    console.log('Running migration...')
    const res = await client.query('alter table public.stores add column if not exists custom_domain text unique;')
    console.log('Migration ran successfully!', res)
  } catch (err) {
    console.error('Failed to run migration:', err)
  } finally {
    await client.end()
  }
}

main()
