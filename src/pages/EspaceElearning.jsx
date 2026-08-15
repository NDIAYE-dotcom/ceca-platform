import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFormations } from '../lib/formations'
import FormationIcon, { getIconKey } from '../components/FormationIcon'
import './EspaceElearning.css'

export default function EspaceElearning(){
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      const data = await getFormations()
      // getFormations() already excludes unavailable formations; e-learning
      // visibility is a separate admin-controlled toggle on top of that.
      const visible = data.filter(c => c.elearning_enabled !== false)
      if(mounted){ setCourses(visible); setLoading(false) }
    })()
    return ()=>{ mounted = false }
  },[])

  return (
    <section className="container espace-elearning">
      <h1>Espace e-learning</h1>
      <p className="muted">Choisissez une formation pour accéder à ses cours, supports et quiz en ligne. Une connexion est requise.</p>

      {loading && <p className="muted">Chargement…</p>}
      {!loading && courses.length === 0 && <p className="muted">Aucune formation n'est disponible en e-learning pour le moment.</p>}

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
