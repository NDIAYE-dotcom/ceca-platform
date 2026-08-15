import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './AdminSidebar.css'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/admin', label: 'Tableau de bord', icon: '📊', end: true },
  { to: '/admin/formations', label: 'Formations', icon: '🎓' },
  { to: '/admin/apprenants', label: 'Apprenants', icon: '👥' },
  { to: '/admin/messages', label: 'Messages', icon: '✉️' },
  { to: '/admin/certificats', label: 'Certificats', icon: '📜' },
  { to: '/admin/instructeurs', label: 'Instructeurs', icon: '🧑‍🏫' },
  { to: '/admin/entreprise', label: "Gestion de l'entreprise", icon: '🏢' },
  { to: '/admin/parametres', label: 'Paramètres', icon: '⚙️' }
]

export default function AdminSidebar(){
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  function openSidebar(){ setOpen(true) }
  function closeSidebar(){ setOpen(false) }

  return (
    <>
      {!open && <button className="sidebar-toggle" aria-label="Ouvrir le menu" onClick={openSidebar}>☰</button>}
      <div className={"sidebar-overlay " + (open ? 'show' : '')} onClick={closeSidebar} />
      <aside className={"admin-sidebar " + (open ? 'open' : '')}>
        <div className="sidebar-brand">
          <div>
            <strong>CECA</strong>
            <small>Espace administration</small>
          </div>
          <button className="sidebar-close" onClick={closeSidebar} aria-label="Fermer">×</button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {NAV_ITEMS.map(item => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} onClick={closeSidebar} className={({isActive}) => isActive ? 'active' : ''}>
                  <span className="sidebar-nav-icon" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {user?.email && <div className="sidebar-user" title={user.email}>{user.email}</div>}
          <button className="btn small" onClick={async ()=>{ await signOut(); closeSidebar() }}>Déconnexion</button>
        </div>
      </aside>
    </>
  )
}
