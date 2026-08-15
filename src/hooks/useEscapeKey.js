import { useEffect } from 'react'

// Lets a modal/dialog close on Escape — the one keyboard affordance every
// admin modal in this app was missing (mouse-only close via backdrop click
// or an explicit "Fermer" button).
export default function useEscapeKey(onClose, active = true){
  useEffect(()=>{
    if(!active) return
    function onKey(e){ if(e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return ()=> document.removeEventListener('keydown', onKey)
  },[onClose, active])
}
