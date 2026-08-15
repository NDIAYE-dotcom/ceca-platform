import React, { useState } from 'react'
import './Contact.css'
import { useAuth } from '../context/AuthContext'

export default function Contact(){
  const { user } = useAuth()
  const [form, setForm] = useState({ name: user?.user_metadata?.name || '', email: user?.email || '', organisation: '', subject: '', topic: 'Information', message: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  function update(field, value){
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function validate(){
    if(!form.name || !form.email || !form.message) return 'Veuillez renseigner votre nom, email et message.'
    // simple email check
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i
    if(!re.test(String(form.email).toLowerCase())) return 'Email invalide.'
    return null
  }

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const v = validate()
    if(v){ setError(v); return }
    setLoading(true)

    try{
      // try sending via server API
      const resp = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const text = await resp.text().catch(()=>null)
      let data = null
      try{ data = text ? JSON.parse(text) : null }catch(e){ data = null }

      if (resp.ok && data?.ok !== false) {
        // Any resp.ok means the message was captured (visible in Espace
        // administration => Messages) — whether or not the notification
        // email itself went out is a secondary detail, not a failure.
        setSuccess(data?.message || 'Message envoyé. Nous vous répondrons bientôt.')
      } else {
        // if server not configured, fallback to mailto
        if (resp.status === 501) {
          const mailto = `mailto:ceconsultingafrique@gmail.com?subject=${encodeURIComponent(form.subject || 'Contact via site')}&body=${encodeURIComponent(`Nom: ${form.name}\nOrganisation: ${form.organisation}\n\n${form.message}`)}`
          window.location.href = mailto
          setSuccess('Redirection vers votre client mail.')
        } else {
          const serverMsg = data?.error || data?.message || text || `${resp.status} ${resp.statusText}`
          setError(`Erreur serveur: ${serverMsg}`)
        }
      }
    }catch(e){
      setError(`Une erreur est survenue: ${e.message || e}`)
    } finally{
      setLoading(false)
    }
  }

  return (
    <section className="container contact-page">
      <span className="section-eyebrow">Parlons de votre projet</span>
      <h1>Contactez-nous</h1>
      <p className="contact-lead">Une question, un projet d'accompagnement ou une demande de partenariat ? Notre équipe vous répond rapidement.</p>

      <div className="contact-grid">
        <div className="contact-info">
          <h3>CECA-Solutions</h3>

          <div className="contact-row">
            <span className="contact-icon" aria-hidden="true">📍</span>
            <span>Keur Massar, Dakar, Sénégal</span>
          </div>
          <div className="contact-row">
            <span className="contact-icon" aria-hidden="true">✉️</span>
            <a href="mailto:ceconsultingafrique@gmail.com">ceconsultingafrique@gmail.com</a>
          </div>
          <div className="contact-row">
            <span className="contact-icon" aria-hidden="true">📞</span>
            <span><a href="tel:+221338377143">+221 33 837 7143</a> / <a href="tel:+221775123076">+221 77 512 30 76</a></span>
          </div>

          <div className="contact-legal">
            <span><strong>NINEA</strong> 0063366731R1</span>
            <span><strong>RCCM</strong> SN.DKR.2017.A.10183</span>
          </div>

          <div className="contact-socials">
            <a href="https://facebook.com/ceca-solutions" target="_blank" rel="noreferrer" aria-label="Facebook">📘</a>
            <a href="https://instagram.com/ceca-solutions" target="_blank" rel="noreferrer" aria-label="Instagram">📷</a>
            <a href="https://linkedin.com/company/ceca-solutions" target="_blank" rel="noreferrer" aria-label="LinkedIn">💼</a>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <div className="form-row">
            <label className="field">
              <span>Nom complet *</span>
              <input value={form.name} onChange={e=>update('name', e.target.value)} placeholder="Nom complet" required />
            </label>
            <label className="field">
              <span>Email *</span>
              <input value={form.email} onChange={e=>update('email', e.target.value)} placeholder="Email" type="email" required />
            </label>
          </div>

          <div className="form-row">
            <label className="field">
              <span>Organisation</span>
              <input value={form.organisation} onChange={e=>update('organisation', e.target.value)} placeholder="Organisation / Institution" />
            </label>
            <label className="field">
              <span>Thème</span>
              <select value={form.topic} onChange={e=>update('topic', e.target.value)}>
                <option>Information</option>
                <option>Inscription</option>
                <option>Partenariat</option>
                <option>Intervention</option>
                <option>Autre</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Sujet</span>
            <input value={form.subject} onChange={e=>update('subject', e.target.value)} placeholder="Sujet" />
          </label>

          <label className="field">
            <span>Message *</span>
            <textarea value={form.message} onChange={e=>update('message', e.target.value)} placeholder="Votre message" required />
          </label>

          <div className="form-actions">
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Envoi…' : 'Envoyer le message →'}</button>
          </div>
        </form>
      </div>
    </section>
  )
}
