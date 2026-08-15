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
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      const data = await getFormations()
      // getFormations() already excludes unavailable formations; e-learning
      // visibility is a separate admin-controlled toggle on top of that.
      let visible = data.filter(c => c.elearning_enabled !== false)

      // A learner only sees formations they're actually registered for
      // (matched by email against the registrations table) — same rule
      // enforced when actually opening a course, kept in sync here so the
      // hub doesn't list cards that would just say "accès non autorisé".
      if(user?.role === 'learner' && user?.email && isSupabaseEnabled){
        try{
          const { data: regs, error: regsError } = await supabase.from(REGISTRATIONS_TABLE).select('formation_id').ilike('email', user.email)
          // Supabase returns { data: null, error } on RLS/query failure rather
          // than throwing — filtering with an empty Set here would silently
          // hide every course, so only apply the filter when the lookup
          // actually succeeded.
          if(!regsError && Array.isArray(regs)){
            const enrolledIds = new Set(regs.map(r => String(r.formation_id)))
            visible = visible.filter(c => enrolledIds.has(String(c.id)))
          } else if(regsError){
            console.warn('registrations lookup failed, showing unfiltered e-learning list', regsError)
          }
        }catch(e){ console.warn('registrations lookup threw, showing unfiltered e-learning list', e) }
      }

      if(mounted){ setCourses(visible); setLoading(false) }
    })()
    return ()=>{ mounted = false }
  },[user?.email, user?.role])

  return (
    <section className="container espace-elearning">
      <h1>Espace e-learning</h1>
      <p className="muted">Choisissez une formation pour accéder à ses cours, supports et quiz en ligne. Une connexion est requise.</p>

      {loading && <p className="muted">Chargement…</p>}
      {!loading && courses.length === 0 && (
        <p className="muted">
          {user?.role === 'learner'
            ? "Vous n'êtes inscrit(e) à aucune formation en e-learning pour le moment."
            : "Aucune formation n'est disponible en e-learning pour le moment."}
        </p>
      )}

      <div className="elearning-grid">
        {courses.map(c => (
          <Link to={`/elearning/${c.id}`} key={c.id} className={`elearning-card accent-${c.accent || 'blue'}`}>
            <div className="elearning-card-icon">
              <FormationIcon iconKey={c.icon || getIconKey(c)} />
            </div>
            <div className="elearning-card-body">
              <p className="elearning-card-eyebrow">{c.category}</p>
              <h3>{c.title}</h3>
              <span className="elearning-card-cta">Accéder à l'espace →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
