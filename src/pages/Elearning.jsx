import React, {useState, useEffect, useRef} from 'react'
import { useParams, Link } from 'react-router-dom'
import { getFormationById } from '../lib/formations'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseEnabled } from '../lib/supabase'
import './Elearning.css'
import Classroom from '../components/Classroom'

const REGISTRATIONS_TABLE = import.meta.env.VITE_REGISTRATIONS_TABLE || 'registrations'
const YT_VIDEO_ID = 's7gts7uj3IY'

// Loads the YouTube IFrame API once, sharing it across mounts — the global
// onYouTubeIframeAPIReady callback can only be assigned once, so later
// callers just wait on the same promise instead of clobbering it.
let ytApiPromise = null
function loadYouTubeApi(){
  if(window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if(ytApiPromise) return ytApiPromise
  ytApiPromise = new Promise(resolve => {
    const prevCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if(typeof prevCallback === 'function') prevCallback()
      resolve(window.YT)
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return ytApiPromise
}

export default function Elearning(){
  const {id} = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState(null)
  useEffect(()=>{ let mounted = true; (async ()=>{ const f = await getFormationById(id); if(mounted) setCourse(f) })(); return ()=>{ mounted = false } },[id])

  // Being logged in as a learner only proves identity, not that this specific
  // course was purchased/registered for — check the registrations table
  // (matched by email, since that's what the registration form captures)
  // before letting a learner into a course they never signed up for.
  const [enrollment, setEnrollment] = useState('checking') // 'checking' | 'allowed' | 'denied'
  useEffect(()=>{
    let mounted = true
    async function checkEnrollment(){
      if(!id) return
      if(user?.role === 'admin' || user?.role === 'instructor'){ if(mounted) setEnrollment('allowed'); return }
      if(!isSupabaseEnabled || !user?.email){ if(mounted) setEnrollment('allowed'); return }
      try{
        const { data, error } = await supabase.from(REGISTRATIONS_TABLE).select('id').eq('formation_id', id).ilike('email', user.email).limit(1)
        if(!mounted) return
        setEnrollment(!error && Array.isArray(data) && data.length > 0 ? 'allowed' : 'denied')
      }catch(e){
        if(mounted) setEnrollment('denied')
      }
    }
    checkEnrollment()
    return ()=>{ mounted = false }
  },[id, user?.email, user?.role])

  const [name, setName] = useState('Apprenant')
  const [videoWatched, setVideoWatched] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizPassed, setQuizPassed] = useState(false)
  const [quizScore, setQuizScore] = useState(null)
  const [loadingProgress, setLoadingProgress] = useState(true)
  const playerRef = useRef(null)

  const quiz = Array.isArray(course?.quiz) ? course.quiz : []
  const hasQuiz = quiz.length > 0

  // Load whatever progress this learner already has for this course, so it
  // persists across sessions/devices instead of resetting every visit.
  useEffect(()=>{
    if(!id || !isSupabaseEnabled || !user?.email){ setLoadingProgress(false); return }
    let mounted = true
    ;(async ()=>{
      const { data } = await supabase.from('learning_progress').select('*').eq('formation_id', id).ilike('email', user.email).maybeSingle()
      if(!mounted) return
      if(data){
        setVideoWatched(Boolean(data.video_watched))
        setQuizPassed(Boolean(data.quiz_passed))
        setQuizScore(typeof data.quiz_score === 'number' ? data.quiz_score : null)
        if(data.quiz_passed) setQuizSubmitted(true)
      }
      setLoadingProgress(false)
    })()
    return ()=>{ mounted = false }
  },[id, user?.email])

  async function persistProgress(patch){
    if(!id || !isSupabaseEnabled || !user?.email) return
    try{
      await supabase.from('learning_progress').upsert({ formation_id: id, email: user.email, ...patch }, { onConflict: 'formation_id,email' })
    }catch(e){ console.warn('persist progress failed', e) }
  }

  // Real "watched" signal from the actual YouTube player, not self-reported —
  // marks it once the learner reaches the end of the video.
  useEffect(()=>{
    if(videoWatched) return
    let mounted = true
    let player = null
    loadYouTubeApi().then(YT => {
      if(!mounted || !document.getElementById('yt-player')) return
      player = new YT.Player('yt-player', {
        events: {
          onStateChange: (e) => {
            if(e.data === YT.PlayerState.ENDED){
              setVideoWatched(true)
              persistProgress({ video_watched: true })
            }
          }
        }
      })
      playerRef.current = player
    })
    return ()=>{ mounted = false }
  },[id])

  function selectAnswer(qIndex, optIndex){
    if(quizPassed) return
    setQuizAnswers(prev => ({ ...prev, [qIndex]: optIndex }))
  }

  function submitQuiz(){
    if(!hasQuiz) return
    const total = quiz.length
    let correct = 0
    quiz.forEach((q, i) => { if(quizAnswers[i] === q.correct) correct += 1 })
    const passed = correct === total
    setQuizScore(correct)
    setQuizSubmitted(true)
    setQuizPassed(passed)
    persistProgress({ quiz_passed: passed, quiz_score: correct })
  }

  function retryQuiz(){
    setQuizAnswers({})
    setQuizSubmitted(false)
    setQuizPassed(false)
    setQuizScore(null)
  }

  // jsPDF (plus its unused-but-bundled html2canvas dependency) is only
  // needed for this one button — loading it dynamically instead of at the
  // top of the file keeps it out of the page's initial JS download for the
  // far more common case of someone just watching the video without ever
  // generating a certificate.
  async function handleGenerate(){
    const { generateCertificate } = await import('../utils/certificate')
    const blob = generateCertificate({name, courseTitle: course.title, date: new Date().toLocaleDateString()})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `certificat-${course.id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if(course === null || enrollment === 'checking') return <div className="container">Chargement…</div>
  if(!course) return <div className="container">Formation introuvable</div>
  if(enrollment === 'denied') return (
    <div className="container elearning">
      <h1>Accès non autorisé</h1>
      <p className="muted">Vous n'êtes pas inscrit(e) à la formation « {course.title} ». Contactez l'administration si vous pensez qu'il s'agit d'une erreur.</p>
      <Link to="/elearning" className="btn">Retour à l'Espace e-learning</Link>
    </div>
  )

  const canCertify = hasQuiz ? quizPassed : videoWatched
  const progress = hasQuiz
    ? Math.round((videoWatched ? 50 : 0) + (quizPassed ? 50 : 0))
    : Math.round(videoWatched ? 100 : 0)

  return (
    <section className="container elearning">
      <h1>E-learning — {course.title}</h1>
      <div className="elearn-grid">
        <div>
          <div className="video-wrap">
            <iframe
              id="yt-player"
              title="video"
              width="100%"
              height="360"
              src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?enablejsapi=1`}
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
          {videoWatched && <p className="video-watched-note">✓ Vidéo visionnée</p>}

          <h3>Supports</h3>
          {course.pdf_url ? (
            <a href={course.pdf_url} target="_blank" rel="noreferrer" download className="btn secondary">Télécharger le PDF</a>
          ) : (
            <p className="note">Aucun support PDF disponible pour le moment.</p>
          )}

          {/* Salle de cours (classroom) */}
          <Classroom course={course} />

          <h3>Quiz de contrôle</h3>
          {!hasQuiz && <p className="note">Aucun quiz n'est configuré pour cette formation pour le moment.</p>}
          {hasQuiz && (
            <div className="quiz">
              {quiz.map((q, qi) => (
                <div className="quiz-question" key={qi}>
                  <p className="quiz-question-text">Q{qi + 1}. {q.question}</p>
                  <div className="quiz-options">
                    {q.options.map((opt, oi) => {
                      const isSelected = quizAnswers[qi] === oi
                      const showResult = quizSubmitted
                      const isCorrectOpt = oi === q.correct
                      let cls = 'quiz-option'
                      if(isSelected) cls += ' quiz-option--selected'
                      if(showResult && isCorrectOpt) cls += ' quiz-option--correct'
                      else if(showResult && isSelected && !isCorrectOpt) cls += ' quiz-option--wrong'
                      return (
                        <button
                          type="button"
                          key={oi}
                          className={cls}
                          onClick={()=>selectAnswer(qi, oi)}
                          disabled={quizPassed}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {!quizPassed && (
                <button
                  className="btn"
                  onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length < quiz.length}
                >
                  Valider le quiz
                </button>
              )}

              {quizSubmitted && (
                <div className={`quiz-result ${quizPassed ? 'quiz-result--pass' : 'quiz-result--fail'}`}>
                  {quizPassed
                    ? `✓ Quiz réussi (${quizScore}/${quiz.length})`
                    : `${quizScore}/${quiz.length} bonnes réponses — réessayez pour valider le quiz.`}
                  {!quizPassed && <button type="button" className="quiz-retry-btn" onClick={retryQuiz}>Recommencer</button>}
                </div>
              )}
            </div>
          )}
        </div>

        <aside>
          <h4>Progression</h4>
          {loadingProgress ? (
            <p className="muted">Chargement…</p>
          ) : (
            <>
              <div className="progress-track"><div className="progress-fill" style={{width: `${progress}%`}} /></div>
              <div className="prog-num">{progress}%</div>
              <ul className="progress-checklist">
                <li className={videoWatched ? 'done' : ''}>{videoWatched ? '✓' : '○'} Vidéo visionnée</li>
                {hasQuiz && <li className={quizPassed ? 'done' : ''}>{quizPassed ? '✓' : '○'} Quiz réussi</li>}
              </ul>
            </>
          )}

          <h4>Nom pour le certificat</h4>
          <input value={name} onChange={e=>setName(e.target.value)} />

          <div style={{marginTop:12}}>
            <button className="btn" onClick={handleGenerate} disabled={!canCertify}>Générer le certificat PDF</button>
            {!canCertify && <div className="note">{hasQuiz ? 'Réussissez le quiz pour activer le certificat.' : 'Terminez la vidéo pour activer le certificat.'}</div>}
          </div>
        </aside>
      </div>
    </section>
  )
}
