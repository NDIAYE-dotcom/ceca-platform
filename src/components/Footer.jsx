import React from 'react'
import './Footer.css'

export default function Footer(){
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>© {new Date().getFullYear()} CECA-Solutions</div>
        <div>Keur Massar, Dakar — <a href="mailto:contact@ceca-solutions.africa">contact@ceca-solutions.africa</a></div>
      </div>
    </footer>
  )
}
