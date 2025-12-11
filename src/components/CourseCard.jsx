import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useInView from '../hooks/useInView'

export default function CourseCard({course}){
  const [ref, inView] = useInView({once:true, threshold:0.12})
  const navigate = useNavigate()

  return (
    <div ref={ref} className={`course-card card ${inView ? 'slide-up' : ''}`}>
      <h3>{course.title}</h3>
      <p className="meta">{course.category} • {course.duration}</p>
      <p>{course.description}</p>
      <Link to={`/formation/${course.id}`} className="btn" onClick={(e)=>{ try{ /* explicit fallback */ navigate(`/formation/${course.id}`) }catch(_){ /* ignore */ } }}>
        Détails & Inscription
      </Link>
    </div>
  )
}
