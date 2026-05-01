import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useInView from '../hooks/useInView'
import './CourseCard.css'

function getIconKey(course){
  const text = `${course?.title || ''} ${course?.category || ''}`.toLowerCase()
  if(text.includes('gouvernance') || text.includes('publique')) return 'government'
  if(text.includes('partenariat') || text.includes('commande')) return 'procurement'
  if(text.includes('leadership') || text.includes('management')) return 'leadership'
  if(text.includes('fiscalit') || text.includes('finance') || text.includes('comptabilit')) return 'finance'
  if(text.includes('projet') || text.includes('ong') || text.includes('bailleur')) return 'project'
  if(text.includes('durabilit') || text.includes('environnement') || text.includes('rse')) return 'sustainability'
  if(text.includes('banque') || text.includes('microfinance') || text.includes('financier')) return 'banking'
  if(text.includes('droit') || text.includes('ohada') || text.includes('juridique')) return 'legal'
  if(text.includes('transport') || text.includes('logistique') || text.includes('infrastructure')) return 'transport'
  if(text.includes('entrepreneuriat') || text.includes('innovation') || text.includes('startup')) return 'entrepreneurship'
  if(text.includes('ressources humaines') || text.includes('rh')) return 'hr'
  if(text.includes('risque')) return 'risk'
  return 'government'
}

function FormationIcon({ iconKey }){
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch(iconKey){
    case 'procurement':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M8 4h8l3 3v13H5V7l3-3z" />
          <path {...common} d="M8 4v3h8V4" />
          <path {...common} d="M9 12l2 2 4-4" />
        </svg>
      )
    case 'leadership':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle {...common} cx="12" cy="7" r="3" />
          <path {...common} d="M6 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" />
          <path {...common} d="M4 12l2-2m14 2l-2-2" />
        </svg>
      )
    case 'finance':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M4 20h16" />
          <path {...common} d="M7 16V9" />
          <path {...common} d="M12 16V6" />
          <path {...common} d="M17 16v-4" />
          <path {...common} d="M5 8c2-1.6 4-1.6 6 0 2-1.6 4-1.6 6 0" />
        </svg>
      )
    case 'project':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle {...common} cx="12" cy="12" r="8" />
          <circle {...common} cx="12" cy="12" r="4" />
          <path {...common} d="M12 12l5-5" />
          <path {...common} d="M17 7h3v3" />
        </svg>
      )
    case 'sustainability':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M19 5c-6 0-10 4-10 10 6 0 10-4 10-10z" />
          <path {...common} d="M5 19c4 0 6-2 8-6" />
          <path {...common} d="M5 19l3-3" />
        </svg>
      )
    case 'banking':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M3 9l9-5 9 5" />
          <path {...common} d="M4 10h16" />
          <path {...common} d="M6 10v7m4-7v7m4-7v7m4-7v7" />
          <path {...common} d="M3 20h18" />
        </svg>
      )
    case 'legal':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M12 4v16" />
          <path {...common} d="M7 8h10" />
          <path {...common} d="M7 8l-3 5h6l-3-5z" />
          <path {...common} d="M17 8l-3 5h6l-3-5z" />
          <path {...common} d="M8 20h8" />
        </svg>
      )
    case 'transport':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M3 8h12v7H3z" />
          <path {...common} d="M15 11h3l3 3v1h-6z" />
          <circle {...common} cx="7" cy="17" r="2" />
          <circle {...common} cx="18" cy="17" r="2" />
        </svg>
      )
    case 'entrepreneurship':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M6 14c3-5 8-7 12-8-1 4-3 9-8 12" />
          <path {...common} d="M9 17l-2 3" />
          <path {...common} d="M12 12l3 3" />
        </svg>
      )
    case 'hr':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle {...common} cx="8" cy="9" r="3" />
          <circle {...common} cx="16" cy="10" r="2" />
          <path {...common} d="M3 20v-1a5 5 0 0 1 10 0v1" />
          <path {...common} d="M14 20v-1a3 3 0 0 1 6 0v1" />
        </svg>
      )
    case 'risk':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M12 3l8 4v6c0 5-3 7.5-8 8-5-.5-8-3-8-8V7l8-4z" />
          <path {...common} d="M12 8v5" />
          <circle {...common} cx="12" cy="16" r="1" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M3 9l9-5 9 5" />
          <path {...common} d="M4 10h16" />
          <path {...common} d="M6 10v7m4-7v7m4-7v7m4-7v7" />
          <path {...common} d="M3 20h18" />
        </svg>
      )
  }
}

export default function CourseCard({course}){
  const [ref, inView] = useInView({once:true, threshold:0.12})
  const navigate = useNavigate()
  const iconKey = getIconKey(course)

  return (
    <article ref={ref} className={`formation-card card ${inView ? 'in-view' : ''} accent-${course.accent || 'blue'}`}>
      <div className="card-surface">
        <div className="icon-wrap" aria-hidden="true">
          <div className="icon-frame">
            <FormationIcon iconKey={iconKey} />
          </div>
        </div>

        <div className="course-body">
          <p className="course-card__eyebrow">{course.category}</p>
          <h3>{course.title}</h3>

          <p className="course-card__target"><strong>Cible :</strong> {course.target}</p>

          <div className="course-card__footer">
            <Link to={`/formation/${course.id}`} className="btn" onClick={()=>{ try{ navigate(`/formation/${course.id}`) }catch(_){ /* ignore */ } }}>
              Détails & inscription
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
