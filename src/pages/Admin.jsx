import React from 'react'
import './Admin.css'
import AdminSidebar from '../components/AdminSidebar'
import { useAuth } from '../context/AuthContext'
import { useLocation, Link } from 'react-router-dom'
import FormationsAdmin from './admin/FormationsAdmin'
import ApprenantsAdmin from './admin/ApprenantsAdmin'

export default function Admin(){
  const { user, loading } = useAuth()
  const location = useLocation()

  // determine active admin subsection based on pathname
  const subpath = location.pathname.replace(/^\/admin\/?/, '')
  const section = subpath === '' ? 'dashboard' : subpath

  function renderSection(name){
    switch(name){
      case 'formations':
        return <FormationsAdmin />
      case 'apprenants':
        return <ApprenantsAdmin />
      case 'certificats':
        return (
          <div>
            <h2>Certificats</h2>
            <p className="muted">Génération et gestion des certificats (placeholder)</p>
            <div style={{marginTop:12}} className="card">Aucun certificat généré — placeholder</div>
          </div>
        )
      case 'instructeurs':
        return (
          <div>
            <h2>Instructeurs</h2>
            <p className="muted">Liste des instructeurs (placeholder)</p>
            <div style={{marginTop:12}} className="card">Aucun instructeur — placeholder</div>
          </div>
        )
      case 'parametres':
        return (
          <div>
            <h2>Paramètres</h2>
            <p className="muted">Configuration du site (placeholder)</p>
            <div style={{marginTop:12}} className="card">Options de configuration — placeholder</div>
          </div>
        )
      default:
        return (
          <div>
            <h2>Tableau de bord</h2>
            <p className="muted">Vue d'ensemble (placeholder)</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginTop:12}}>
              <div className="card">Formations: —</div>
              <div className="card">Apprenants: —</div>
              <div className="card">Certificats: —</div>
              <div className="card">Instructeurs: —</div>
            </div>
          </div>
        )
    }
  }
  return (
    <section className="container admin-page">
      <div className="admin-layout">
        <AdminSidebar />

        <main className="admin-main">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
            <div>
              <h1>Espace administration</h1>
              <p style={{marginTop:6,opacity:0.9}}>Prototype de tableau de bord — aperçu professionnel pour vérification.</p>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:12,color:'#666'}}>Mode</div>
              <div style={{background:'#ffe9b3',color:'#7a4a00',padding:'6px 10px',borderRadius:6,fontWeight:600}}>Preview (no DB)</div>
            </div>
          </div>

          {/* Diagnostic panel removed as requested */}

          {/* Section-specific content (rendered according to sidebar link) */}
          <div style={{marginTop:18}}>
            {renderSection(section)}
          </div>

          <div className="admin-stats" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginTop:18}}>
            <div className="card">
              <div style={{fontSize:20,fontWeight:700}}>—</div>
              <div style={{fontSize:12,opacity:0.7}}>Formations</div>
            </div>
            <div className="card">
              <div style={{fontSize:20,fontWeight:700}}>—</div>
              <div style={{fontSize:12,opacity:0.7}}>Apprenants</div>
            </div>
            <div className="card">
              <div style={{fontSize:20,fontWeight:700}}>—</div>
              <div style={{fontSize:12,opacity:0.7}}>Certificats</div>
            </div>
            <div className="card">
              <div style={{fontSize:20,fontWeight:700}}>—</div>
              <div style={{fontSize:12,opacity:0.7}}>Instructeurs</div>
            </div>
          </div>

          <h2 style={{marginTop:22}}>Actions rapides</h2>
          <div className="admin-grid" style={{marginTop:10}}>
            <div className="card">
              <div>
                <strong>Ajouter une formation</strong>
                <div className="muted">Formulaire d'ajout (placeholder)</div>
                <div style={{marginTop:10}}><button className="btn">Nouveau cours</button></div>
              </div>
            </div>

            <div className="card">
              <div>
                <strong>Gérer apprenants</strong>
                <div className="muted">Importer / Exporter (placeholder)</div>
                <div style={{marginTop:10}}><button className="btn">Voir la liste</button></div>
              </div>
            </div>

            <div className="card">
              <div>
                <strong>Générer certificats</strong>
                <div className="muted">Génération manuelle (placeholder)</div>
                <div style={{marginTop:10}}><button className="btn">Générer</button></div>
              </div>
            </div>

            <div className="card">
              <div>
                <strong>Paramètres</strong>
                <div className="muted">Configuration du site</div>
                <div style={{marginTop:10}}><button className="btn">Ouvrir</button></div>
              </div>
            </div>
          </div>

          <div style={{marginTop:24,color:'#555'}}>
            <p>Note : ceci est une interface de démonstration. Les actions sont des placeholders en attente de connexion à la base de données.</p>
          </div>
        </main>
      </div>
    </section>
  )
}
