import React, { useEffect } from 'react'
import './Lightbox.css'

export default function Lightbox({ src, alt, onClose }){
  useEffect(()=>{
    function onKey(e){ if(e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return ()=> document.removeEventListener('keydown', onKey)
  },[onClose])

  if(!src) return null

  return (
    <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lightbox-inner" onClick={(e)=>e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Fermer">×</button>
        <img src={src} alt={alt || 'image'} className="lightbox-image" />
      </div>
    </div>
  )
}
