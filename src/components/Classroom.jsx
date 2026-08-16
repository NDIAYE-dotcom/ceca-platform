import React, { useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseEnabled } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './Classroom.css'

function initials(name){
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if(!parts.length) return '?'
  return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('')
}

function formatLiveDate(iso){
  if(!iso) return ''
  try{
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
  }catch(e){ return '' }
}

export default function Classroom({course}){
  const { user } = useAuth()
  const [tab, setTab] = useState('discussion')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [sending, setSending] = useState(false)
  const [participants, setParticipants] = useState([])
  const [loadingParticipants, setLoadingParticipants] = useState(true)
  const messagesEndRef = useRef(null)

  const displayName = user?.full_name || user?.email || 'Vous'

  useEffect(()=>{
    if(!course?.id || !isSupabaseEnabled) { setLoadingMessages(false); return }
    let mounted = true

    async function load(){
      const { data, error } = await supabase
        .from('classroom_messages')
        .select('*')
        .eq('formation_id', course.id)
        .order('created_at', { ascending: true })
        .limit(200)
      if(mounted){
        if(!error && Array.isArray(data)) setMessages(data)
        setLoadingMessages(false)
      }
    }
    load()

    let channel
    try{
      channel = supabase.channel(`classroom:${course.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'classroom_messages', filter: `formation_id=eq.${course.id}` }, (p) => {
          const row = p?.new
          if(row) setMessages(prev => prev.some(m => m.id === row.id) ? prev : [...prev, row])
        })
        .subscribe()
    }catch(e){ console.warn('classroom realtime subscribe failed', e) }

    return ()=>{ mounted = false; if(channel) try{ supabase.removeChannel(channel) }catch(e){} }
  }, [course?.id])

  useEffect(()=>{
    messagesEndRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  useEffect(()=>{
    if(!course?.id || !isSupabaseEnabled) { setLoadingParticipants(false); return }
    let mounted = true
    ;(async ()=>{
      const { data, error } = await supabase.rpc('classroom_participant_names', { p_formation_id: course.id })
      if(mounted){
        if(!error && Array.isArray(data)) setParticipants(data.map(r => r.name).filter(Boolean))
        setLoadingParticipants(false)
      }
    })()
    return ()=>{ mounted = false }
  }, [course?.id])

  async function sendMessage(e){
    e?.preventDefault()
    const text = message.trim()
    if(!text || !course?.id || !user?.email || sending) return
    setSending(true)
    const { data, error } = await supabase
      .from('classroom_messages')
      .insert([{ formation_id: course.id, author_name: displayName, author_email: user.email, message: text }])
      .select()
      .maybeSingle()
    setSending(false)
    if(error){
      console.warn('send classroom message failed', error)
      return
    }
    setMessage('')
    // The realtime subscription will usually deliver this back, but adding it
    // immediately keeps the sender's own UI from waiting on that round trip.
    if(data) setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data])
  }

  const liveDate = formatLiveDate(course?.live_session_at)
  const hasLive = Boolean(course?.live_session_url)

  return (
    <section className="classroom card">
      <div className="classroom-header">
        <h3>Salle de cours — {course?.title}</h3>
        {hasLive ? (
          <a className="btn" href={course.live_session_url} target="_blank" rel="noreferrer">Rejoindre le live</a>
        ) : (
          <span className="classroom-no-live">Aucun live programmé</span>
        )}
      </div>
      {hasLive && liveDate && <p className="classroom-live-date">📅 Prochaine session : {liveDate}</p>}

      <div className="classroom-tabs">
        <button className={`tab-btn ${tab==='discussion'? 'active':''}`} onClick={()=>setTab('discussion')}>Discussion</button>
        <button className={`tab-btn ${tab==='participants'? 'active':''}`} onClick={()=>setTab('participants')}>Participants{participants.length > 0 ? ` (${participants.length})` : ''}</button>
        <button className={`tab-btn ${tab==='materials'? 'active':''}`} onClick={()=>setTab('materials')}>Matériel</button>
      </div>

      <div className="classroom-body">
        {tab==='discussion' && (
          <div className="discussion">
            <div className="messages">
              {loadingMessages && <p className="muted">Chargement des messages…</p>}
              {!loadingMessages && messages.length === 0 && <p className="muted">Aucun message pour le moment — lancez la discussion !</p>}
              {messages.map(m=> (
                <div className={`message ${m.author_email === user?.email ? 'message--own' : ''}`} key={m.id}>
                  <strong>{m.author_name}:</strong> {m.message}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form className="composer" onSubmit={sendMessage}>
              <input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Écrire un message..." aria-label="Écrire un message" />
              <button className="btn" type="submit" disabled={sending || !message.trim()}>Envoyer</button>
            </form>
          </div>
        )}

        {tab==='participants' && (
          <div className="participants">
            {loadingParticipants && <p className="muted">Chargement…</p>}
            {!loadingParticipants && participants.length === 0 && <p className="muted">Aucun participant pour le moment.</p>}
            {participants.map((name, i)=> (
              <div className="participant" key={`${name}-${i}`}>
                <span className="participant-avatar" aria-hidden="true">{initials(name)}</span>
                {name}
              </div>
            ))}
          </div>
        )}

        {tab==='materials' && (
          <div className="materials">
            {course?.pdf ? (
              <ul>
                <li><a href={course.pdf} target="_blank" rel="noreferrer">Support PDF du cours</a></li>
              </ul>
            ) : (
              <p className="muted">Aucun support disponible pour le moment.</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
