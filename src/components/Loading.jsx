import React from 'react'
import './Loading.css'

export default function Loading({size = 84, text = 'Chargement...'}){
  return (
    <div className="loading-root" role="status" aria-live="polite">
      <div className="loading-wrap">
        <svg className="loader" width={size} height={size} viewBox="0 0 48 48" aria-hidden>
          <defs>
            <linearGradient id="g1" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#0b3d91" />
              <stop offset="100%" stopColor="#41a6ff" />
            </linearGradient>
          </defs>
          <circle className="ring" cx="24" cy="24" r="18" stroke="url(#g1)" strokeWidth="4" fill="none" opacity="0.12" />
          <g className="orbit">
            <path className="orb" d="M24 6 A18 18 0 0 1 42 24" stroke="url(#g1)" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        </svg>

        <div className="loading-texts">
          <div className="loading-title">{text}</div>
          <div className="loading-sub">Préparation de votre espace, un instant svp.</div>
        </div>
      </div>
    </div>
  )
}
