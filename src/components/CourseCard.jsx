import React, { useId } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useInView from '../hooks/useInView'
import './CourseCard.css'

function getIconKey(course){
  const text = `${course?.title || ''} ${course?.category || ''}`.toLowerCase()
  if(text.includes('gouvernance') || text.includes('publique') || text.includes('institution')) return 'government'
  if(text.includes('commande') || text.includes('ppp') || text.includes('partenariat')) return 'procurement'
  if(text.includes('management') || text.includes('leadership') || text.includes('stratég')) return 'leadership'
  if(text.includes('finance') || text.includes('fiscalit') || text.includes('comptabilit')) return 'finance'
  if(text.includes('projet') || text.includes('ong')) return 'project'
  if(text.includes('bailleur') || text.includes('bailleurs') || text.includes('international')) return 'bailleur'
  if(text.includes('collectivit') || text.includes('décentral') || text.includes('territorial')) return 'collectivity'
  if(text.includes('environnement') || text.includes('durable') || text.includes('rse')) return 'sustainability'
  if(text.includes('financier') || text.includes('bancaire') || text.includes('microfinance') || text.includes('banque')) return 'banking'
  if(text.includes('droit') || text.includes('ohada') || text.includes('juridique')) return 'legal'
  if(text.includes('transport') || text.includes('logistique') || text.includes('infrastructure')) return 'transport'
  if(text.includes('entrepreneuriat') || text.includes('innovation') || text.includes('digitale')) return 'entrepreneurship'
  if(text.includes('ressources humaines') || text.includes('rh') || text.includes('transformation digitale')) return 'hr'
  if(text.includes('risque') || text.includes('sécurisation') || text.includes('gestion des risques')) return 'risk'
  return 'government'
}

function FormationIcon({ iconKey }){
  const uid = useId().replace(/:/g, '_')
  const baseProps = { className: 'formation-icon', role: 'img', 'aria-hidden': 'true', viewBox: '0 0 64 64', xmlns: 'http://www.w3.org/2000/svg' }

  // Render minimal SVG: no colored rectangle background, only the emoji/icon
  const render = (start, end, emoji, label, bgColor) => (
    <svg {...baseProps}>
      <circle cx="32" cy="32" r="28" fill={bgColor} />
      <circle cx="32" cy="32" r="28" fill="none" stroke={start} strokeOpacity="0.08" strokeWidth="1" />
      <text
        x="32"
        y="36"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="36"
        fontFamily="Tahoma, Geneva, sans-serif"
      >
        {emoji}
      </text>
      <title>{label}</title>
    </svg>
  )

  const icons = {
    government: { start: '#0b3d91', end: '#0b74ff', emoji: '🏛️', label: 'Gouvernance publique & finances publiques' },
    procurement: { start: '#0f766e', end: '#14b8a6', emoji: '🤝', label: 'Commande publique & PPP' },
    leadership: { start: '#6d28d9', end: '#4f46e5', emoji: '🎯', label: 'Management stratégique & leadership' },
    finance: { start: '#047857', end: '#059669', emoji: '📊', label: 'Finance, fiscalité & comptabilité' },
    project: { start: '#0369a1', end: '#0284c7', emoji: '📋', label: 'Gestion des projets & ONG' },
    bailleur: { start: '#0f766e', end: '#2563eb', emoji: '🌍', label: 'Programmes financés par les bailleurs internationaux' },
    collectivity: { start: '#7c2d12', end: '#ea580c', emoji: '🏘️', label: 'Collectivités territoriales & décentralisation' },
    sustainability: { start: '#15803d', end: '#10b981', emoji: '🌱', label: 'Environnement, développement durable & RSE' },
    banking: { start: '#854d0e', end: '#ca8a04', emoji: '🏦', label: 'Secteur financier, bancaire & microfinance' },
    legal: { start: '#7c3aed', end: '#c026d3', emoji: '⚖️', label: 'Droit des affaires & sécurisation juridique (OHADA)' },
    transport: { start: '#0e7490', end: '#06b6d4', emoji: '🚛', label: 'Transport, logistique & infrastructures' },
    entrepreneurship: { start: '#c2410c', end: '#ea580c', emoji: '💡', label: 'Entrepreneuriat & innovation digitale' },
    hr: { start: '#0f766e', end: '#22c55e', emoji: '👥', label: 'Ressources humaines & transformation digitale' },
    risk: { start: '#b91c1c', end: '#ef4444', emoji: '🛡️', label: 'Fiscalité avancée & gestion des risques' }
  }

  const entry = icons[iconKey] || icons.government

  // Use the icon's start color to create a subtle translucent circular background.
  // Append alpha to the hex color for translucency (CSS/SVG accepts 8-digit hex #RRGGBBAA).
  const alphaHex = '22' // ~13% opacity
  const bgColor = entry.start && entry.start.length === 7 ? `${entry.start}${alphaHex}` : `${entry.start}`

  return (
    render(entry.start, entry.end, entry.emoji, entry.label, bgColor)
  )
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