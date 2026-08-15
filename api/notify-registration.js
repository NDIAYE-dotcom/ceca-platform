const nodemailer = require('nodemailer')

let sgMail = null
if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    console.log('[api/notify-registration] SendGrid configured')
  } catch (e) {
    console.warn('[api/notify-registration] failed to load @sendgrid/mail', e)
    sgMail = null
  }
}

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

// Same reasoning as api/contact.js: req.body is already parsed by Vercel's
// Node runtime, reading the stream again here would hang.
function getPayload(req) {
  const body = req.body
  if (body && typeof body === 'object') return body
  if (typeof body === 'string' && body.length) {
    try { return JSON.parse(body) } catch (e) { return null }
  }
  return {}
}

function safeText(value) {
  return String(value ?? '').trim()
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload = getPayload(req)
  if (payload === null) {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const name = safeText(payload?.name)
  const email = safeText(payload?.email)
  const phone = safeText(payload?.phone)
  const organization = safeText(payload?.organization)
  const formationTitle = safeText(payload?.formation_title)
  const paymentMethod = safeText(payload?.payment_method)
  const notes = safeText(payload?.notes)

  if (!name || !email || !formationTitle) {
    return res.status(400).json({ error: 'name, email and formation_title required' })
  }

  const toAddress = process.env.CONTACT_TO_EMAIL || 'ceconsultingafrique@gmail.com'
  const fromAddress = 'ceconsultingafrique@gmail.com' // SendGrid verified sender

  const adminText = [
    `Nouvelle inscription : ${formationTitle}`,
    '',
    `Nom: ${name}`,
    `Email: ${email}`,
    `Téléphone: ${phone || '—'}`,
    `Organisation: ${organization || '—'}`,
    `Moyen de paiement: ${paymentMethod || '—'}`,
    notes ? `Notes: ${notes}` : null
  ].filter(Boolean).join('\n')

  const confirmText = [
    `Bonjour ${name},`,
    '',
    `Nous confirmons la réception de votre inscription à la formation « ${formationTitle} ».`,
    'Notre équipe reviendra vers vous prochainement avec les prochaines étapes.',
    '',
    'Cordialement,',
    "L'équipe CECA"
  ].join('\n')

  const smtpTransport = buildSmtpTransport()
  const warnings = []

  async function send(to, subject, text) {
    if (sgMail) {
      await sgMail.send({ to, from: fromAddress, subject, text })
      return true
    }
    if (smtpTransport) {
      await smtpTransport.sendMail({ from: `CECA <${fromAddress}>`, to, subject, text })
      return true
    }
    return false
  }

  let delivered = false
  try {
    delivered = await send(toAddress, `[Inscription] ${formationTitle} — ${name}`, adminText)
  } catch (e) {
    warnings.push('admin notification failed')
    console.error('[api/notify-registration] admin email error', e?.response?.body?.errors?.[0]?.message || e)
  }

  try {
    if (delivered) {
      await send(email, `Confirmation d'inscription — ${formationTitle}`, confirmText)
    }
  } catch (e) {
    warnings.push('confirmation email failed')
    console.error('[api/notify-registration] confirmation email error', e?.response?.body?.errors?.[0]?.message || e)
  }

  if (!delivered) {
    warnings.push('mail not configured')
    console.log('[api/notify-registration] mail not configured; registration was still saved by the client')
    return res.status(200).json({ ok: true, delivered: false, message: 'Inscription reçue, mais l’envoi e-mail n’est pas configuré.', warnings })
  }

  return res.status(200).json({ ok: true, delivered: true, warnings })
}
