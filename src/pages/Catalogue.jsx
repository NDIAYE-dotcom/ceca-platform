import React, {useState, useEffect} from 'react'
import { Link } from 'react-router-dom'
import { getFormations } from '../lib/formations'
import './Catalogue.css'
import CourseCard from '../components/CourseCard'
import Lightbox from '../components/Lightbox'

export default function Catalogue(){
  const [filter, setFilter] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const [courses, setCourses] = useState([])
  useEffect(()=>{ let mounted = true; (async ()=>{ const data = await getFormations(); if(mounted) setCourses(data) })(); return ()=>{ mounted = false } },[])
  const cats = Array.from(new Set(courses.map(c=>c.category)))
  const list = filter ? courses.filter(c=>c.category===filter) : courses
  return (
    <section className="catalogue container">
      <h1>Catalogue des formations</h1>
      <div className="formation-gallery">
        <div className="gallery-grid">
          <div className="gallery-item"><img src="/Form-ceca1-01.png" alt="formation 1" loading="lazy" decoding="async" onClick={()=>setLightbox('/Form-ceca1-01.png')} /></div>
          <div className="gallery-item"><img src="/Form-ceca2-01.png" alt="formation 2" loading="lazy" decoding="async" onClick={()=>setLightbox('/Form-ceca2-01.png')} /></div>
          <div className="gallery-item"><img src="/Form-ceca3-01.png" alt="formation 3" loading="lazy" decoding="async" onClick={()=>setLightbox('/Form-ceca3-01.png')} /></div>
          <div className="gallery-item"><img src="/Form-ceca4-01.png" alt="formation 4" loading="lazy" decoding="async" onClick={()=>setLightbox('/Form-ceca4-01.png')} /></div>
          <div className="gallery-item big"><img src="/Form-ceca-01.png" alt="formation main" loading="lazy" decoding="async" onClick={()=>setLightbox('/Form-ceca-01.png')} /></div>
        </div>
      </div>
      
      <div className="filters">
        <select value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="">Tous les thèmes</option>
          {cats.map(c=> <option value={c} key={c}>{c}</option>)}
        </select>
      </div>
      <div className="courses-grid">
        {list.map(c=> (
          <CourseCard course={c} key={c.id} />
        ))}
      </div>

      <Lightbox src={lightbox} alt="gallery" onClose={()=>setLightbox(null)} />
    </section>
  )
}
