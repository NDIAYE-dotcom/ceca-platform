import React, {useState, useEffect} from 'react'
import { useParams } from 'react-router-dom'
import { getFormationById } from '../lib/formations'
import { generateCertificate } from '../utils/certificate'
import './Elearning.css'
import Classroom from '../components/Classroom'

export default function Elearning(){
  const {id} = useParams()
  const [course, setCourse] = useState(null)
  useEffect(()=>{ let mounted = true; (async ()=>{ const f = await getFormationById(id); if(mounted) setCourse(f) })(); return ()=>{ mounted = false } },[id])
  const [name, setName] = useState('Apprenant')
  const [progress, setProgress] = useState(0)
  const [quizPassed, setQuizPassed] = useState(false)

  useEffect(()=>{
    const saved = localStorage.getItem(`progress_${id}`)
    if(saved) setProgress(Number(saved))
  },[id])

  function handleSaveProgress(p){
    setProgress(p)
    localStorage.setItem(`progress_${id}`, String(p))
  }

  function handleGenerate(){
    const blob = generateCertificate({name, courseTitle: course.title, date: new Date().toLocaleDateString()})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `certificat-${course.id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if(course === null) return <div className="container">Chargement…</div>
  if(!course) return <div className="container">Formation introuvable</div>

  return (
    <section className="container elearning">
      <h1>E-learning — {course.title}</h1>
      <div className="elearn-grid">
        <div>
          <div className="video-wrap">
            <iframe title="video" width="100%" height="360" src="https://www.youtube.com/embed/s7gts7uj3IY" frameBorder="0" allowFullScreen></iframe>
          </div>

          <h3>Supports</h3>
          <a href={course.pdf} target="_blank" rel="noreferrer" className="btn secondary">Télécharger le PDF</a>

          {/* Salle de cours (classroom) */}
          <Classroom course={course} />

          <h3>Quiz de contrôle</h3>
          <div className="quiz">
            <p>Q1. Lequel n'est pas une étape de passation ?</p>
            <button onClick={()=>setQuizPassed(true)} className="btn">Réponse A (correcte)</button>
            <button className="btn secondary">Réponse B</button>
          </div>
        </div>

        <aside>
          <h4>Progression</h4>
          <input type="range" min="0" max="100" value={progress} onChange={e=>handleSaveProgress(Number(e.target.value))} />
          <div className="prog-num">{progress}%</div>

          <h4>Nom pour le certificat</h4>
          <input value={name} onChange={e=>setName(e.target.value)} />

          <div style={{marginTop:12}}>
            <button className="btn" onClick={handleGenerate} disabled={!quizPassed}>Générer le certificat PDF</button>
            {!quizPassed && <div className="note">Complétez le quiz pour activer le certificat.</div>}
            <div className="note" style={{marginTop:8}}>Remarque : la génération fonctionne localement sans connexion. La base de données sera reconnectée plus tard.</div>
          </div>
        </aside>
      </div>
    </section>
  )
}
