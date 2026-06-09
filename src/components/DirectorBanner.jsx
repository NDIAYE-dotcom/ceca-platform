import React from 'react'
import { Link } from 'react-router-dom'
import './DirectorBanner.css'

const MESSAGE = `À l’heure où l’Afrique amorce des mutations stratégiques décisives, la modernisation de notre gouvernance publique et l’optimisation de nos institutions constituent le socle de notre souveraineté et de notre développement durable.`

export default function DirectorBanner(){
  return (
    <div className="director-banner" role="region" aria-label="Mot du Directeur Général">
      <div className="director-banner__inner">
          <div className="banner-content">
            <div className="banner-text">
              <h3>Mot du Directeur Général</h3>
              <p>{MESSAGE} <Link to="/a-propos#mot-directeur" className="read-more-btn">Lire la suite</Link></p>
            </div>
          </div>
      </div>
    </div>
  )
}
