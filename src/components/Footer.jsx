import React from 'react'
import { FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa'
import './Footer.css'

export default function Footer(){
  const socials = [
    { name: 'Facebook', icon: FaFacebook, url: 'https://facebook.com/ceca-solutions' },
    { name: 'Instagram', icon: FaInstagram, url: 'https://instagram.com/ceca-solutions' },
    { name: 'LinkedIn', icon: FaLinkedin, url: 'https://linkedin.com/company/ceca-solutions' }
  ]

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-section footer-brand">
          <div className="footer-logo">CECA-Solutions</div>
          <p className="footer-tagline">Excellence en formation et consulting</p>
        </div>

        <div className="footer-section footer-links">
          <h4>Liens rapides</h4>
          <ul>
            <li><a href="/a-propos">À propos</a></li>
            <li><a href="/catalogue">Formations</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        <div className="footer-section footer-contact">
          <h4>Contact</h4>
          <p>📍 Keur Massar, Dakar, Sénégal</p>
          <p><a href="mailto:contact@ceca-solutions.africa">📧 contact@ceca-solutions.africa</a></p>
          <div className="footer-socials">
            {socials.map(s => {
              const Icon = s.icon
              return (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="social-icon" title={s.name}>
                  <Icon />
                </a>
              )
            })}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} CECA-Solutions. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
