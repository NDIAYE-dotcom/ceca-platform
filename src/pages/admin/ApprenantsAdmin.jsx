import React, { useEffect, useState } from 'react'
import { supabase, isSupabaseEnabled } from '../../lib/supabase'
import '../../pages/Admin.css'
import './ApprenantsAdmin.css'

// Use env var to pick the registrations table name; defaults to plural 'registrations'
const TABLE_NAME = (import.meta.env.VITE_REGISTRATIONS_TABLE || 'registrations')
const DELETED_KEY = 'ceca_registrations_deleted'

export default function ApprenantsAdmin(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [supabaseInfo, setSupabaseInfo] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deletedSet, setDeletedSet] = useState(new Set())
  const [selectedItem, setSelectedItem] = useState(null)

  async function load(){
    setLoading(true)
    setErrorMsg(null)
    try{
      if(isSupabaseEnabled){
        const tableNotFound = (err) => {
          const m = String(err?.message || err || '').toLowerCase()
          return /could not find the table|relation ".+" does not exist|does not exist in the schema cache/.test(m)
        }
        let res = await supabase.from(TABLE_NAME).select('*').order('created_at', { ascending: false })
        console.debug('Supabase fetch', TABLE_NAME, res)
        setSupabaseInfo({ table: TABLE_NAME, dataLength: Array.isArray(res?.data) ? res.data.length : null, error: res?.error || null })
        if(res?.error && !tableNotFound(res.error)) {
          setErrorMsg(res.error.message || String(res.error))
        }

        // If the primary table returns an error indicating it doesn't exist, or returns no rows
        // while an alternate singular/plural table might exist, try the alternate name.
        const alternate = TABLE_NAME === 'registrations' ? 'registration' : 'registrations'
        if((res?.error && tableNotFound(res.error)) || (Array.isArray(res?.data) && res.data.length === 0)){
          try{
            const alt = await supabase.from(alternate).select('*').order('created_at', { ascending: false })
            console.debug('Supabase fetch alternate', alternate, alt)
                if(!alt?.error && Array.isArray(alt?.data) && alt.data.length > 0){
                  const rawDel = localStorage.getItem(DELETED_KEY)
                  const delArr = rawDel ? JSON.parse(rawDel) : []
                  const delSet = new Set(Array.isArray(delArr) ? delArr : [])
                  setDeletedSet(delSet)
                  setSupabaseInfo({ table: alternate, dataLength: alt.data.length, error: null })
                  const filtered = alt.data.filter(r => !delSet.has(r.id))
                  setItems(filtered); setLoading(false); return
                }
          }catch(e){ console.warn('Alternate table fetch failed', e) }
        }

        if(Array.isArray(res?.data) && res.data.length > 0){
          const rawDel = localStorage.getItem(DELETED_KEY)
          const delArr = rawDel ? JSON.parse(rawDel) : []
          const delSet = new Set(Array.isArray(delArr) ? delArr : [])
          setDeletedSet(delSet)
          const filtered = res.data.filter(r => !delSet.has(r.id))
          setItems(filtered); setLoading(false); return
        }
      }
    }catch(e){ setErrorMsg(String(e)) }

    try{
      const raw = localStorage.getItem('ceca_registrations')
      const arr = raw ? JSON.parse(raw) : []
      const rawDel = localStorage.getItem(DELETED_KEY)
      const delArr = rawDel ? JSON.parse(rawDel) : []
      const delSet = new Set(Array.isArray(delArr) ? delArr : [])
      setDeletedSet(delSet)
      setItems(Array.isArray(arr) ? arr.filter(r => !delSet.has(r.id)) : [])
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
            const rawDel = localStorage.getItem(DELETED_KEY)
            const delArr = rawDel ? JSON.parse(rawDel) : []
            const delSet = new Set(Array.isArray(delArr) ? delArr : [])
            if(delSet.has(r.id)) return
            setItems(prev => prev ? [r, ...prev] : [r])
          })
          .subscribe()
      )
    }catch(e){ console.warn('realtime subscribe failed', e) }

    return ()=>{ try{ for(const c of channels) supabase.removeChannel(c) }catch(e){} }
  }, [isSupabaseEnabled])

  // perform a local-only deletion: mark id in localStorage so it stays hidden
  async function handleDelete(id){
    if(!window.confirm('Supprimer cette inscription (local uniquement) ?')) return
    setErrorMsg(null)
    setDeletingId(id)
    try{
      const rawDel = localStorage.getItem(DELETED_KEY)
      const delArr = rawDel ? JSON.parse(rawDel) : []
      const arr = Array.isArray(delArr) ? delArr : []
      if(!arr.includes(id)) arr.push(id)
      localStorage.setItem(DELETED_KEY, JSON.stringify(arr))
      setDeletedSet(new Set(arr))
      const remaining = (items || []).filter(r => r.id !== id)
      setItems(remaining)
    }catch(e){ console.error('local delete failed', e); setErrorMsg(String(e)); window.alert('Erreur suppression locale: ' + String(e)) }
    setDeletingId(null)
  }

  function downloadCSV(){
    if(!items || items.length === 0) return
    const cols = ['id','formation_id','formation_title','name','email','phone','organization','payment_method','notes','created_at']
    const csv = [cols.join(',')].concat(items.map(it => cols.map(c => `"${(it[c]||'').toString().replace(/"/g,'""')}"`).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'ceca_registrations.csv'; a.click(); URL.revokeObjectURL(url)
  }

  if(loading) return <div className="admin-card">Chargement des apprenants…</div>

  return (
    <div className="admin-card admin-apprenants">
      {errorMsg && <div style={{background:'#ffe6e6',padding:10,color:'#700',borderRadius:6,marginBottom:12}}>Erreur: {errorMsg}</div>}
      {/* debug panel removed */}

      <div className="admin-card-header">
        <h3>Inscriptions / Apprenants</h3>
        <div>
          <button className="btn" onClick={load}>Rafraîchir</button>
          <button className="btn secondary" onClick={downloadCSV}>Exporter CSV</button>
        </div>
      </div>

      {selectedItem && (
        <div className="modal-backdrop" onClick={()=>setSelectedItem(null)}>
          <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <h3>Détails de l'inscription</h3>
              <button className="btn secondary" onClick={()=>setSelectedItem(null)}>Fermer</button>
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

      {(!items || items.length === 0) && <div className="muted">Aucune inscription trouvée.</div>}

      <div className="apprenants-list">
        {(items || []).map(it => (
          <div className="apprenant-row" key={it.id}>
            <div className="apprenant-main">
              <div className="apprenant-name">{it.name} <span className="muted">• {it.email}</span></div>
              <div className="apprenant-meta">Formation: <strong>{it.formation_title}</strong> — {it.created_at ? new Date(it.created_at).toLocaleString() : '—'}</div>
            </div>
            <div className="apprenant-actions">
              <button className="btn secondary" onClick={()=>setSelectedItem(it)}>Détails</button>
              <button className="btn" onClick={()=>handleDelete(it.id)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
