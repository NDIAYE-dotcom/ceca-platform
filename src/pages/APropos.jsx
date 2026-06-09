import React from 'react'
import './APropos.css'
import StatsCounter from '../components/StatsCounter'
import useInView from '../hooks/useInView'

export default function APropos(){
  return (
    <section className="a-propos">
      <div className="hero container">
        <div className="hero-left">
          <h1>CECA</h1>
          <p className="slogan">L'expertise au service de la performance publique</p>
          <p className="lead">Cabinet africain de conseil, d'audit et de formation spécialisé dans la gouvernance publique, la commande publique, le développement institutionnel et la gestion des ressources humaines. Nous accompagnons administrations, collectivités et partenaires pour des réformes transparentes et durables.</p>
        </div>
        <div className="hero-right">
          <img src="/img%20sm-01.png" alt="CECA hero" />
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
            <p><strong>Email:</strong> <a href="mailto:ceconsultingafrique@gmail.com">ceconsultingafrique@gmail.com</a></p>
            <p><strong>Téléphone:</strong> 📞 <a href="tel:+221338377143">+221 33 837 7143</a> / <a href="tel:+221775123076">+221 77 512 30 76</a></p>
            <p><a href="/contact" className="btn">Nous contacter</a></p>
          </aside>
        </div>
      </div>

      <div className="container director-section" id="mot-directeur">
        <article className="director-message">
          <h2>Mot du Directeur Général</h2>
          <div className="director-content">
            <p>Chers partenaires, Mesdames, Messieurs,</p>

            <p>À l’heure où l’Afrique amorce des mutations stratégiques décisives, la modernisation de notre gouvernance publique et l’optimisation de nos institutions ne sont plus de simples options : elles constituent le socle de notre souveraineté et de notre développement durable.</p>

            <p>C’est avec cette intime conviction que le Cabinet Experts Consulting Afrique (CECA) s’est donné pour mission d’accompagner les administrations publiques, les collectivités territoriales et les partenaires au développement vers les plus hauts standards de performance, d’économie et de transparence.</p>

            <p>Notre crédo, « L’expertise au service de la performance publique », guide chacune de nos interventions. Qu’il s’agisse de la refonte et de la maîtrise des cadres de la commande publique, de l’audit de gouvernance, du développement institutionnel ou de la valorisation de notre capital humain, nous mobilisons une ingénierie de haut niveau, ancrée dans les réalités africaines et ouverte sur les meilleures pratiques internationales.</p>

            <p>Au-delà de la simple expertise technique, nous croyons fermement à la co-construction et au renforcement des compétences locales. Notre ambition est de doter nos institutions des leviers nécessaires pour piloter des réformes transparentes, efficaces et créatrices de valeur pour nos territoires.</p>

            <p>Faire le choix du CECA, c’est choisir un partenaire stratégique engagé, rigoureux et résolument tourné vers l’excellence managériale. Ensemble, bâtissons une action publique moderne, performante et digne de la confiance de nos concitoyens.</p>

            <p>Je vous remercie pour votre confiance renouvelée.</p>

            <p><strong>Elhadji Serigne MBAYE</strong><br />Directeur Général,<br />Cabinet Experts Consulting Afrique (CECA).<br />Consultant Formateur — Enseignant Associé à L'UCAD / L'UASZ / L'ENA du Sénégal.</p>
          </div>
        </article>
      </div>
    </section>
  )
}
