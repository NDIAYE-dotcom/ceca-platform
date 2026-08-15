import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Auth.css'

const INVALID_LINK_MSG = "Ce lien n'est plus valide ou a déjà été utilisé. Demandez à l'administration de vous en renvoyer un."

// Landing page for the invite / recovery link sent from
// Espace administration => Apprenants ("Créer l'accès"). The link points
// here with ?token_hash=...&type=invite|recovery — we exchange that token
// for a session ourselves via verifyOtp() instead of letting Supabase's own
// /auth/v1/verify endpoint do it via a GET redirect. That GET-based exchange
// gets silently consumed by link-preview bots (WhatsApp, iMessage, Telegram…)
// fetching the URL server-side to build a preview card, before the real
// person ever taps it — verifyOtp() only runs when our page's JS actually
// executes, which preview bots don't do.
export default function SetPassword(){
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const nav = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(()=>{
    let mounted = true
    let settled = false

    function settle(found, message){
      if(settled || !mounted) return
      settled = true
      setHasSession(found)
      if(!found) setError(message || INVALID_LINK_MSG)
      setReady(true)
    }

    async function run(){
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if(tokenHash && type){
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        if(verifyError){
          settle(false)
          return
        }
        settle(true)
        return
      }

      // Fallback for the older hash-based link format (#access_token=...), in
      // case a link generated before this change is still being used.
      supabase.auth.getSession().then(({ data })=>{
        if(data?.session) settle(true)
      })
      const { data: listener } = supabase.auth.onAuthStateChange((event, session)=>{
        if(session) settle(true)
      })
      setTimeout(()=> settle(false), 4000)
      return ()=>{ try{ listener?.subscription?.unsubscribe() }catch(e){} }
    }

    run()
    return ()=>{ mounted = false }
  },[])

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    if(password.length < 6){ setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    if(password !== confirm){ setError('Les mots de passe ne correspondent pas.'); return }

    setSubmitting(true)
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
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nouveau mot de passe" aria-label="Nouveau mot de passe" autoComplete="new-password" required disabled={!hasSession} />
          <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirmer le mot de passe" aria-label="Confirmer le mot de passe" autoComplete="new-password" required disabled={!hasSession} />
          <button className="btn" type="submit" disabled={submitting || !hasSession}>{submitting ? 'Enregistrement…' : 'Valider et accéder à mes cours'}</button>
          {error && <div className="error">{error}</div>}
        </form>
      )}
      {success && <p className="muted">Mot de passe défini — redirection vers l'Espace e-learning…</p>}
    </section>
  )
}
