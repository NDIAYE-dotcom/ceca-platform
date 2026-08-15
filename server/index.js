require('dotenv').config()
const express = require('express')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const nodemailer = require('nodemailer')
let sgMail = null
if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    console.log('[mail] SendGrid configured via SENDGRID_API_KEY')
  } catch (e) {
    console.warn('[mail] failed to load @sendgrid/mail, will fallback to SMTP if available')
    sgMail = null
  }
}

const USERS_FILE = path.join(__dirname, 'users.json')
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

function readUsers(){
  try{
    const raw = fs.readFileSync(USERS_FILE, 'utf8')
    return JSON.parse(raw || '[]')
  }catch(e){
    return []
  }
}

function writeUsers(users){
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8')
}

const app = express()
app.use(cors())
app.use(express.json())

// Configure mail transporter if SMTP settings are provided
let mailTransporter = null
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

app.get('/api/health', (req,res)=> res.json({ok:true}))

app.post('/api/register', (req,res)=>{
  const {name, email, password, role} = req.body
  if(!email || !password || !name) return res.status(400).json({error:'name, email and password required'})

  const users = readUsers()
  const exists = users.find(u=>u.email.toLowerCase()===email.toLowerCase())
  if(exists) return res.status(409).json({error:'Utilisateur déjà existant'})

  const hashed = bcrypt.hashSync(password, 10)
  const user = { id: Date.now().toString(), name, email: email.toLowerCase(), password: hashed, role: role || 'learner', createdAt: new Date().toISOString() }
  users.push(user)
  writeUsers(users)

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
  const safe = { id: user.id, name: user.name, email: user.email, role: user.role }
  res.json({ user: safe, token })
})

app.post('/api/login', (req,res)=>{
  const { email, password } = req.body
  if(!email || !password) return res.status(400).json({error:'email and password required'})
  const users = readUsers()
  const user = users.find(u=>u.email.toLowerCase()===email.toLowerCase())
  if(!user) return res.status(401).json({error:'Invalid credentials'})
  const ok = bcrypt.compareSync(password, user.password)
  if(!ok) return res.status(401).json({error:'Invalid credentials'})
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
  const safe = { id: user.id, name: user.name, email: user.email, role: user.role }
  res.json({ user: safe, token })
})

function authMiddleware(req,res,next){
  const auth = req.headers.authorization
  if(!auth || !auth.startsWith('Bearer ')) return res.status(401).json({error:'Unauthorized'})
  const token = auth.split(' ')[1]
  try{
    const data = jwt.verify(token, JWT_SECRET)
    req.user = data
    next()
  }catch(e){
    return res.status(401).json({error:'Invalid token'})
  }
}

app.get('/api/me', authMiddleware, (req,res)=>{
  const users = readUsers()
  const user = users.find(u=>u.id===req.user.id)
  if(!user) return res.status(404).json({error:'Utilisateur introuvable'})
  const safe = { id: user.id, name: user.name, email: user.email, role: user.role }
  res.json({ user: safe })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, ()=> console.log(`CECA server running on http://localhost:${PORT}`))

// Contact endpoint: accepts { name, email, organisation, subject, topic, message }
function escapeHtml(value){
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

app.post('/api/contact', async (req, res) => {
  const { name, email, organisation, subject, topic, message } = req.body || {}
  console.log('[contact] incoming', { name, email, organisation, subject, topic, message: (message||'').slice(0,120) })
  if (!name || !email || !message) return res.status(400).json({ error: 'name, email and message required' })

  if (!mailTransporter) {
    // Fallback: save message to a local JSON file so messages are not lost
    try {
      const MESSAGES_FILE = path.join(__dirname, 'messages.json')
      let existing = []
      try { existing = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8') || '[]') } catch(e){ existing = [] }
      const entry = { id: Date.now().toString(), name, email, organisation, subject, topic, message, receivedAt: new Date().toISOString() }
      existing.push(entry)
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(existing, null, 2), 'utf8')
      console.log('[contact] saved locally to', MESSAGES_FILE)
      return res.json({ ok: true, saved: true, message: 'Mail server not configured. Message saved locally.' })
    } catch (err) {
      console.error('Error saving contact message locally:', err)
      return res.status(500).json({ error: 'Mail server not configured and failed to save message locally.' })
    }
  }

  const toAddress = process.env.CONTACT_TO_EMAIL || 'ceconsultingafrique@gmail.com'
  const fromAddress = process.env.FROM_EMAIL || process.env.SMTP_USER

  const mailOptions = {
    from: `${name} <${fromAddress}>`,
    to: toAddress,
    subject: subject || `Contact via site: ${topic || 'Contact'}`,
    text: `Nom: ${name}\nEmail: ${email}\nOrganisation: ${organisation || ''}\nSujet: ${subject || ''}\nThème: ${topic || ''}\n\nMessage:\n${message}`,
    html: `<p><strong>Nom:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Organisation:</strong> ${escapeHtml(organisation)}</p><p><strong>Sujet:</strong> ${escapeHtml(subject)}</p><p><strong>Thème:</strong> ${escapeHtml(topic)}</p><hr/><p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>`
  }

  try {
    if (sgMail) {
      // Use SendGrid API
      await sgMail.send({ to: toAddress, from: fromAddress, subject: mailOptions.subject, text: mailOptions.text, html: mailOptions.html })
      console.log('[contact] sent via SendGrid to', toAddress)
      return res.json({ ok: true, message: 'Message envoyé via SendGrid.' })
    } else if (mailTransporter) {
      await mailTransporter.sendMail(mailOptions)
      console.log('[contact] sent via SMTP to', toAddress)
      return res.json({ ok: true, message: 'Message envoyé.' })
    } else {
      // Shouldn't reach here because earlier fallback handles missing transporter, but safe-guard
      console.warn('[contact] no mail transporter available, falling back to save')
    }
  } catch (err) {
    console.error('Error sending contact mail:', err)
    return res.status(500).json({ error: 'Failed to send message.' })
  }
})

// Registration notification endpoint: notifies admin (and confirms to the
// registrant) when someone signs up for a formation via Formation.jsx.
// The registration row itself is written directly to Supabase by the client;
// this endpoint only handles the email side, mirroring /api/contact.
app.post('/api/notify-registration', async (req, res) => {
  const { name, email, phone, organization, formation_title: formationTitle, payment_method: paymentMethod, notes } = req.body || {}
  console.log('[notify-registration] incoming', { name, email, formationTitle })
  if (!name || !email || !formationTitle) return res.status(400).json({ error: 'name, email and formation_title required' })

  const toAddress = process.env.CONTACT_TO_EMAIL || 'ceconsultingafrique@gmail.com'
  const fromAddress = process.env.FROM_EMAIL || process.env.SMTP_USER

  const adminMail = {
    from: `${name} <${fromAddress}>`,
    to: toAddress,
    subject: `[Inscription] ${formationTitle} — ${name}`,
    text: `Nom: ${name}\nEmail: ${email}\nTéléphone: ${phone || '—'}\nOrganisation: ${organization || '—'}\nMoyen de paiement: ${paymentMethod || '—'}\n${notes ? `Notes: ${notes}` : ''}`
  }
  const confirmMail = {
    from: `CECA <${fromAddress}>`,
    to: email,
    subject: `Confirmation d'inscription — ${formationTitle}`,
    text: `Bonjour ${name},\n\nNous confirmons la réception de votre inscription à la formation « ${formationTitle} ».\nNotre équipe reviendra vers vous prochainement avec les prochaines étapes.\n\nCordialement,\nL'équipe CECA`
  }

  if (!sgMail && !mailTransporter) {
    try {
      const REG_NOTIFY_FILE = path.join(__dirname, 'registration-notifications.json')
      let existing = []
      try { existing = JSON.parse(fs.readFileSync(REG_NOTIFY_FILE, 'utf8') || '[]') } catch (e) { existing = [] }
      existing.push({ id: Date.now().toString(), name, email, phone, organization, formationTitle, paymentMethod, notes, receivedAt: new Date().toISOString() })
      fs.writeFileSync(REG_NOTIFY_FILE, JSON.stringify(existing, null, 2), 'utf8')
      console.log('[notify-registration] saved locally to', REG_NOTIFY_FILE)
      return res.json({ ok: true, delivered: false, message: 'Mail server not configured. Notification saved locally.' })
    } catch (err) {
      console.error('Error saving registration notification locally:', err)
      return res.status(500).json({ ok: false, error: 'Mail server not configured and failed to save notification locally.' })
    }
  }

  try {
    if (sgMail) {
      await sgMail.send({ to: adminMail.to, from: fromAddress, subject: adminMail.subject, text: adminMail.text })
      await sgMail.send({ to: confirmMail.to, from: fromAddress, subject: confirmMail.subject, text: confirmMail.text })
    } else {
      await mailTransporter.sendMail(adminMail)
      await mailTransporter.sendMail(confirmMail)
    }
    console.log('[notify-registration] sent to', toAddress, 'and', email)
    return res.json({ ok: true, delivered: true })
  } catch (err) {
    console.error('Error sending registration notification mail:', err)
    return res.status(500).json({ ok: false, error: 'Failed to send notification.' })
  }
})

// Creates (or resets access for) a learner account so someone who filled the
// formation registration form can log into the Espace e-learning, without
// needing SUPABASE_SERVICE_ROLE_KEY hardcoded here — this only works when
// that var happens to be set in the local environment (it normally isn't;
// this endpoint mainly runs for real via api/create-learner-access.js on
// Vercel, this local route exists so the dev proxy has something to hit).
app.post('/api/create-learner-access', async (req, res) => {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ ok: false, error: "Supabase admin (SUPABASE_SERVICE_ROLE_KEY) n'est pas configuré en local." })
  }

  const { email: rawEmail, name, redirectTo } = req.body || {}
  const email = String(rawEmail || '').trim().toLowerCase()
  if (!email) return res.status(400).json({ error: 'email required' })

  try {
    const { createClient } = require('@supabase/supabase-js')
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

    // Same admin-only gate as api/create-learner-access.js — see that file
    // for why this matters (unauthenticated callers could otherwise
    // downgrade an existing admin account to 'learner' by email).
    const authHeader = req.headers['authorization'] || ''
    const callerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!callerToken) return res.status(401).json({ ok: false, error: 'Authentification requise.' })
    const { data: callerData, error: callerError } = await admin.auth.getUser(callerToken)
    if (callerError || !callerData?.user) return res.status(401).json({ ok: false, error: 'Session invalide.' })
    const { data: callerProfile, error: callerProfileError } = await admin.from('profiles').select('role').eq('id', callerData.user.id).maybeSingle()
    if (callerProfileError || callerProfile?.role !== 'admin') return res.status(403).json({ ok: false, error: 'Réservé aux administrateurs.' })

    let alreadyExisted = false
    let linkData = null
    const invite = await admin.auth.admin.generateLink({ type: 'invite', email, options: { data: { name }, redirectTo } })
    if (invite.error) {
      if (/already been registered|already registered/i.test(invite.error.message || '')) {
        alreadyExisted = true
        const recovery = await admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } })
        if (recovery.error) return res.status(500).json({ ok: false, error: recovery.error.message })
        linkData = recovery.data
      } else {
        return res.status(500).json({ ok: false, error: invite.error.message })
      }
    } else {
      linkData = invite.data
    }

    const userId = linkData?.user?.id
    const hashedToken = linkData?.properties?.hashed_token
    const verifyType = alreadyExisted ? 'recovery' : 'invite'
    const actionLink = hashedToken && redirectTo
      ? `${redirectTo}?token_hash=${encodeURIComponent(hashedToken)}&type=${verifyType}`
      : linkData?.properties?.action_link
    if (userId) {
      try {
        const { data: existingProfile } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle()
        const nextRole = (existingProfile?.role === 'admin' || existingProfile?.role === 'instructor') ? existingProfile.role : 'learner'
        await admin.from('profiles').upsert({ id: userId, email, full_name: name || undefined, role: nextRole })
      } catch (e) { console.warn('[create-learner-access] profile upsert failed', e) }
    }

    let delivered = false
    let mailError = null
    const fromAddress = process.env.FROM_EMAIL || process.env.SMTP_USER
    const subject = alreadyExisted ? "Réinitialisation de votre accès à l'Espace e-learning CECA" : "Votre accès à l'Espace e-learning CECA"
    const text = `Bonjour ${name || ''},\n\n${alreadyExisted ? 'Voici un lien pour redéfinir votre mot de passe et accéder' : 'Un accès vous a été créé pour accéder'} à l'Espace e-learning CECA.\n\n${actionLink || ''}\n\nCordialement,\nL'équipe CECA`
    try {
      if (sgMail) {
        await sgMail.send({ to: email, from: fromAddress, subject, text })
        delivered = true
      } else if (mailTransporter) {
        await mailTransporter.sendMail({ from: `CECA <${fromAddress}>`, to: email, subject, text })
        delivered = true
      }
    } catch (e) {
      mailError = e?.message || String(e)
      console.error('[create-learner-access] mail error', mailError)
    }

    return res.json({ ok: true, delivered, link: actionLink, mailError, alreadyExisted })
  } catch (err) {
    console.error('[create-learner-access] error', err)
    return res.status(500).json({ ok: false, error: err?.message || String(err) })
  }
})

// Dev helper: list saved messages (only if messages.json exists)
app.get('/api/messages', (req, res) => {
  const MESSAGES_FILE = path.join(__dirname, 'messages.json')
  try {
    const raw = fs.readFileSync(MESSAGES_FILE, 'utf8')
    const data = JSON.parse(raw || '[]')
    return res.json({ ok: true, messages: data })
  } catch (e) {
    return res.json({ ok: true, messages: [] })
  }
})
