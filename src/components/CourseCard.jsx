import React from 'react'
import { Link } from 'react-router-dom'
import useInView from '../hooks/useInView'
import FormationIcon, { getIconKey } from './FormationIcon'
import { formatDateRange } from '../utils/dates'
import './CourseCard.css'

export default function CourseCard({course}){
  const [ref, inView] = useInView({once:true, threshold:0.12})
  const iconKey = course.icon || getIconKey(course)
  const dateRange = formatDateRange(course.start_date, course.end_date)

  return (
    <article ref={ref} className={`formation-card ${inView ? 'in-view' : ''} accent-${course.accent || 'blue'}`}>
      <div className="fc-top">
        <div className="fc-icon" aria-hidden="true">
          <FormationIcon iconKey={iconKey} />
        </div>
        {course.category && <span className="fc-pill">{course.category}</span>}
      </div>

      <h3>{course.title}</h3>

      {course.target && <p className="fc-target">{course.target}</p>}

      <div className="fc-meta">
        {course.duration && <span className="fc-chip">⏱ {course.duration}</span>}
        {dateRange && <span className="fc-chip fc-chip--accent">📅 {dateRange}</span>}
      </div>

      <Link to={`/formation/${course.id}`} className="fc-cta">
        Détails & inscription
        <span className="fc-cta-arrow" aria-hidden="true">→</span>
      </Link>
    </article>
  )
}
