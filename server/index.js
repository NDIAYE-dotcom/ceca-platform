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
    html: `<p><strong>Nom:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Organisation:</strong> ${organisation || ''}</p><p><strong>Sujet:</strong> ${subject || ''}</p><p><strong>Thème:</strong> ${topic || ''}</p><hr/><p>${message.replace(/\n/g, '<br/>')}</p>`
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
