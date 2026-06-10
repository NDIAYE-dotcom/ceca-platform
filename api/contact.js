const { createClient } = require('@supabase/supabase-js')
const nodemailer = require('nodemailer')

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

function buildSmtpTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

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
  const fromAddress = 'ceconsultingafrique@gmail.com' // SendGrid verified sender
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

  const smtpTransport = buildSmtpTransport()

  if (sgMail) {
    try {
      await sgMail.send({
        to: toAddress,
        from: fromAddress,
        subject: `[Site Contact] ${subjectLine}`,
        text
      })
      console.log('[api/contact] email sent via SendGrid')
      return res.status(200).json({
        ok: true,
        delivered: true,
        message: 'Message envoyé par e-mail.',
        warnings
      })
    } catch (e) {
      warnings.push('sendgrid failed')
      const sendgridError = e?.response?.body?.errors?.[0]?.message || e?.message || String(e)
      console.error('[api/contact] sendgrid error', sendgridError)
      return res.status(500).json({
        ok: false,
        delivered: false,
        error: `SendGrid a refusé l'envoi: ${sendgridError}`,
        warnings
      })
    }
  }

  if (smtpTransport) {
    try {
      await smtpTransport.sendMail({
        from: `${name} <${fromAddress}>`,
        to: toAddress,
        subject: `[Site Contact] ${subjectLine}`,
        text
      })
      console.log('[api/contact] email sent via SMTP')
      return res.status(200).json({
        ok: true,
        delivered: true,
        message: 'Message envoyé par e-mail.',
        warnings
      })
    } catch (e) {
      warnings.push('smtp failed')
      console.error('[api/contact] smtp error', e)
      return res.status(500).json({
        ok: false,
        delivered: false,
        error: `SMTP a refusé l'envoi: ${e?.message || String(e)}`,
        warnings
      })
    }
  }

  warnings.push('mail not configured')
  console.log('[api/contact] mail not configured; saved only')

  return res.status(200).json({
    ok: true,
    delivered: false,
    message: 'Message reçu, mais l’envoi e-mail n’est pas configuré.',
    warnings
  })
}
