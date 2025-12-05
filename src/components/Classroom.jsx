import React, {useState} from 'react'
import './Classroom.css'

export default function Classroom({course}){
  const [tab, setTab] = useState('discussion')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {id:1, user:'Formateur', text:'Bienvenue dans la salle de cours !'},
    {id:2, user:'Apprenant A', text:'Bonjour à tous.'}
  ])

  const participants = [
    {id:1, name:'Dr. A. Ndiaye'},
    {id:2, name:'Mme. S. Diop'},
    {id:3, name:'M. K. Fall'}
  ]

  function sendMessage(){
    if(!message.trim()) return
    const next = {id: Date.now(), user:'Vous', text: message}
    setMessages(prev=>[...prev, next])
    setMessage('')
  }

  return (
    <section className="classroom card">
      <div className="classroom-header">
        <h3>Salle de cours — {course?.title}</h3>
        <div>
          <button className="btn">Rejoindre le live</button>
        </div>
      </div>

      <div className="classroom-tabs">
        <button className={`tab-btn ${tab==='discussion'? 'active':''}`} onClick={()=>setTab('discussion')}>Discussion</button>
        <button className={`tab-btn ${tab==='participants'? 'active':''}`} onClick={()=>setTab('participants')}>Participants</button>
        <button className={`tab-btn ${tab==='materials'? 'active':''}`} onClick={()=>setTab('materials')}>Matériel</button>
      </div>

      <div className="classroom-body">
        {tab==='discussion' && (
          <div className="discussion">
            <div className="messages">
              {messages.map(m=> (
                <div className="message" key={m.id}><strong>{m.user}:</strong> {m.text}</div>
              ))}
            </div>
            <div className="composer">
              <input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Écrire un message..." />
              <button className="btn" onClick={sendMessage}>Envoyer</button>
            </div>
          </div>
        )}

        {tab==='participants' && (
          <div className="participants">
            {participants.map(p=> (
              <div className="participant" key={p.id}>{p.name}</div>
            ))}
          </div>
        )}

        {tab==='materials' && (
          <div className="materials">
            <ul>
              <li><a href={course?.pdf || '#'} target="_blank" rel="noreferrer">Support PDF du cours</a></li>
              <li><a href="#">Slides (placeholder)</a></li>
              <li><a href="#">Exercices (placeholder)</a></li>
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
