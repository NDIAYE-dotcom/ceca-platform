import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Register(){
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const nav = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    // basic client-side email format validation to show friendly message
    const emailRe = /^\S+@\S+\.\S+$/
    if (!emailRe.test(email)) {
      setError("Veuillez entrer une adresse e-mail valide (ex: vous@exemple.com)")
      return
    }
    const res = await signUp({ email, password, options: { data: { name } } })
    if(res.error) return setError(res.error.message || 'Erreur')
    nav('/')
  }

  return (
    <section className="container auth-page">
      <h1>Inscription</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nom complet" required />
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required />
        <input value={password} type="password" onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe" required />
        <button className="btn" type="submit">S'inscrire</button>
        {error && <div className="error">{error}</div>}
      </form>
    </section>
  )
}
