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
  const from = location.state?.from || ''
  const hideRegister = from.startsWith('/admin') || from.startsWith('/elearning')

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    const res = await signIn({email,password})
    if(res.error) return setError(res.error.message || 'Erreur')
    // redirect admin to /admin, otherwise back to original destination
    const returnedUser = res.user
    if(returnedUser?.role === 'admin') {
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
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" aria-label="Email" autoComplete="email" required />
        <input value={password} type="password" onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe" aria-label="Mot de passe" autoComplete="current-password" required />
        <button className="btn" type="submit">Se connecter</button>
        {error && <div className="error">{error}</div>}
      </form>
      {!hideRegister && <p>Pas encore de compte ? <Link to="/register">S'inscrire</Link></p>}
    </section>
  )
}
