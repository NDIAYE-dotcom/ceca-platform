import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Auth.css'

const INVALID_LINK_MSG = "Ce lien n'est plus valide ou a déjà été utilisé. Demandez à l'administration de vous en renvoyer un."

// Landing page for the invite / recovery link sent from
// Espace administration => Apprenants ("Créer l'accès"). Supabase's client
// parses the access token out of the URL hash asynchronously — getSession()
// can resolve before that finishes, so we also listen for the auth event it
// fires once the session is actually established, instead of trusting a
// single getSession() snapshot.
export default function SetPassword(){
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const nav = useNavigate()

  useEffect(()=>{
    let mounted = true
    let settled = false

    function settle(found){
      if(settled || !mounted) return
      settled = true
      setHasSession(found)
      if(!found) setError(INVALID_LINK_MSG)
      setReady(true)
    }

    supabase.auth.getSession().then(({ data })=>{
      if(data?.session) settle(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session)=>{
      if(session) settle(true)
    })

    // Give Supabase up to 4s to finish parsing the URL hash before concluding
    // the link is invalid — on a slow mobile connection this can take a beat.
    const timeout = setTimeout(()=> settle(false), 4000)

    return ()=>{
      mounted = false
      clearTimeout(timeout)
      try{ listener?.subscription?.unsubscribe() }catch(e){}
    }
  },[])

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    if(password.length < 6){ setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    if(password !== confirm){ setError('Les mots de passe ne correspondent pas.'); return }

    setSubmitting(true)
    // Re-check right before submitting — the URL-derived session can still
    // have been lost between page load and now (link opened twice, link
    // preview scanners consuming a one-time token, etc.).
    const { data: sessionData } = await supabase.auth.getSession()
    if(!sessionData?.session){
      setSubmitting(false)
      setHasSession(false)
      setError(INVALID_LINK_MSG)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if(updateError){
      if(/session/i.test(updateError.message || '')){
        setHasSession(false)
        setError(INVALID_LINK_MSG)
      } else {
        setError(updateError.message || 'Erreur lors de la définition du mot de passe.')
      }
      return
    }
    setSuccess(true)
    setTimeout(()=> nav('/elearning'), 1800)
  }

  return (
    <section className="container auth-page">
      <h1>Définir votre mot de passe</h1>
      {!ready && <p className="muted">Vérification du lien…</p>}
      {ready && !success && (
        <form className="auth-form" onSubmit={handleSubmit}>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nouveau mot de passe" required disabled={!hasSession} />
          <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirmer le mot de passe" required disabled={!hasSession} />
          <button className="btn" type="submit" disabled={submitting || !hasSession}>{submitting ? 'Enregistrement…' : 'Valider et accéder à mes cours'}</button>
          {error && <div className="error">{error}</div>}
        </form>
      )}
      {success && <p className="muted">Mot de passe défini — redirection vers l'Espace e-learning…</p>}
    </section>
  )
}
