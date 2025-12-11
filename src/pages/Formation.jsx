import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getFormationById } from '../lib/formations'
import './Formation.css'
import { usdToFcfa, formatFcfa } from '../utils/currency'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseEnabled } from '../lib/supabase'

const REG_TABLE = import.meta.env.VITE_REGISTRATIONS_TABLE || 'registrations'

export default function Formation(){
  const {id} = useParams()
  const [course, setCourse] = useState(null)
  const { user } = useAuth()
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', organization: '', payment: 'card', notes: '', agree: false })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  useEffect(()=>{ let mounted = true; (async ()=>{ const f = await getFormationById(id); if(mounted) setCourse(f) })(); return ()=>{ mounted = false } },[id])
  useEffect(()=>{
    // prefill from logged in user when available
    if(user){ setFormData(d=>({ ...d, name: user.full_name || d.name, email: user.email || d.email })) }
  },[user])
  if(course === null) return <div className="container">Chargement…</div>
  if(!course) return <div className="container">Formation introuvable</div>

  return (
    <section className="formation-page">
      <div className="hero">
        <div className="hero-slides">
          {
            (function(){
              const defaults = ['/marchepublic-01.png','/Ressources-Humaine-Management-01.png','/Finances-publiques-01.png']
              const imgs = course.image ? [course.image, ...defaults] : defaults
              return imgs.map((src, i) => (
                <img key={i} src={src} alt="" className="hero-slide" style={{ animationDelay: `${i * 4}s` }} />
              ))
            })()
          }
        </div>
        <div className="hero-overlay" />
        <div className="container hero-inner">
          <div className="hero-left">
              <h1 className="hero-title">{course.title}</h1>
              {(() => {
                const parts = [course.category, course.duration]
                if(course.instructor) parts.push(`Formateur : ${course.instructor}`)
                return <p className="hero-sub">{parts.filter(Boolean).join(' • ')}</p>
              })()}
            </div>
          <div className="hero-right">
            {course.price && <div className="price-chip">{`${course.price} USD`}</div>}
          </div>
        </div>
      </div>

      <div className="container formation-content">
        <main className="content-main">
          <section className="card objectives">
            <h3>Objectifs</h3>
            <p>À l'issue de la formation, les participants seront capables de mettre en œuvre des procédures conformes aux meilleures pratiques.</p>
          </section>

          <section className="card modules">
            <h3>Modules</h3>
            <div className="modules-grid">
              {(course.modules || []).length === 0 && <div className="muted">Modules non spécifiés pour cette formation.</div>}
              {(course.modules || []).map((m, idx) => (
                <div className="module-card" key={`${m}-${idx}`}>
                  <div className="module-icon">{idx+1}</div>
                  <div className="module-body">
                    <strong>{m}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card details">
            <h3>Public cible</h3>
            <p>Agents publics, responsables financiers, auditeurs internes, consultants.</p>

            {course.price && (
              <>
                <h3>Tarif</h3>
                <p className="price-large">{`${course.price} USD — ${formatFcfa(usdToFcfa(course.price))} FCFA`}</p>
              </>
            )}

            <h3>Inscription & Paiement</h3>
            <p>Choisissez votre mode de paiement. (Placeholders pour Wave / Orange Money / Carte)</p>
            <div className="payments">
              <button className="btn">Payer par Wave (placeholder)</button>
              <button className="btn secondary">Orange Money (placeholder)</button>
              <button className="btn secondary">Carte bancaire (placeholder)</button>
            </div>

            <p className="note">Après paiement, vous recevrez un lien d'accès à l'espace e-learning et votre certificat sera généré automatiquement à la réussite.</p>
          </section>
        </main>

        <aside className="content-aside sticky-aside">
          <div className="registration-card">
            <div className="summary">
              <h4>Résumé</h4>
              <p>{course.description}</p>
            </div>

            <form className="registration-form" onSubmit={async (e)=>{
              e.preventDefault()
              setError(null)
              if(!formData.name || !formData.email) { setError('Veuillez renseigner votre nom et votre email.'); return }
              if(!formData.agree){ setError('Vous devez accepter les conditions pour vous inscrire.'); return }
              setSubmitting(true)
              const registration = {
                id: `reg_${Date.now()}`,
                formation_id: course.id,
                formation_title: course.title,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                organization: formData.organization,
                payment_method: formData.payment,
                notes: formData.notes,
                created_at: new Date().toISOString()
              }
              // attempt Supabase insert when available
              let saved = false
              try{
                if(isSupabaseEnabled){
                  const tableNotFound = (err) => {
                    const m = String(err?.message || err || '').toLowerCase()
                    return /could not find the table|relation ".+" does not exist|does not exist in the schema cache|404/.test(m)
                  }

                  const res = await supabase.from(REG_TABLE).insert([{ ...registration }])
                  if(res?.error){
                    // if table doesn't exist, try the alternate singular/plural name automatically
                    if(tableNotFound(res.error)){
                      const alternate = REG_TABLE === 'registrations' ? 'registration' : 'registrations'
                      try{
                        const res2 = await supabase.from(alternate).insert([{ ...registration }])
                        if(!res2?.error){ saved = true }
                        else console.warn('Supabase alternate insert error', res2.error)
                      }catch(e2){ console.warn('Supabase alternate insert threw', e2) }
                    } else {
                      throw res.error
                    }
                  } else {
                    saved = true
                  }
                }
              }catch(e){
                console.warn('Supabase registration failed, falling back to localStorage', e)
                saved = false
              }

              if(!saved){
                try{
                  const key = 'ceca_registrations'
                  const raw = localStorage.getItem(key)
                  const arr = raw ? JSON.parse(raw) : []
                  arr.push(registration)
                  localStorage.setItem(key, JSON.stringify(arr))
                  saved = true
                }catch(e){
                  console.error('Could not persist registration locally', e)
                }
              }

              setSubmitting(false)
              if(saved){
                setSuccess('Inscription enregistrée — un email de confirmation vous sera envoyé.')
                // Notify other UI (admin list) that a registration was added
                try{ window.dispatchEvent(new CustomEvent('ceca:registration:added', { detail: registration })) }catch(e){}
                // Also write a short localStorage ping so other tabs can react
                try{ localStorage.setItem('ceca_registrations_updated_at', String(Date.now())) }catch(e){}
                // Optionally reset form (keep name/email for convenience)
                setFormData(d=>({ ...d, phone: '', organization: '', notes: '', agree: false }))
              }else{
                setError('Impossible d’enregistrer votre inscription. Réessayez plus tard.')
              }
            }}>
              <h4 className="form-title">S'inscrire à cette formation</h4>
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}

              <label className="field">
                <span>Nom complet</span>
                <input value={formData.name} onChange={e=>setFormData(d=>({ ...d, name: e.target.value }))} placeholder="Prénom Nom" />
              </label>

              <label className="field">
                <span>Email</span>
                <input type="email" value={formData.email} onChange={e=>setFormData(d=>({ ...d, email: e.target.value }))} placeholder="votre@email.com" />
              </label>

              <label className="field">
                <span>Téléphone</span>
                <input value={formData.phone} onChange={e=>setFormData(d=>({ ...d, phone: e.target.value }))} placeholder="+221 77 123 45 67" />
              </label>

              <label className="field">
                <span>Organisation</span>
                <input value={formData.organization} onChange={e=>setFormData(d=>({ ...d, organization: e.target.value }))} placeholder="Organisation (optionnel)" />
              </label>

              <label className="field">
                <span>Mode de paiement</span>
                <select value={formData.payment} onChange={e=>setFormData(d=>({ ...d, payment: e.target.value }))}>
                  <option value="card">Carte bancaire</option>
                  <option value="wave">Wave</option>
                  <option value="om">Orange Money</option>
                </select>
              </label>

              <label className="field">
                <span>Notes (optionnel)</span>
                <textarea value={formData.notes} onChange={e=>setFormData(d=>({ ...d, notes: e.target.value }))} placeholder="Questions ou remarques..." />
              </label>

              <label className="checkbox">
                <input type="checkbox" checked={formData.agree} onChange={e=>setFormData(d=>({ ...d, agree: e.target.checked }))} />
                <span>J'accepte les conditions et souhaite m'inscrire à cette formation.</span>
              </label>

              <div className="form-actions">
                <button className="btn primary" disabled={submitting}>{submitting ? 'Enregistrement…' : 'S’inscrire'}</button>
                <Link to={`/elearning/${course.id}`} className="btn secondary">Voir la démo</Link>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </section>
  )
}
