import React, { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Login(){
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const nav = useNavigate()
  const location = useLocation()

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    const res = await signIn({email,password})
    if(res.error) return setError(res.error.message || 'Erreur')
    // redirect back to the original page if provided
    const dest = location.state?.from || '/'
    nav(dest)
  }

  // helper: quick admin sign-in using dev credentials
  async function quickAdmin(){
    setError(null)
    const adminEmail = 'ceca-admin@gmail.com'
    const adminPass = 'adminpass'
    setEmail(adminEmail)
    setPassword(adminPass)
    const res = await signIn({ email: adminEmail, password: adminPass })
    if(res.error) return setError(res.error.message || 'Erreur')
    const dest = location.state?.from || '/admin'
    nav(dest)
  }

  return (
    <section className="container auth-page">
      <h1>Connexion</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required />
        <input value={password} type="password" onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe" required />
        <button className="btn" type="submit">Se connecter</button>
        <button type="button" className="btn" style={{marginLeft:8,background:'#0b3b82'}} onClick={quickAdmin}>Se connecter en tant qu'admin</button>
        {error && <div className="error">{error}</div>}
        <div style={{marginTop:10}}>Pas de compte ? <Link to="/register">S'inscrire</Link></div>
      </form>
    </section>
  )
}
