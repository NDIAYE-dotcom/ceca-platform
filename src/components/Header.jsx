import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'
import { useAuth } from '../context/AuthContext'

export default function Header(){
  const { user, signOut } = useAuth()
  const ref = useRef()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(()=>{
    function onScroll(){
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return ()=> window.removeEventListener('scroll', onScroll)
  },[])

  return (
    <header ref={ref} className={`site-header ${scrolled ? 'scrolled' : ''} ${menuOpen ? 'menu-open' : ''}`}>
      <div className="container header-inner">
        <div className="brand">
          <Link to="/">
            <img src="/logo-ceca m-02-01.png" alt="CECA-Solutions" className="site-logo" />
          </Link>
        </div>
        <button
          className="mobile-toggle show-on-mobile"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setMenuOpen(v => !v)}
        >
          <span aria-hidden>☰</span>
        </button>
        <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
          <button
            className="nav-close"
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
          <div className="nav-wrap">
            <Link to="/a-propos" className="nav-link highlight">À propos</Link>
            <Link to="/catalogue" className="nav-link highlight">Formations</Link>
            <Link to="/elearning/mp-101" className="nav-link">Espace e-learning</Link>
            {user ? (
              <>
                <span className="nav-user">{user.user_metadata?.name || user.email}</span>
                <button onClick={signOut} className="btn small nav-signout">Déconnexion</button>
              </>
            ) : null}
            <Link to="/admin" className="btn small nav-admin">Admin</Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
