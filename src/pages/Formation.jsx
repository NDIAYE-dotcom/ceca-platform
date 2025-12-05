import React from 'react'
import { useParams, Link } from 'react-router-dom'
import courses from '../data/courses'
import './Formation.css'
import { usdToFcfa, formatFcfa } from '../utils/currency'

export default function Formation(){
  const {id} = useParams()
  const course = courses.find(c=>c.id===id)
  if(!course) return <div className="container">Formation introuvable</div>

  return (
    <section className="container formation-detail">
      <h1>{course.title}</h1>
      <p className="meta">{course.category} • {course.duration} • Formateur : {course.instructor}</p>
      <div className="two-col">
        <div>
          <h3>Objectifs</h3>
          <p>À l'issue de la formation, les participants seront capables de mettre en œuvre des procédures conformes aux meilleures pratiques.</p>

          <h3>Modules</h3>
          <ul>
            {course.modules.map(m=> <li key={m}>{m}</li>)}
          </ul>

          <h3>Public cible</h3>
          <p>Agents publics, responsables financiers, auditeurs internes, consultants.</p>

          <h3>Tarif</h3>
          <p className="price">{course.price} USD</p>

          <h3>Inscription & Paiement</h3>
          <p>Tarif estimé : <strong>{formatFcfa(usdToFcfa(course.price))}</strong></p>
          <p>Choisissez votre mode de paiement. (Placeholders pour Wave / Orange Money / Carte)</p>
          <div className="payments">
            <button className="btn">Payer par Wave (placeholder)</button>
            <button className="btn secondary">Orange Money (placeholder)</button>
            <button className="btn secondary">Carte bancaire (placeholder)</button>
          </div>

          <p className="note">Après paiement, vous recevrez un lien d'accès à l'espace e-learning et votre certificat sera généré automatiquement à la réussite.</p>
        </div>

        <aside>
          <h4>Résumé</h4>
          <p>{course.description}</p>
          <Link to={`/elearning/${course.id}`} className="btn">Accéder à la démo e-learning</Link>
        </aside>
      </div>
    </section>
  )
}
