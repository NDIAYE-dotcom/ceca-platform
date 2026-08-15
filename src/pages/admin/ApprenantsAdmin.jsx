import React, { useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseEnabled } from '../../lib/supabase'
import '../../pages/Admin.css'
import './ApprenantsAdmin.css'

// Use env var to pick the registrations table name; defaults to plural 'registrations'
const TABLE_NAME = (import.meta.env.VITE_REGISTRATIONS_TABLE || 'registrations')

function initialsOf(name){
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if(!parts.length) return '?'
  return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('')
}

export default function ApprenantsAdmin(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [query, setQuery] = useState('')
  const [accessState, setAccessState] = useState({}) // id -> 'sending' | 'done' | 'error'
  const [accessMsg, setAccessMsg] = useState({}) // id -> message shown after the attempt
  const [accessLink, setAccessLink] = useState({}) // id -> access link, shown when the email couldn't be sent

  async function load(){
    setLoading(true)
    setErrorMsg(null)
    try{
      if(isSupabaseEnabled){
        const res = await supabase.from(TABLE_NAME).select('*').order('created_at', { ascending: false })
        if(res?.error){
          setErrorMsg(res.error.message || String(res.error))
        } else if(Array.isArray(res?.data)){
          setItems(res.data); setLoading(false); return
        }
      }
    }catch(e){ setErrorMsg(String(e)) }

    try{
      const raw = localStorage.getItem('ceca_registrations')
      const arr = raw ? JSON.parse(raw) : []
      setItems(Array.isArray(arr) ? arr : [])
    }catch(e){ setItems([]) }

    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  useEffect(()=>{
    if(!isSupabaseEnabled) return
    const channels = []
    try{
      channels.push(
        supabase.channel(`public:${TABLE_NAME}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLE_NAME }, (p) => {
            const r = p?.new ?? p?.record
            if(!r) return
            setItems(prev => prev ? [r, ...prev] : [r])
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: TABLE_NAME }, (p) => {
            const old = p?.old ?? p?.record
            if(!old?.id) return
            setItems(prev => (prev || []).filter(r => r.id !== old.id))
          })
          .subscribe()
      )
    }catch(e){ console.warn('realtime subscribe failed', e) }

    return ()=>{ try{ for(const c of channels) supabase.removeChannel(c) }catch(e){} }
  }, [isSupabaseEnabled])

  async function handleDelete(id){
    if(!window.confirm('Supprimer définitivement cette inscription ?')) return
    setErrorMsg(null)
    setDeletingId(id)
    try{
      if(isSupabaseEnabled){
        const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id)
        if(error) throw error
        setItems(prev => (prev || []).filter(r => r.id !== id))
        setDeletingId(null)
        return
      }
    }catch(e){
      console.warn('Supabase delete failed', e)
      setErrorMsg("Échec de la suppression sur le serveur : " + (e?.message || String(e)))
      setDeletingId(null)
      return
    }

    // Supabase not configured: fall back to removing from the local list only.
    setItems(prev => (prev || []).filter(r => r.id !== id))
    setDeletingId(null)
  }

  async function handleCreateAccess(it){
    setAccessState(s => ({ ...s, [it.id]: 'sending' }))
    setAccessMsg(s => ({ ...s, [it.id]: null }))
    setAccessLink(s => ({ ...s, [it.id]: null }))
    try{
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if(!accessToken){
        setAccessState(s => ({ ...s, [it.id]: 'error' }))
        setAccessMsg(s => ({ ...s, [it.id]: 'Session expirée — reconnectez-vous.' }))
        return
      }
      const resp = await fetch('/api/create-learner-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ email: it.email, name: it.name, redirectTo: `${window.location.origin}/set-password` })
      })
      const data = await resp.json().catch(()=>null)
      if(!resp.ok || data?.ok === false){
        setAccessState(s => ({ ...s, [it.id]: 'error' }))
        setAccessMsg(s => ({ ...s, [it.id]: data?.error || 'Échec de la création de l’accès.' }))
        return
      }
      setAccessState(s => ({ ...s, [it.id]: 'done' }))
      if(data?.delivered){
        setAccessMsg(s => ({ ...s, [it.id]: 'Email envoyé avec le lien d’accès.' }))
      } else if(data?.link){
        setAccessMsg(s => ({ ...s, [it.id]: 'Email non envoyé — copiez le lien ci-dessous pour le lui transmettre.' }))
        setAccessLink(s => ({ ...s, [it.id]: data.link }))
      } else {
        setAccessMsg(s => ({ ...s, [it.id]: 'Accès créé.' }))
      }
    }catch(e){
      setAccessState(s => ({ ...s, [it.id]: 'error' }))
      setAccessMsg(s => ({ ...s, [it.id]: String(e?.message || e) }))
    }
  }

  async function copyAccessLink(id, link){
    try{
      await navigator.clipboard.writeText(link)
      setAccessMsg(s => ({ ...s, [id]: 'Lien copié dans le presse-papiers.' }))
    }catch(e){
      setAccessMsg(s => ({ ...s, [id]: "Impossible de copier automatiquement — sélectionnez le lien manuellement." }))
    }
  }

  function downloadCSV(){
    if(!items || items.length === 0) return
    const cols = ['id','formation_id','formation_title','name','email','phone','organization','payment_method','notes','created_at']
    const csv = [cols.join(',')].concat(items.map(it => cols.map(c => `"${(it[c]||'').toString().replace(/"/g,'""')}"`).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'ceca_registrations.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const filtered = useMemo(()=>{
    const q = query.trim().toLowerCase()
    if(!q) return items || []
    return (items || []).filter(it => (
      String(it.name || '').toLowerCase().includes(q) ||
      String(it.email || '').toLowerCase().includes(q) ||
      String(it.formation_title || '').toLowerCase().includes(q) ||
      String(it.organization || '').toLowerCase().includes(q)
    ))
  }, [items, query])

  if(loading) return <div className="admin-panel">Chargement des apprenants…</div>

  return (
    <div className="apprenants-admin">
      <div className="fa-header">
        <div>
          <h2>Apprenants</h2>
          <p className="muted">{filtered.length} sur {items.length} inscription{items.length > 1 ? 's' : ''}</p>
        </div>
        <div className="apprenants-toolbar">
          <input
            type="search"
            className="apprenants-search"
            placeholder="Rechercher (nom, email, formation…)"
            value={query}
            onChange={e=>setQuery(e.target.value)}
          />
          <button className="admin-btn admin-btn-view" onClick={load}>Rafraîchir</button>
          <button className="admin-btn admin-btn-edit" onClick={downloadCSV} disabled={!items.length}>Exporter CSV</button>
        </div>
      </div>

      {errorMsg && <div className="admin-error-banner">Erreur: {errorMsg}</div>}

      {selectedItem && (
        <div className="modal-backdrop" onClick={()=>setSelectedItem(null)}>
          <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <h3>Détails de l'inscription</h3>
              <button className="admin-btn admin-btn-view" onClick={()=>setSelectedItem(null)}>Fermer</button>
            </div>
            <div style={{fontSize:14,lineHeight:1.5}}>
              {Object.keys(selectedItem).map(k => (
                <div key={k} style={{marginBottom:8}}>
                  <strong style={{textTransform:'capitalize'}}>{k.replace(/_/g,' ')}:</strong> {String(selectedItem[k] ?? '—')}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="admin-empty-state">
          <div className="admin-empty-icon" aria-hidden="true">🗒️</div>
          <p><strong>{items.length === 0 ? 'Aucune inscription pour le moment' : 'Aucun résultat pour cette recherche'}</strong></p>
        </div>
      )}

      <div className="apprenants-list">
        {filtered.map(it => (
          <div className="apprenant-row" key={it.id}>
            <div className="apprenant-avatar" aria-hidden="true">{initialsOf(it.name)}</div>
            <div className="apprenant-main">
              <div className="apprenant-name">{it.name} <span className="muted">• {it.email}</span></div>
              <div className="apprenant-meta">Formation : <strong>{it.formation_title || '—'}</strong> — {it.created_at ? new Date(it.created_at).toLocaleString('fr-FR') : '—'}</div>
              {accessMsg[it.id] && (
                <div className={accessState[it.id] === 'error' ? 'apprenant-access-msg apprenant-access-msg--error' : 'apprenant-access-msg'}>
                  {accessMsg[it.id]}
                </div>
              )}
              {accessLink[it.id] && (
                <div className="apprenant-access-link">
                  <input type="text" readOnly value={accessLink[it.id]} onFocus={e=>e.target.select()} />
                  <button type="button" className="admin-btn admin-btn-view" onClick={()=>copyAccessLink(it.id, accessLink[it.id])}>Copier</button>
                </div>
              )}
            </div>
            <div className="apprenant-actions">
              <button className="admin-btn admin-btn-view" onClick={()=>setSelectedItem(it)}>Détails</button>
              <button
                className="admin-btn admin-btn-edit"
                disabled={accessState[it.id] === 'sending'}
                onClick={()=>handleCreateAccess(it)}
              >
                {accessState[it.id] === 'sending' ? 'Envoi…' : accessState[it.id] === 'done' ? 'Renvoyer l’accès' : 'Créer l’accès'}
              </button>
              <button className="admin-btn admin-btn-delete" disabled={deletingId===it.id} onClick={()=>handleDelete(it.id)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
