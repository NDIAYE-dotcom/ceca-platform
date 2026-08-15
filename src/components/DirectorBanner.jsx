import React from 'react'
import { Link } from 'react-router-dom'
import './DirectorBanner.css'

const MESSAGE = `À l’heure où l’Afrique amorce des mutations stratégiques décisives, la modernisation de notre gouvernance publique et l’optimisation de nos institutions constituent le socle de notre souveraineté et de notre développement durable.`

export default function DirectorBanner(){
  return (
    <div className="director-banner" role="region" aria-label="Mot du Directeur Général">
      <div className="director-banner__inner">
        <div className="db-photo">
          <img src="/img%20sm-01.png" alt="Elhadji Serigne MBAYE, Directeur Général de CECA" loading="lazy" />
        </div>
        <div className="db-content">
          <span className="db-quote-mark" aria-hidden="true">“</span>
          <p className="db-eyebrow">Mot du Directeur Général</p>
          <p className="db-message">{MESSAGE}</p>
          <div className="db-footer">
            <div className="db-signature">
              <strong>Elhadji Serigne MBAYE</strong>
              <span>Directeur Général, CECA</span>
            </div>
            <Link to="/a-propos#mot-directeur" className="db-cta">Lire la suite →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
