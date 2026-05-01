import React from 'react'
import { Link } from 'react-router-dom'
import { getFormations } from '../lib/formations'
import CourseCard from '../components/CourseCard'
import './Accueil.css'
import { useEffect } from 'react'
import useInView from '../hooks/useInView'

const DOMAINS = [
  {
    id: 'formation-haut-niveau',
    title: 'Formation de haut niveau',
    desc: 'Ingénierie pédagogique sur mesure, gouvernance, leadership, transformation digitale et certifications spécialisées.',
    img: '/Digitalisation-Transformation-numerique-01.png',
    intro: "Ce pôle vise à renforcer le capital humain par des programmes d'excellence adaptés aux défis contemporains du secteur public et privé.",
    details: [
      'Ingénierie pédagogique sur mesure : conception de modules alignés sur les besoins spécifiques des cadres dirigeants et des hauts fonctionnaires.',
      'Gouvernance et leadership : formation à la prise de décision stratégique, à l’éthique professionnelle et à la gestion de la performance.',
      'Transformation digitale : accompagnement à l’appropriation des outils numériques pour l’efficacité opérationnelle.',
      'Certifications spécialisées : programmes intensifs en gestion de projets complexes et management des organisations.'
    ]
  },
  {
    id: 'conseil-strategique',
    title: 'Conseil stratégique',
    desc: 'Pilotage de la performance, modernisation de l’action publique, accompagnement au changement et planification stratégique.',
    img: '/Gouvernance-01.png',
    intro: 'Un accompagnement de proximité pour transformer les visions en résultats concrets et durables.',
    details: [
      'Pilotage de la performance : définition d’indicateurs clés (KPI) et mise en place de tableaux de bord prospectifs.',
      'Modernisation de l’action publique : réforme des processus administratifs pour une gouvernance plus agile et transparente.',
      'Accompagnement au changement : diagnostic organisationnel et gestion des transitions structurelles ou culturelles.',
      'Planification stratégique : élaboration de plans de développement à court, moyen et long terme.'
    ]
  },
  {
    id: 'audit-controle',
    title: 'Audit & contrôle',
    desc: 'Audit de la commande publique, lutte contre la corruption, audit financier et contrôle de gestion.',
    img: '/Audit-institutionnel-01.png',
    intro: 'Garantir la conformité, l’intégrité des processus et l’optimisation des ressources.',
    details: [
      'Audit de la commande publique : vérification de la transparence, de l’efficacité et de la régularité des procédures de passation de marchés.',
      'Lutte contre la corruption : mise en place de dispositifs de prévention, de cartographie des risques et de codes de conduite.',
      'Audit financier et opérationnel : évaluation de la sincérité des comptes et de l’efficience des dépenses.',
      'Contrôle de gestion : optimisation des flux financiers et sécurisation des actifs de l’organisation.'
    ]
  },
  {
    id: 'etude-recherche',
    title: 'Étude & recherche appliquée',
    desc: 'Études de faisabilité et d’impact, recherche sur l’inclusion, veille stratégique, sondages et enquêtes de satisfaction.',
    img: '/marchepublic-01.png',
    intro: 'Produire une donnée fiable pour éclairer la décision et anticiper les mutations.',
    details: [
      'Études de faisabilité et d’impact : analyse rigoureuse des projets avant lancement et évaluation de leurs retombées socio-économiques.',
      'Recherche sur l’inclusion : travaux dédiés à l’équité sociale, notamment sur les thématiques liées à la promotion de la famille et de la protection de l’enfance.',
      'Veille stratégique : analyse des tendances sectorielles et benchmarking international.',
      'Sondages et enquêtes de satisfaction : collecte et analyse de données terrain pour ajuster les politiques publiques ou privées.'
    ]
  }
]

function DomainCard({ title, desc, img, badge, index, intro, details = [] }){
  const [ref, inView] = useInView({ once: true, threshold: 0.18 })
  const [isOpen, setIsOpen] = React.useState(false)
  const style = { ['--i']: index }
  const detailsId = `domain-details-${index}`
  return (
    <article ref={ref} className={`domain-card ${inView ? 'in-view' : ''}`} style={style}>
      <div className="card-surface">
        <div className="media-wrap">
          <img
            className="media-img"
            src={img}
            alt={title}
            loading="lazy"
            decoding="async"
            importance="low"
            width="640"
            height="360"
            data-attempts="0"
            onError={(e)=>{
              const imgEl = e.currentTarget
              const attempts = parseInt(imgEl.dataset.attempts || '0', 10)
              imgEl.dataset.attempts = attempts + 1
              // Try a percent-encoded variant (if not already) then an ASCII fallback
              if(attempts === 0){
                try{ imgEl.src = encodeURI(imgEl.src) }catch(_){ imgEl.style.opacity = 0 }
              } else if(attempts === 1){
                // ASCII fallback: replace é -> e and remove other diacritics conservatively
                const ascii = imgEl.src.replace(/%C3%A9|é/g, 'e')
                imgEl.src = ascii
              } else {
                imgEl.style.opacity = 0
              }
            }}
          />
          {badge && <span className="media-badge">{badge}</span>}
        </div>
        <div className="domain-body">
          <h3>{title}</h3>
          <p className="domain-desc">{desc}</p>
          <button
            type="button"
            className="domain-more-btn"
            aria-expanded={isOpen}
            aria-controls={detailsId}
            onClick={() => setIsOpen(v => !v)}
          >
            {isOpen ? 'Masquer' : 'Voir plus'}
          </button>

          <div id={detailsId} className={`domain-details ${isOpen ? 'open' : ''}`}>
            <p className="domain-intro">{intro}</p>
            <ul>
              {details.map((item, i) => <li key={`${title}-${i}`}>{item}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Accueil(){
  useEffect(()=>{
    // Defer and preload the large hero background to avoid blocking first paint.
    // Use requestIdleCallback when available, otherwise load after 'load' event.
    let mounted = true
    function applyHero(){
      if(!mounted) return
      const img = new Image()
      img.src = '/IMG-ceca.jpg'
      img.onload = ()=>{
        if(!mounted) return
        const el = document.querySelector('.site-hero')
        if(el) {
          el.style.backgroundImage = `url('${img.src}')`
          el.style.backgroundSize = 'cover'
          el.style.backgroundPosition = 'center'
        }
      }
      // if image fails, do nothing (fallback overlay remains)
    }

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(applyHero, { timeout: 1000 })
      return () => { mounted = false; try { if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(id) } catch (e) {} }
    }

    // Fallback: wait for window load (ensures critical resources loaded)
    const onLoad = () => applyHero()
    if (document.readyState === 'complete') applyHero()
    else window.addEventListener('load', onLoad)
    return () => { mounted = false; window.removeEventListener('load', onLoad) }
  },[])
  const [featured, setFeatured] = React.useState([])
  React.useEffect(()=>{ let mounted=true; (async ()=>{ const data = await getFormations(); if(mounted) setFeatured(data) })(); return ()=>{ mounted=false } },[])
  return (
    <>
    <header className="site-hero" role="banner">
      <div className="hero-overlay-layer" />
      <div className="container hero-inner">
        <div className="hero-left">
          <h1 className="hero-title">Cabinet Experts Consulting Afrique (C.E.C.A)</h1>
          <p className="hero-sub">L’excellence au service de la gouvernance, du leadership et de la performance en Afrique</p>

          <div className="hero-ctas">
            <Link to="/catalogue" className="btn cta">Découvrir les formations</Link>
            <Link to="/contact" className="btn secondary" style={{marginLeft:12}}>Nous contacter</Link>
          </div>
        </div>
      </div>
    </header>

      <div className="container domains">
        <h2>Domaines d'expertise</h2>
        <div className="domain-grid">
          {DOMAINS.map((d, i) => (
            <DomainCard key={d.id} title={d.title} desc={d.desc} img={d.img} intro={d.intro} details={d.details} index={i} />
          ))}
        </div>
      </div>

      <div className="container sample-courses">
        <h2>Offres de formation</h2>
        <div className="courses-grid">
          {featured.map(c=> (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </div>
    </>
  )
}
