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
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', err => reject(err))
  })
}

function safeText(value) {
  return String(value ?? '').trim()
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let payload
  try {
    payload = await parseBody(req)
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const name = safeText(payload?.name)
  const email = safeText(payload?.email)
  const organisation = safeText(payload?.organisation)
  const subject = safeText(payload?.subject)
  const topic = safeText(payload?.topic)
  const message = safeText(payload?.message)

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email and message required' })
  }

  const warnings = []

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const insert = await sb.from('messages').insert([
        {
          name,
          email,
          organisation,
          subject,
          topic,
          message,
          created_at: new Date().toISOString()
        }
      ])

      if (insert.error) {
        warnings.push('supabase insert failed')
        console.warn('[api/contact] supabase insert error', insert.error)
      } else {
        console.log('[api/contact] saved to supabase')
      }
    } catch (e) {
      warnings.push('supabase unavailable')
      console.error('[api/contact] supabase error', e)
    }
  } else {
    warnings.push('supabase not configured')
  }

  const toAddress = process.env.CONTACT_TO_EMAIL || 'ceconsultingafrique@gmail.com'
  const fromAddress = process.env.FROM_EMAIL || process.env.SENDGRID_SENDER || toAddress
  const subjectLine = subject || `Contact via site: ${topic || 'Contact'}`
  const text = [
    `Nom: ${name}`,
    `Email: ${email}`,
    `Organisation: ${organisation}`,
    `Sujet: ${subject}`,
    `Thème: ${topic}`,
    '',
    'Message:',
    message
  ].join('\n')

  if (sgMail) {
    try {
      await sgMail.send({
        to: toAddress,
        from: fromAddress,
        subject: `[Site Contact] ${subjectLine}`,
        text
      })
      console.log('[api/contact] email sent via SendGrid')
    } catch (e) {
      warnings.push('sendgrid failed')
      console.error('[api/contact] sendgrid error', e)
    }
  } else {
    warnings.push('sendgrid not configured')
    console.log('[api/contact] sendgrid not configured; skipping email')
  }

  return res.status(200).json({
    ok: true,
    message: 'Message reçu. Nous vous répondrons bientôt.',
    warnings
  })
}
