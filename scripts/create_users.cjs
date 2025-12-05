require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY){
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function createAndUpsert(email, password, fullName, role){
  try{
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if(error){
      // If user already exists or other error, log and try to find existing user
      console.error('createUser error for', email, error.message || error.toString())
      // Try to find existing user in auth.users
      const { data: existing } = await supabaseAdmin
        .from('auth.users')
        .select('id, email')
        .eq('email', email)
        .limit(1)
      const userId = existing && existing[0] && existing[0].id
      if(!userId){
        console.warn('No existing auth user found for', email)
        return null
      }
      // upsert profile using found id
      const { error: upErr } = await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email,
        full_name: fullName,
        role
      })
      if(upErr) console.error('Upsert profile error for existing user', upErr)
      else console.log('Profile upserted for existing user', email)
      return { id: userId, email }
    }

    const user = data.user ?? data
    console.log('Created auth user', user.id, user.email)

    const { error: upsertErr } = await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      role
    })
    if(upsertErr) console.error('Upsert profile error:', upsertErr)
    else console.log('Profile upserted for', user.email)

    return { id: user.id, email: user.email }
  }catch(e){
    console.error('Unexpected error for', email, e)
    return null
  }
}

async function run(){
  // Edit these entries if you want different emails/passwords
  await createAndUpsert('ceca-admin@gmail.com', 'TempAdminPass123!', 'CECA Admin', 'admin')
  await createAndUpsert('ceca-user@example.com', 'TempUserPass123!', 'CECA User', 'user')

  // Show result
  const { data, error } = await supabaseAdmin.from('profiles').select('id,email,role').in('email', ['ceca-admin@gmail.com','ceca-user@example.com'])
  if(error) console.error('Select profiles error:', error)
  else console.log('Profiles:', data)
}

run()
