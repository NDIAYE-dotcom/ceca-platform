import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFormations } from '../lib/formations'
import FormationIcon, { getIconKey } from '../components/FormationIcon'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseEnabled } from '../lib/supabase'
import './EspaceElearning.css'

const REGISTRATIONS_TABLE = import.meta.env.VITE_REGISTRATIONS_TABLE || 'registrations'

export default function EspaceElearning(){
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [enrolledIds, setEnrolledIds] = useState(null) // null = not applicable (not a learner) or unknown
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      const data = await getFormations()
      // getFormations() already excludes unavailable formations; e-learning
      // visibility is a separate admin-controlled toggle on top of that.
      const visible = data.filter(c => c.elearning_enabled !== false)

      // The hub always lists the full e-learning catalogue — actual access
      // per course is enforced on Elearning.jsx itself (checked against the
      // registrations table there too). Here we only look up which ones the
      // logged-in learner is registered for so their cards can show a lock,
      // rather than hiding the rest of the catalogue from them entirely.
      if(user?.role === 'learner' && user?.email && isSupabaseEnabled){
        try{
          const { data: regs, error: regsError } = await supabase.from(REGISTRATIONS_TABLE).select('formation_id').ilike('email', user.email)
          if(!regsError && Array.isArray(regs)){
            if(mounted) setEnrolledIds(new Set(regs.map(r => String(r.formation_id))))
          } else if(regsError){
            console.warn('registrations lookup failed, showing all cards unlocked', regsError)
          }
        }catch(e){ console.warn('registrations lookup threw, showing all cards unlocked', e) }
      }

      if(mounted){ setCourses(visible); setLoading(false) }
    })()
    return ()=>{ mounted = false }
  },[user?.email, user?.role])

  return (
    <section className="container espace-elearning">
      <h1>Espace e-learning</h1>
      <p className="muted">Choisissez une formation pour accéder à ses cours, supports et quiz en ligne. Une connexion est requise, et l'accès est réservé aux formations auxquelles vous êtes inscrit(e).</p>

      {loading && <p className="muted">Chargement…</p>}
      {!loading && courses.length === 0 && <p className="muted">Aucune formation n'est disponible en e-learning pour le moment.</p>}

      <div className="elearning-grid">
        {courses.map(c => {
          const locked = enrolledIds ? !enrolledIds.has(String(c.id)) : false
          return (
            <Link
              to={`/elearning/${c.id}`}
              key={c.id}
              className={`elearning-card accent-${c.accent || 'blue'} ${locked ? 'elearning-card--locked' : ''}`}
            >
              {locked && <span className="elearning-card-lock" title="Inscription requise" aria-hidden="true">🔒</span>}
              <div className="elearning-card-icon">
                <FormationIcon iconKey={c.icon || getIconKey(c)} />
              </div>
              <div className="elearning-card-body">
                <p className="elearning-card-eyebrow">{c.category}</p>
                <h3>{c.title}</h3>
                <span className="elearning-card-cta">{locked ? 'Inscription requise' : "Accéder à l'espace →"}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
