const { createClient } = require('@supabase/supabase-js')

let sgMail = null
if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    console.log('[api/contact] SendGrid configured')
  } catch (e) {
    console.warn('[api/contact] failed to load @sendgrid/mail', e)
    sgMail = null
  }
}


const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch (e) { reject(e) }
    })
    req.on('error', err => reject(err))
  })
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let payload
  try {
     payload = await parseBody(req)
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const { name, email, organisation, subject, topic, message } = payload || {}
  if (!name || !email || !message) return res.status(400).json({ error: 'name, email and message required' })

  // Save to Supabase if configured
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const insert = await sb.from('messages').insert([{ name, email, organisation, subject, topic, message, created_at: new Date().toISOString() }])
      if (insert.error) console.warn('[api/contact] supabase insert error', insert.error)
      else console.log('[api/contact] saved to supabase')
    } catch (e) {
      console.error('[api/contact] supabase error', e)
    }
  }

  const toAddress = process.env.CONTACT_TO_EMAIL || 'ceconsultingafrique@gmail.com'
  const fromAddress = process.env.FROM_EMAIL || (process.env.SENDGRID_SENDER || toAddress)

  if (!sgMail) {
    return res.status(501).json({ error: 'Mail sending not configured. Set SENDGRID_API_KEY in Vercel env variables.' })
  }

  const subjectLine = subject || `Contact via site: ${topic || 'Contact'}`
  const text = `Nom: ${name}\nEmail: ${email}\nOrganisation: ${organisation || ''}\nSujet: ${subject || ''}\nThème: ${topic || ''}\n\nMessage:\n${message}`
  const html = `<p><strong>Nom:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Organisation:</strong> ${organisation || ''}</p><p><strong>Sujet:</strong> ${subject || ''}</p><p><strong>Thème:</strong> ${topic || ''}</p><hr/><p>${message.replace(/\n/g, '<br/>')}</p>`

  // Send email via SendGrid if configured

  if (sgMail) {
    try {
      await sgMail.send({
        to: process.env.CONTACT_TO_EMAIL || process.env.FROM_EMAIL,
        from: process.env.FROM_EMAIL,
        subject: `[Site Contact] ${subject || 'New message'}`,
        text: `Name: ${name}\nEmail: ${email}\nOrg: ${organisation || ''}\nTopic: ${topic || ''}\n---\n${message}`,
      })
      console.log('[api/contact] email sent via SendGrid')
    } catch (e) {
      console.error('[api/contact] sendgrid error', e)
    }
  } else {
    console.log('[api/contact] sendgrid not configured; skipping email')
  }
 
 
 
