import { useEffect, useRef, useState } from 'react'

export default function useInView(options = {}){
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(()=>{
    const el = ref.current
    if(!el) return
    const observer = new IntersectionObserver((entries)=>{
      entries.forEach(entry => {
        if(entry.isIntersecting){
          setInView(true)
          if(options.once) observer.unobserve(el)
        }
      })
    }, { threshold: options.threshold ?? 0.2 })

    observer.observe(el)
    return ()=> observer.disconnect()
  }, [ref.current])

  return [ref, inView]
}
