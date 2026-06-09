import React, { useId } from 'react'
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
  const uid = useId().replace(/:/g, '_')
  const gradId = `grad_${uid}`
  const shadowId = `shadow_${uid}`

  const baseProps = { className: 'formation-icon', role: 'img', 'aria-hidden': 'true', viewBox: '0 0 64 64', xmlns: 'http://www.w3.org/2000/svg' }

  const makeDefs = (start, end) => (
    <defs>
      <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor={start} />
        <stop offset="100%" stopColor={end} />
      </linearGradient>
      <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000" floodOpacity="0.16" />
      </filter>
    </defs>
  )

  const render = (start, end, content) => (
    <svg {...baseProps}>
      {makeDefs(start, end)}
      <g filter={`url(#${shadowId})`}>
        <rect x="6" y="8" width="52" height="40" rx="8" fill={`url(#${gradId})`} />
      </g>
      <g fill="#fff">
        {content}
      </g>
    </svg>
  )

  switch(iconKey){
    case 'procurement':
      return render('#0b74ff', '#0353a4', (
        <g>
          <path d="M18 22h28v-6c0-3-3-5-6-5H24c-3 0-6 2-6 5v6z" opacity="0.98" />
          <rect x="18" y="26" width="28" height="10" rx="2" opacity="0.95" />
        </g>
      ))
    case 'leadership':
      return render('#7c3aed', '#4f46e5', (
        <g>
          <circle cx="32" cy="22" r="8" opacity="0.98" />
          <path d="M16 46c0-6 8-10 16-10s16 4 16 10" opacity="0.92" />
        </g>
      ))
    case 'finance':
      return render('#059669', '#047857', (
        <g>
          <ellipse cx="32" cy="22" rx="12" ry="6" opacity="0.98" />
          <ellipse cx="32" cy="30" rx="12" ry="6" opacity="0.95" />
          <ellipse cx="32" cy="38" rx="12" ry="6" opacity="0.92" />
        </g>
      ))
    case 'project':
      return render('#0284c7', '#0369a1', (
        <g>
          <circle cx="32" cy="30" r="10" opacity="0.98" />
          <circle cx="32" cy="30" r="5" fill="rgba(255,255,255,0.12)" />
        </g>
      ))
    case 'sustainability':
      return render('#10b981', '#059669', (
        <g>
          <path d="M22 36c6-4 12-12 20-14-4 8-6 14-16 20" opacity="0.98" />
        </g>
      ))
    case 'banking':
      return render('#ad7c12', '#7c4a00', (
        <g>
          <path d="M12 42h40v4H12z" opacity="0.95" />
          <path d="M12 22h40L32 8 12 22z" opacity="0.98" />
        </g>
      ))
    case 'legal':
      return render('#f97316', '#d97706', (
        <g>
          <rect x="18" y="30" width="28" height="6" rx="1" opacity="0.95" />
          <path d="M30 18l8 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
      ))
    case 'transport':
      return render('#06b6d4', '#0891b2', (
        <g>
          <rect x="10" y="26" width="36" height="16" rx="3" opacity="0.98" />
          <circle cx="22" cy="44" r="4" fill="#fff" opacity="0.95" />
          <circle cx="42" cy="44" r="4" fill="#fff" opacity="0.95" />
        </g>
      ))
    case 'entrepreneurship':
      return render('#ea580c', '#dc2626', (
        <g>
          <path d="M32 12l6 12-6 14-6-14 6-12z" opacity="0.98" />
          <circle cx="32" cy="8" r="3" opacity="0.95" />
        </g>
      ))
    case 'hr':
      return render('#7dd3fc', '#0284c7', (
        <g>
          <circle cx="22" cy="28" r="6" opacity="0.98" />
          <circle cx="42" cy="30" r="5" opacity="0.95" />
          <path d="M12 46c6-6 28-6 40 0" opacity="0.9" />
        </g>
      ))
    case 'risk':
      return render('#ef4444', '#b91c1c', (
        <g>
          <path d="M32 10l14 8v12c0 8-6 12-14 12s-14-4-14-12V18l14-8z" opacity="0.98" />
          <path d="M32 26v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
      ))
    default:
      return render('#0b3d91', '#0b74ff', (
        <g>
          <path d="M12 40h40v4H12z" opacity="0.95" />
          <path d="M12 22h40L32 8 12 22z" opacity="0.98" />
        </g>
      ))
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