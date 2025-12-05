import React from 'react'
import './References.css'

const refs = [
  {name: 'Ministère des Finances', desc: 'Accompagnement en réforme budgétaire'},
  {name: 'Collectivité de X', desc: 'Formation marchés publics'},
  {name: 'ONG Y', desc: 'Audit institutionnel'}
]

export default function References(){
  return (
    <section className="container references">
      <h1>Références & témoignages</h1>
      <div className="refs-grid">
        {refs.map(r=> (
          <div className="ref" key={r.name}>
            <h4>{r.name}</h4>
            <p>{r.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
