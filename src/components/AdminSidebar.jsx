import React from 'react'
import { Link } from 'react-router-dom'
import './AdminSidebar.css'

export default function AdminSidebar(){
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <strong>CECA</strong>
        <small>Admin</small>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li><Link to="/admin">Tableau de bord</Link></li>
          <li><Link to="/admin/formations">Formations</Link></li>
          <li><Link to="/admin/apprenants">Apprenants</Link></li>
          <li><Link to="/admin/certificats">Certificats</Link></li>
          <li><Link to="/admin/instructeurs">Instructeurs</Link></li>
          <li><Link to="/admin/parametres">Paramètres</Link></li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="btn small">Déconnexion</button>
      </div>
    </aside>
  )
}
