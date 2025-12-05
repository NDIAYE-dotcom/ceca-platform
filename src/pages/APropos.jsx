import React from 'react'
import './APropos.css'
import StatsCounter from '../components/StatsCounter'
import useInView from '../hooks/useInView'

export default function APropos(){
  return (
    <section className="a-propos">
      <div className="hero container">
        <div className="hero-left">
          <h1>CECA-Solutions</h1>
          <p className="slogan">L'expertise au service de la performance publique</p>
          <p className="lead">Cabinet africain de conseil, d'audit et de formation spécialisé dans la gouvernance publique, la commande publique, le développement institutionnel et la gestion des ressources humaines. Nous accompagnons administrations, collectivités et partenaires pour des réformes transparentes et durables.</p>
        </div>
        <div className="hero-right">
          <img src="/assets/hero-about.svg" alt="CECA hero" />
        </div>
      </div>

      <div className="container stats-section">
        <div className="stats-grid">
          <StatsCounter end={120} label="Formations réalisées" duration={1200} />
          <StatsCounter end={3500} label="Apprenants" duration={1600} />
          <StatsCounter end={80} label="Institutions partenaires" duration={1000} />
        </div>
      </div>

      <div className="container expertise">
        <h2>Domaines d'expertise</h2>
        <div className="cards">
          {
            (()=>{
              const items = [
                {img:'/assets/icon-governance.svg', title:'Gouvernance & Commande publique', desc:'Conseil en gouvernance, politiques publiques, et renforcement des procédures de passation.', color: 'green'},
                {img:'/assets/icon-audit.svg', title:'Audit & Finances publiques', desc:'Audit institutionnel, organisationnel et financier pour une gestion publique efficace.', color: 'yellow'},
                {img:'/assets/icon-finance.svg', title:'Formation & Renforcement de capacités', desc:'Formations certifiantes pour agents publics, collectivités et partenaires techniques.', color: 'red'}
              ]
              return items.map((it, idx)=>{
                const [ref, inView] = useInView({once:true, threshold:0.12})
                return (
                  <div key={idx} ref={ref} className={`card ${inView ? 'slide-up' : ''}`}>
                    <div className={`icon ${it.color || ''}`}>
                      <img src={it.img} alt={it.title} />
                    </div>
                    <h4>{it.title}</h4>
                    <p>{it.desc}</p>
                  </div>
                )
              })
            })()
          }
        </div>
      </div>

      <div className="container more-info">
        <div className="two-col">
          <div>
            <h3>Vision</h3>
            <p>Devenir un acteur de référence en Afrique dans la réforme de la gouvernance publique.</p>

            <h3>Devise</h3>
            <p>« L'expertise au service de la performance publique »</p>

            <h3>Mission & Valeurs</h3>
            <ul>
              <li>Renforcer les capacités institutionnelles</li>
              <li>Promouvoir la transparence et l'inclusion</li>
              <li>Fournir des conseils adaptés au contexte africain</li>
            </ul>
          </div>

          <aside className="contact-card">
            <h4>Contact</h4>
            <p><strong>Adresse:</strong> Keur Massar, Dakar, Sénégal</p>
            <p><strong>Email:</strong> <a href="mailto:contact@ceca-solutions.africa">contact@ceca-solutions.africa</a></p>
            <p><strong>Téléphone:</strong> +221 77 000 00 00</p>
            <p><a href="/contact" className="btn">Nous contacter</a></p>
          </aside>
        </div>
      </div>
    </section>
  )
}
