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
    // redirect admin to /admin, otherwise back to original destination
    const returnedUser = res.user
    const ADMIN_EMAIL = 'ceca-admin@gmail.com'
    if(returnedUser && String(returnedUser.email).toLowerCase() === ADMIN_EMAIL) {
      nav('/admin')
      return
    }
    const dest = location.state?.from || '/'
    nav(dest)
  }

  return (
    <section className="container auth-page">
      <h1>Connexion</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required />
        <input value={password} type="password" onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe" required />
        <button className="btn" type="submit">Se connecter</button>
        {error && <div className="error">{error}</div>}
        <div style={{marginTop:10}}>Pas de compte ? <Link to="/register">S'inscrire</Link></div>
      </form>
    </section>
  )
}
