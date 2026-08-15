import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Auth.css'

// Landing page for the invite / recovery link sent from
// Espace administration => Apprenants ("Créer l'accès"). Supabase's client
// auto-detects the access token in the URL hash and establishes a session
// before this component even mounts — from here it's just a normal
// "choose your password" form.
export default function SetPassword(){
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const nav = useNavigate()

  useEffect(()=>{
    let mounted = true
    supabase.auth.getSession().then(({ data })=>{
      if(!mounted) return
      if(!data?.session){
        setError("Ce lien n'est plus valide ou a déjà été utilisé. Demandez à l'administration de vous en renvoyer un.")
      }
      setReady(true)
    })
    return ()=>{ mounted = false }
  },[])

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    if(password.length < 6){ setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    if(password !== confirm){ setError('Les mots de passe ne correspondent pas.'); return }
    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if(updateError){ setError(updateError.message || 'Erreur lors de la définition du mot de passe.'); return }
    setSuccess(true)
    setTimeout(()=> nav('/elearning'), 1800)
  }

  return (
    <section className="container auth-page">
      <h1>Définir votre mot de passe</h1>
      {!ready && <p className="muted">Vérification du lien…</p>}
      {ready && !success && (
        <form className="auth-form" onSubmit={handleSubmit}>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nouveau mot de passe" required disabled={!!error && error.includes('lien')} />
          <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirmer le mot de passe" required disabled={!!error && error.includes('lien')} />
          <button className="btn" type="submit" disabled={submitting}>{submitting ? 'Enregistrement…' : 'Valider et accéder à mes cours'}</button>
          {error && <div className="error">{error}</div>}
        </form>
      )}
      {success && <p className="muted">Mot de passe défini — redirection vers l'Espace e-learning…</p>}
    </section>
  )
}
