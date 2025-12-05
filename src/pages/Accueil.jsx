import React from 'react'
import { Link } from 'react-router-dom'
import courses from '../data/courses'
import './Accueil.css'
import { useEffect } from 'react'
import useInView from '../hooks/useInView'

const DOMAINS = [
  { id: 'marches', title: 'Marchés publics', desc: "Procédures et passation", img: '/marchepublic-01.png' },
  { id: 'audit', title: 'Audit institutionnel', desc: 'Audit financier et organisationnel', img: '/Audit-institutionnel-01.png' },
  { id: 'gouvernance', title: 'Gouvernance', desc: 'Politiques publiques et gouvernance', img: '/Gouvernance-01.png' },
  { id: 'finances', title: 'Finances publiques', desc: 'Gestion budgétaire et contrôle', img: '/Finances-publiques-01.png' },
  { id: 'rh', title: 'Ressources humaines', desc: "Management et amélioration des RH", img: '/Ressources-Humaine-Management-01.png' },
  { id: 'digital', title: 'Digitalisation', desc: 'Transformation numérique des services', img: '/Digitalisation-Transformation-numerique-01.png' }
]

function DomainCard({ title, desc, img, badge, index }){
  const [ref, inView] = useInView({ once: true, threshold: 0.18 })
  const style = { ['--i']: index }
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
  return (
    <>
    <header className="site-hero" role="banner">
      <div className="hero-overlay-layer" />
      <div className="container hero-inner">
        <div className="hero-left">
          <h1 className="hero-title">L'expertise au service de la performance publique</h1>
          <p className="hero-sub">Formations certifiantes en gouvernance publique, marchés publics, audit, finances publiques et développement institutionnel en Afrique.</p>

          <ul className="hero-features">
            <li><strong>Formations certifiantes</strong> reconnues par les institutions</li>
            <li><strong>Experts formateurs</strong> — pratiques & cas réels</li>
            <li><strong>Accompagnement post‑formation</strong> et suivi</li>
          </ul>

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
            <DomainCard key={d.id} title={d.title} desc={d.desc} img={d.img} index={i} />
          ))}
        </div>
      </div>

      <div className="container sample-courses">
        <h2>Offres de formation</h2>
        <div className="courses-grid">
          {courses.map(c=> (
            <div key={c.id} className="course-card">
              <h3>{c.title}</h3>
              <p className="meta">{c.category} • {c.duration}</p>
              <p>{c.description}</p>
              <Link to={`/formation/${c.id}`} className="btn">En savoir</Link>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
