import React, { useEffect, useState } from 'react'
import './Admin.css'
import AdminSidebar from '../components/AdminSidebar'
import { useAuth } from '../context/AuthContext'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { supabase, isSupabaseEnabled } from '../lib/supabase'
import FormationsAdmin from './admin/FormationsAdmin'
import ApprenantsAdmin from './admin/ApprenantsAdmin'
import MissionsAgenda from './admin/MissionsAgenda'
import MessagesAdmin from './admin/MessagesAdmin'

const REGISTRATIONS_TABLE = import.meta.env.VITE_REGISTRATIONS_TABLE || 'registrations'

async function countTable(name){
  try{
    const res = await supabase.from(name).select('id', { count: 'exact', head: true })
    if(!res.error) return res.count
  }catch(e){ /* fall through */ }
  return null
}

function useAdminStats(ready){
  const [stats, setStats] = useState({ formations: null, apprenants: null, loading: true })

  useEffect(()=>{
    if(!ready) return
    let mounted = true
    async function load(){
      let formations = null
      let apprenants = null
      if(isSupabaseEnabled && supabase){
        formations = await countTable('formations')
        apprenants = await countTable(REGISTRATIONS_TABLE)
      }
      if(mounted) setStats({ formations, apprenants, loading: false })
    }
    load()
    return ()=>{ mounted = false }
  },[ready])

  return stats
}

const ENTREPRISE_FEATURES = [
  { key: 'agenda', label: 'Agenda de programmation des missions', description: "Planification des missions avec notification de rappel." },
  { key: 'missions', label: 'Suivi des missions', description: "Suivi de l'avancement des missions en cours." },
  { key: 'clients', label: 'Gestion des clients', description: "Répertoire et suivi des clients du cabinet." },
  { key: 'facturation', label: 'Facturation', description: "Émission et suivi des factures clients." },
  { key: 'rapports', label: 'Rapports', description: "Génération de rapports d'activité." },
  { key: 'bilan', label: 'Bilan', description: "Bilan et indicateurs de performance du cabinet." }
]

function ComingSoon({ title, description, features, backTo }){
  return (
    <div className="admin-panel">
      {backTo && <Link to={backTo} className="admin-back-link">← Retour</Link>}
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {features && features.length > 0 && (
        <ul className="admin-feature-preview">
          {features.map(f => (
            <li key={f.key} className={f.key === 'agenda' ? 'admin-feature-preview--live' : ''}>
              <Link to={`/admin/entreprise/${f.key}`}>
                {f.label}
                {f.key === 'agenda' && <span className="admin-feature-preview-badge">Disponible</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="admin-empty-state">
        <div className="admin-empty-icon" aria-hidden="true">🚧</div>
        <p><strong>Bientôt disponible</strong></p>
        <p className="muted">Cette section n'est pas encore développée. Formations et Apprenants sont pleinement fonctionnels.</p>
      </div>
    </div>
  )
}

export default function Admin(){
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const stats = useAdminStats(Boolean(user))
  const [toasts, setToasts] = useState([])
  const [unseenRegistrations, setUnseenRegistrations] = useState(0)

  // determine active admin subsection based on pathname
  const subpath = location.pathname.replace(/^\/admin\/?/, '')
  const section = subpath === '' ? 'dashboard' : subpath

  // Global "new registrant" notification: lives here (not inside ApprenantsAdmin)
  // so it fires no matter which admin section is currently open, not only when
  // the admin happens to already be on the Apprenants page.
  useEffect(()=>{
    if(!isSupabaseEnabled) return
    let channel
    try{
      channel = supabase.channel(`public:${REGISTRATIONS_TABLE}:admin-notify`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: REGISTRATIONS_TABLE }, (p) => {
          const r = p?.new ?? p?.record
          if(!r) return
          const toastId = `${r.id || Date.now()}-${Math.random().toString(36).slice(2)}`
          setToasts(prev => [...prev, { id: toastId, name: r.name, formation: r.formation_title }])
          setTimeout(()=> setToasts(prev => prev.filter(t => t.id !== toastId)), 7000)
          setUnseenRegistrations(prev => prev + 1)

          if(typeof Notification !== 'undefined'){
            if(Notification.permission === 'granted'){
              new Notification('Nouvel inscrit — CECA', { body: `${r.name} vient de s'inscrire à « ${r.formation_title} »` })
            } else if(Notification.permission !== 'denied'){
              Notification.requestPermission()
            }
          }
        })
        .subscribe()
    }catch(e){ console.warn('registrations realtime subscribe failed', e) }

    return ()=>{ if(channel) try{ supabase.removeChannel(channel) }catch(e){} }
  }, [])

  // Clear the sidebar badge once the admin actually opens Apprenants
  useEffect(()=>{
    if(section === 'apprenants') setUnseenRegistrations(0)
  }, [section])

  function renderSection(name){
    if(name.startsWith('entreprise/')){
      const key = name.slice('entreprise/'.length)
      if(key === 'agenda') return <MissionsAgenda />
      const feature = ENTREPRISE_FEATURES.find(f => f.key === key)
      return (
        <ComingSoon
          title={feature ? feature.label : "Gestion de l'entreprise"}
          description={feature ? feature.description : ''}
          backTo="/admin/entreprise"
        />
      )
    }
    switch(name){
      case 'formations':
        return <FormationsAdmin />
      case 'apprenants':
        return <ApprenantsAdmin />
      case 'messages':
        return <MessagesAdmin />
      case 'certificats':
        return <ComingSoon title="Certificats" description="Génération et gestion des certificats de réussite." />
      case 'instructeurs':
        return <ComingSoon title="Instructeurs" description="Gestion des profils formateurs et de leurs interventions." />
      case 'entreprise':
        return (
          <ComingSoon
            title="Gestion de l'entreprise"
            description="Pilotage de l'activité du cabinet : missions, clients et facturation."
            features={ENTREPRISE_FEATURES}
          />
        )
      case 'parametres':
        return <ComingSoon title="Paramètres" description="Configuration générale du site et du compte administrateur." />
      default:
        return (
          <div className="admin-dashboard">
            <div className="admin-stats">
              <div className="stat-card">
                <div className="stat-value">{stats.formations ?? '—'}</div>
                <div className="stat-label">Formations</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.apprenants ?? '—'}</div>
                <div className="stat-label">Apprenants inscrits</div>
              </div>
              <div className="stat-card stat-card--muted">
                <div className="stat-value">—</div>
                <div className="stat-label">Certificats</div>
              </div>
              <div className="stat-card stat-card--muted">
                <div className="stat-value">—</div>
                <div className="stat-label">Instructeurs</div>
              </div>
            </div>

            <h2 className="admin-section-title">Actions rapides</h2>
            <div className="admin-actions-grid">
              <button className="action-card" onClick={()=>navigate('/admin/formations')}>
                <strong>Ajouter une formation</strong>
                <span className="muted">Créer, éditer ou retirer un cours du catalogue</span>
              </button>
              <button className="action-card" onClick={()=>navigate('/admin/apprenants')}>
                <strong>Gérer les apprenants</strong>
                <span className="muted">Voir les inscriptions et exporter en CSV</span>
              </button>
              <button className="action-card" onClick={()=>navigate('/admin/certificats')}>
                <strong>Certificats</strong>
                <span className="muted">Bientôt disponible</span>
              </button>
              <button className="action-card" onClick={()=>navigate('/admin/parametres')}>
                <strong>Paramètres</strong>
                <span className="muted">Bientôt disponible</span>
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <section className="container admin-page">
      {toasts.length > 0 && (
        <div className="admin-toast-stack">
          {toasts.map(t => (
            <Link to="/admin/apprenants" key={t.id} className="admin-toast">
              <span className="admin-toast-icon" aria-hidden="true">🎉</span>
              <span>
                <strong>Nouvel inscrit</strong>
                <span className="admin-toast-body">{t.name} — {t.formation}</span>
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="admin-layout">
        <AdminSidebar apprenantsBadge={unseenRegistrations} />

        <main className="admin-main">
          <div className="admin-header">
            <div>
              <h1>Espace administration</h1>
              {user?.email && <p className="muted">Connecté en tant que {user.email}</p>}
            </div>
          </div>

          <div className="admin-section">
            {renderSection(section)}
          </div>
        </main>
      </div>
    </section>
  )
}
