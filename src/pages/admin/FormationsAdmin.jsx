import React, { useEffect, useState } from 'react'
import coursesSeed from '../../data/courses'
import { supabase } from '../../lib/supabase'
import './FormationsAdmin.css'
import { Link } from 'react-router-dom'
import FormationIcon, { getIconKey, ICON_OPTIONS } from '../../components/FormationIcon'
import { formatDateRange } from '../../utils/dates'
import useEscapeKey from '../../hooks/useEscapeKey'

const STORAGE_KEY = 'ceca_admin_formations'

function loadSaved(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY)
    if(!raw) return null
    return JSON.parse(raw)
  }catch(e){ return null }
}

function save(items){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) }catch(e){}
}

// <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in the viewer's own
// local time, not the UTC ISO string Postgres/Supabase store — format it by
// hand rather than slicing the ISO string, which would silently shift the
// displayed time by the local UTC offset.
function toDatetimeLocalValue(iso){
  if(!iso) return ''
  const d = new Date(iso)
  if(Number.isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function FormationsAdmin(){
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  useEscapeKey(()=>setOpen(false), open)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title:'', category:'', duration:'', description:'', target:'', objective:'', modulesText:'', icon:'', available:true, elearningEnabled:true, startDate:'', endDate:'', liveSessionAt:'', liveSessionUrl:'' })

  const USE_SUPABASE = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

  useEffect(()=>{
    let mounted = true
    async function init(){
      if(USE_SUPABASE && supabase){
        try{
          const { data, error } = await supabase.from('formations').select('*').order('created_at', { ascending: false })
          if(!mounted) return
          if(error){
            console.warn('Supabase formations fetch error', error)
          }
          if(data && Array.isArray(data) && data.length){
            setItems(data.map(d=>({ ...d })))
            return
          }
        }catch(e){
          console.warn('Supabase fetch failed', e)
        }
      }
      const saved = loadSaved()
      if(saved && Array.isArray(saved) && saved.length) setItems(saved)
      else setItems(coursesSeed.map(c=>({ ...c })))
    }
    init()
    return ()=>{ mounted = false }
  },[])

  useEffect(()=>{ save(items) },[items])

  function openCreate(){ setEditing(null); setForm({ title:'', category:'', duration:'', description:'', target:'', objective:'', modulesText:'', icon:'', available:true, elearningEnabled:true, startDate:'', endDate:'', liveSessionAt:'', liveSessionUrl:'' }); setOpen(true) }
  function openEdit(it){
    setEditing(it.id)
    setForm({
      title: it.title,
      category: it.category,
      duration: it.duration,
      description: it.description,
      target: it.target || '',
      objective: it.objective || '',
      modulesText: Array.isArray(it.modules) ? it.modules.join('\n') : '',
      icon: it.icon || '',
      available: it.available !== false,
      elearningEnabled: it.elearning_enabled !== false,
      startDate: it.start_date || '',
      endDate: it.end_date || '',
      liveSessionAt: toDatetimeLocalValue(it.live_session_at),
      liveSessionUrl: it.live_session_url || ''
    })
    setOpen(true)
  }

  function handleChange(e){
    const { name, value, type, checked } = e.target
    setForm(s=>({ ...s, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSave(){
    if(!form.title.trim()) return alert('Titre requis')
    if(form.startDate && form.endDate && form.endDate < form.startDate){
      return alert('La date de fin doit être postérieure à la date de début.')
    }
    const fields = {
      title: form.title,
      category: form.category,
      duration: form.duration,
      description: form.description,
      target: form.target || null,
      objective: form.objective || null,
      modules: form.modulesText.split('\n').map(s=>s.trim()).filter(Boolean),
      icon: form.icon || null,
      available: form.available,
      elearning_enabled: form.elearningEnabled,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      live_session_at: form.liveSessionAt ? new Date(form.liveSessionAt).toISOString() : null,
      live_session_url: form.liveSessionUrl || null
    }
    const id = editing || String(Date.now())
    if(USE_SUPABASE && supabase){
      try{
        // Upsert rather than a plain update: items currently on screen may only exist in
        // the static seed/local fallback (not yet a real row in Supabase), so a plain
        // UPDATE would silently match zero rows and appear to succeed while saving nothing.
        const payload = editing ? { id, ...fields } : { id, ...fields, created_at: new Date().toISOString() }
        const { data, error } = await supabase.from('formations').upsert(payload).select().maybeSingle()
        if(error) throw error
        if(editing){
          setItems(prev=>prev.map(p=> p.id === editing ? { ...p, ...(data || payload) } : p))
        } else {
          setItems(prev=>[ data || payload, ...prev ])
        }
        setOpen(false)
        return
      }catch(e){
        console.warn('Supabase save failed', e)
        alert('Échec de l\'enregistrement sur Supabase — bascuage en mode local')
      }
    }

    if(editing){
      setItems(prev=>prev.map(p=> p.id === editing ? { ...p, ...fields } : p))
    } else {
      setItems(prev=>[{ id, ...fields }, ...prev])
    }
    setOpen(false)
  }

  async function handleDelete(id){
    if(!window.confirm('Supprimer ce cours ?')) return
    if(USE_SUPABASE && supabase){
      try{
        const { error } = await supabase.from('formations').delete().eq('id', id)
        if(error) throw error
        setItems(prev=>prev.filter(p=>p.id !== id))
        return
      }catch(e){
        console.warn('Supabase delete failed', e)
        alert('Échec de la suppression sur Supabase — bascuage en mode local')
      }
    }
    setItems(prev=>prev.filter(p=>p.id !== id))
  }

  return (
    <div className="formations-admin">
      <div className="fa-header">
        <div>
          <h2>Formations</h2>
          <p className="muted">{items.length} formation{items.length > 1 ? 's' : ''} au total</p>
        </div>
        <div>
          <button className="btn" onClick={openCreate}>+ Nouveau cours</button>
        </div>
      </div>

      <div className="fa-grid">
        {items.map(c => (
          <div key={c.id} className={`fa-card accent-${c.accent || 'blue'} ${c.available === false ? 'fa-card--unavailable' : ''}`}>
            {c.available === false && <div className="fa-card-badge">Indisponible</div>}
            {c.available !== false && c.elearning_enabled === false && <div className="fa-card-badge fa-card-badge--muted">Hors e-learning</div>}
            <div className="fa-card-icon">
              <FormationIcon iconKey={c.icon || getIconKey(c)} />
            </div>
            <div className="fa-card-body">
              <p className="fa-card-eyebrow">{c.category || 'Non classé'}</p>
              <h3>{c.title}</h3>
              <p className="fa-card-meta">{c.duration}</p>
              {formatDateRange(c.start_date, c.end_date) && (
                <p className="fa-card-dates">📅 {formatDateRange(c.start_date, c.end_date)}</p>
              )}
              <p className="fa-card-desc">{c.description}</p>
            </div>
            <div className="fa-card-actions">
              <Link to={`/formation/${c.id}`} className="admin-btn admin-btn-view">Voir</Link>
              <button className="admin-btn admin-btn-edit" onClick={()=>openEdit(c)}>Éditer</button>
              <button className="admin-btn admin-btn-delete" onClick={()=>handleDelete(c.id)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fa-modal">
          <div className="fa-modal-inner" role="dialog" aria-modal="true">
            <h3>{editing ? 'Éditer le cours' : 'Nouveau cours'}</h3>
            <label className="fa-field">
              <span>Titre</span>
              <input name="title" value={form.title} onChange={handleChange} />
            </label>
            <label className="fa-field">
              <span>Catégorie</span>
              <input name="category" value={form.category} onChange={handleChange} />
            </label>
            <label className="fa-field">
              <span>Durée</span>
              <input name="duration" value={form.duration} onChange={handleChange} />
            </label>
            <div className="fa-field-row">
              <label className="fa-field">
                <span>Date de début (optionnel)</span>
                <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
              </label>
              <label className="fa-field">
                <span>Date de fin (optionnel)</span>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
              </label>
            </div>
            {(form.startDate || form.endDate) && (
              <button type="button" className="fa-field-clear" onClick={()=>setForm(s=>({ ...s, startDate:'', endDate:'' }))}>
                Retirer les dates
              </button>
            )}
            <label className="fa-field">
              <span>Description (résumé affiché en haut de la fiche)</span>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
            </label>
            <label className="fa-field">
              <span>Objectif (section "Objectifs" de la fiche)</span>
              <textarea name="objective" value={form.objective} onChange={handleChange} rows={3} placeholder="Ex : Renforcer la transparence et la performance budgétaire." />
            </label>
            <label className="fa-field">
              <span>Public cible</span>
              <input name="target" value={form.target} onChange={handleChange} placeholder="Ex : Ministères, institutions publiques…" />
            </label>
            <label className="fa-field">
              <span>Modules (un par ligne)</span>
              <textarea name="modulesText" value={form.modulesText} onChange={handleChange} rows={4} placeholder={"Module 1\nModule 2\nModule 3"} />
            </label>
            <label className="fa-field">
              <span>Icône</span>
              <select name="icon" value={form.icon} onChange={handleChange}>
                <option value="">Auto (détectée depuis le titre/catégorie)</option>
                {ICON_OPTIONS.map(o => (
                  <option key={o.key} value={o.key}>{o.emoji} {o.label}</option>
                ))}
              </select>
            </label>
            <label className="fa-field fa-field-checkbox">
              <input type="checkbox" name="available" checked={form.available} onChange={handleChange} />
              <span>Formation disponible (visible et ouverte aux inscriptions côté site)</span>
            </label>
            <label className="fa-field fa-field-checkbox">
              <input type="checkbox" name="elearningEnabled" checked={form.elearningEnabled} onChange={handleChange} />
              <span>Visible dans l'Espace e-learning</span>
            </label>
            <div className="fa-field-row">
              <label className="fa-field">
                <span>Session live — date et heure (optionnel)</span>
                <input type="datetime-local" name="liveSessionAt" value={form.liveSessionAt} onChange={handleChange} />
              </label>
              <label className="fa-field">
                <span>Lien de la session (Zoom, Meet…)</span>
                <input type="url" name="liveSessionUrl" value={form.liveSessionUrl} onChange={handleChange} placeholder="https://meet.google.com/..." />
              </label>
            </div>
            {(form.liveSessionAt || form.liveSessionUrl) && (
              <button type="button" className="fa-field-clear" onClick={()=>setForm(s=>({ ...s, liveSessionAt:'', liveSessionUrl:'' }))}>
                Retirer la session live
              </button>
            )}
            <div className="fa-modal-actions">
              <button className="btn" onClick={handleSave}>{editing ? 'Enregistrer' : 'Créer'}</button>
              <button className="btn secondary" onClick={()=>setOpen(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
