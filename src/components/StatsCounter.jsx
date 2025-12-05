import React, {useEffect, useRef, useState} from 'react'
import useInView from '../hooks/useInView'

function formatNumber(n){
  try{ return n.toLocaleString('fr-FR') }catch(e){ return String(n) }
}

export default function StatsCounter({end=0,label='',duration=1400,plus=true}){
  const [value,setValue] = useState(0)
  const rafRef = useRef()
  const startRef = useRef()
  const [ref, inView] = useInView({once:true, threshold: 0.25})

  useEffect(()=>{
    if(!inView) return
    let cancelled = false
    function step(ts){
      if(!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current)/duration, 1)
      const current = Math.floor(progress * end)
      setValue(current)
      if(progress < 1 && !cancelled){
        rafRef.current = requestAnimationFrame(step)
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return ()=>{ cancelled = true; if(rafRef.current) cancelAnimationFrame(rafRef.current) }
  },[end,duration,inView])

  return (
    <div ref={ref} className="stat-card card">
      <div className="stat-number">{plus ? '+' : ''}{formatNumber(value)}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
