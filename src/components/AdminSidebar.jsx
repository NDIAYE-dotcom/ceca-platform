import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './AdminSidebar.css'
import { useAuth } from '../context/AuthContext'

export default function AdminSidebar(){
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)

  function openSidebar(){ setOpen(true) }
  function closeSidebar(){ setOpen(false) }

  return (
    <>
      <button className="sidebar-toggle" aria-label="Ouvrir le menu" onClick={openSidebar}>☰</button>
      <div className={"sidebar-overlay " + (open ? 'show' : '')} onClick={closeSidebar} />
      <aside className={"admin-sidebar " + (open ? 'open' : '')} aria-hidden={!open && window.innerWidth < 900}>
        <div className="sidebar-brand">
          <strong>CECA</strong>
          <small>Admin</small>
          <button className="sidebar-close" onClick={closeSidebar} aria-label="Fermer">×</button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li><Link to="/admin" onClick={closeSidebar}>Tableau de bord</Link></li>
            <li><Link to="/admin/formations" onClick={closeSidebar}>Formations</Link></li>
            <li><Link to="/admin/apprenants" onClick={closeSidebar}>Apprenants</Link></li>
            <li><Link to="/admin/certificats" onClick={closeSidebar}>Certificats</Link></li>
            <li><Link to="/admin/instructeurs" onClick={closeSidebar}>Instructeurs</Link></li>
            <li><Link to="/admin/parametres" onClick={closeSidebar}>Paramètres</Link></li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="btn small" onClick={async ()=>{ await signOut(); closeSidebar() }}>Déconnexion</button>
        </div>
      </aside>
    </>
  )
}
