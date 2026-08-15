import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useEscapeKey from '../../hooks/useEscapeKey'
import '../../pages/Admin.css'
import './MessagesAdmin.css'

export default function MessagesAdmin(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  useEscapeKey(()=>setSelected(null), Boolean(selected))

  async function load(){
    setLoading(true)
    setErrorMsg(null)
    try{
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false })
      if(error) throw error
      setItems(data || [])
    }catch(e){
      console.warn('Messages fetch failed', e)
      setErrorMsg("Impossible de charger les messages (la table 'messages' existe-t-elle bien dans Supabase ?)")
    }
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  useEffect(()=>{
    let channel
    try{
      channel = supabase.channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => {
          const r = p?.new
          if(!r) return
          setItems(prev => prev ? [r, ...prev] : [r])
        })
        .subscribe()
    }catch(e){ console.warn('realtime subscribe failed', e) }
    return ()=>{ try{ if(channel) supabase.removeChannel(channel) }catch(e){} }
  }, [])

  async function handleDelete(id){
    if(!window.confirm('Supprimer ce message ?')) return
    setDeletingId(id)
    try{
      const { error } = await supabase.from('messages').delete().eq('id', id)
      if(error) throw error
      setItems(prev => prev.filter(m => m.id !== id))
      if(selected?.id === id) setSelected(null)
    }catch(e){
      console.warn('Message delete failed', e)
      alert("Échec de la suppression : " + (e?.message || String(e)))
    }
    setDeletingId(null)
  }

  const filtered = useMemo(()=>{
    const q = query.trim().toLowerCase()
    if(!q) return items
    return items.filter(m => (
      String(m.name || '').toLowerCase().includes(q) ||
      String(m.email || '').toLowerCase().includes(q) ||
      String(m.subject || '').toLowerCase().includes(q) ||
      String(m.message || '').toLowerCase().includes(q) ||
      String(m.organisation || '').toLowerCase().includes(q)
    ))
  }, [items, query])

  if(loading) return <div className="admin-panel">Chargement des messages…</div>

  return (
    <div className="messages-admin">
      <div className="fa-header">
        <div>
          <h2>Messages</h2>
          <p className="muted">{filtered.length} sur {items.length} message{items.length > 1 ? 's' : ''}</p>
        </div>
        <div className="apprenants-toolbar">
          <input
            type="search"
            className="apprenants-search"
            placeholder="Rechercher (nom, email, sujet…)"
            value={query}
            onChange={e=>setQuery(e.target.value)}
          />
          <button className="admin-btn admin-btn-view" onClick={load}>Rafraîchir</button>
        </div>
      </div>

      {errorMsg && <div className="admin-error-banner">{errorMsg}</div>}

      {filtered.length === 0 && !errorMsg && (
        <div className="admin-empty-state">
          <div className="admin-empty-icon" aria-hidden="true">✉️</div>
          <p><strong>{items.length === 0 ? 'Aucun message reçu pour le moment' : 'Aucun résultat pour cette recherche'}</strong></p>
        </div>
      )}

      <div className="message-list">
        {filtered.map(m => (
          <div
            key={m.id}
            className="message-row"
            onClick={()=>setSelected(m)}
            role="button"
            tabIndex={0}
            onKeyDown={(e)=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); setSelected(m) } }}
          >
            <div className="message-row-main">
              <div className="message-row-top">
                <span className="message-name">{m.name}</span>
                <span className="message-date">{m.created_at ? new Date(m.created_at).toLocaleString('fr-FR') : '—'}</span>
              </div>
              <div className="message-subject">{m.subject || m.topic || 'Sans sujet'}</div>
              <div className="message-preview">{m.message}</div>
            </div>
            <div className="message-row-actions" onClick={e=>e.stopPropagation()}>
              <a className="admin-btn admin-btn-view" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Votre message'))}`}>Répondre</a>
              <button className="admin-btn admin-btn-delete" disabled={deletingId===m.id} onClick={()=>handleDelete(m.id)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={()=>setSelected(null)}>
          <div className="modal-card" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <h3>{selected.subject || selected.topic || 'Message'}</h3>
              <button className="admin-btn admin-btn-view" onClick={()=>setSelected(null)}>Fermer</button>
            </div>
            <div className="message-detail-meta">
              <p><strong>{selected.name}</strong> · {selected.email}</p>
              {selected.organisation && <p className="muted">{selected.organisation}</p>}
              {selected.topic && <p className="muted">Thème : {selected.topic}</p>}
              <p className="muted">{selected.created_at ? new Date(selected.created_at).toLocaleString('fr-FR') : ''}</p>
            </div>
            <p className="message-detail-body">{selected.message}</p>
            <div className="fa-modal-actions">
              <a className="btn" href={`mailto:${selected.email}?subject=${encodeURIComponent('Re: ' + (selected.subject || 'Votre message'))}`}>Répondre par email</a>
              <button className="btn secondary" onClick={()=>setSelected(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
