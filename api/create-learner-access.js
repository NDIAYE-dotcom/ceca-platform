const { createClient } = require('@supabase/supabase-js')
const nodemailer = require('nodemailer')

let sgMail = null
if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  } catch (e) {
    console.warn('[api/create-learner-access] failed to load @sendgrid/mail', e)
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
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  })
}

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

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ ok: false, error: "Supabase admin (SUPABASE_SERVICE_ROLE_KEY) n'est pas configuré côté serveur." })
  }

  const payload = getPayload(req)
  if (payload === null) {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const email = safeText(payload?.email).toLowerCase()
  const name = safeText(payload?.name)
  const redirectTo = safeText(payload?.redirectTo) || undefined

  if (!email) {
    return res.status(400).json({ error: 'email required' })
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  let linkData = null
  let alreadyExisted = false

  const invite = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { data: { name }, redirectTo }
  })

  if (invite.error) {
    // Someone who already has an account (e.g. self-registered earlier) can't be
    // re-invited — fall back to a password-recovery link so access can still be
    // (re)granted from the same button instead of surfacing an error.
    if (/already been registered|already registered/i.test(invite.error.message || '')) {
      alreadyExisted = true
      const recovery = await admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } })
      if (recovery.error) {
        return res.status(500).json({ ok: false, error: recovery.error.message })
      }
      linkData = recovery.data
    } else {
      return res.status(500).json({ ok: false, error: invite.error.message })
    }
  } else {
    linkData = invite.data
  }

  const userId = linkData?.user?.id
  // Build our own link instead of using Supabase's action_link. action_link
  // performs the token exchange as a plain GET against Supabase's own domain —
  // link-preview bots (WhatsApp, iMessage, Telegram...) fetch that URL server-side
  // to generate a preview card, which silently consumes the one-time token before
  // the real person ever taps it. Pointing straight at our own domain with the
  // token as a query param means nothing gets consumed until our page's own JS
  // calls supabase.auth.verifyOtp() — preview bots don't execute JavaScript.
  const hashedToken = linkData?.properties?.hashed_token
  const verifyType = alreadyExisted ? 'recovery' : 'invite'
  const actionLink = hashedToken && redirectTo
    ? `${redirectTo}?token_hash=${encodeURIComponent(hashedToken)}&type=${verifyType}`
    : linkData?.properties?.action_link

  if (userId) {
    try {
      await admin.from('profiles').upsert({ id: userId, email, full_name: name || undefined, role: 'learner' })
    } catch (e) {
      console.warn('[api/create-learner-access] profile upsert failed', e)
    }
  }

  const fromAddress = 'ceconsultingafrique@gmail.com'
  const subject = alreadyExisted
    ? 'Réinitialisation de votre accès à l\'Espace e-learning CECA'
    : 'Votre accès à l\'Espace e-learning CECA'
  const text = [
    `Bonjour ${name || ''},`,
    '',
    alreadyExisted
      ? 'Voici un lien pour redéfinir votre mot de passe et accéder à l\'Espace e-learning CECA :'
      : 'Un accès vous a été créé pour l\'Espace e-learning CECA. Cliquez sur ce lien pour choisir votre mot de passe :',
    '',
    actionLink || '',
    '',
    "Ce lien est à usage unique et vous permettra ensuite de vous connecter avec votre email et le mot de passe choisi.",
    '',
    'Cordialement,',
    "L'équipe CECA"
  ].join('\n')

  const smtpTransport = buildSmtpTransport()
  let delivered = false
  let mailError = null

  try {
    if (sgMail) {
      await sgMail.send({ to: email, from: fromAddress, subject, text })
      delivered = true
    } else if (smtpTransport) {
      await smtpTransport.sendMail({ from: `CECA <${fromAddress}>`, to: email, subject, text })
      delivered = true
    }
  } catch (e) {
    mailError = e?.response?.body?.errors?.[0]?.message || e?.message || String(e)
    console.error('[api/create-learner-access] mail error', mailError)
  }

  // The link is returned even when the email fails to send, so the admin can
  // copy/share it manually — mirrors the graceful degradation used for the
  // contact form and registration notifications elsewhere in this app.
  return res.status(200).json({ ok: true, delivered, link: actionLink, mailError, alreadyExisted })
}
