const express = require('express')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')

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
