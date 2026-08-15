import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useEscapeKey from '../../hooks/useEscapeKey'
import './MissionsAgenda.css'

const STATUS_OPTIONS = [
  { key: 'planifiee', label: 'Planifiée' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'terminee', label: 'Terminée' },
  { key: 'annulee', label: 'Annulée' }
]

function statusLabel(key){ return STATUS_OPTIONS.find(s => s.key === key)?.label || 'Planifiée' }

function todayStr(){ return new Date().toISOString().slice(0, 10) }

function formatFr(dateStr){
  if(!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  if(Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function needsReminder(m){
  if(!m.reminder_date) return false
  if(m.status === 'terminee' || m.status === 'annulee') return false
  return m.reminder_date <= todayStr()
}

const EMPTY_FORM = { title:'', client:'', location:'', startDate:'', endDate:'', reminderDate:'', status:'planifiee', notes:'' }

export default function MissionsAgenda(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [open, setOpen] = useState(false)
  useEscapeKey(()=>setOpen(false), open)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  async function load(){
    setLoading(true)
    setErrorMsg(null)
    try{
      const { data, error } = await supabase.from('missions').select('*').order('start_date', { ascending: true, nullsFirst: false })
      if(error) throw error
      setItems(data || [])
    }catch(e){
      console.warn('Missions fetch failed', e)
      setErrorMsg("Impossible de charger l'agenda (la table 'missions' existe-t-elle bien dans Supabase ?)")
    }
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  const dueReminders = useMemo(()=> items.filter(needsReminder), [items])

  // Best-effort native browser notification for due reminders — visual banner below
  // is the reliable path since this requires permission and the tab to be open.
  useEffect(()=>{
    if(dueReminders.length === 0) return
    if(typeof Notification === 'undefined') return
    if(Notification.permission === 'granted'){
      new Notification('Rappel de mission CECA', {
        body: `${dueReminders.length} mission(s) à rappeler : ${dueReminders.map(m=>m.title).join(', ')}`
      })
    } else if(Notification.permission !== 'denied'){
      Notification.requestPermission()
    }
  }, [dueReminders.length])

  function openCreate(){ setEditing(null); setForm(EMPTY_FORM); setOpen(true) }
  function openEdit(m){
    setEditing(m.id)
    setForm({
      title: m.title || '',
      client: m.client || '',
      location: m.location || '',
      startDate: m.start_date || '',
      endDate: m.end_date || '',
      reminderDate: m.reminder_date || '',
      status: m.status || 'planifiee',
      notes: m.notes || ''
    })
    setOpen(true)
  }

  function handleChange(e){
    const { name, value } = e.target
    setForm(s=>({ ...s, [name]: value }))
  }

  async function handleSave(){
    if(!form.title.trim()) return alert('Titre de la mission requis')
    if(form.startDate && form.endDate && form.endDate < form.startDate){
      return alert('La date de fin doit être postérieure à la date de début.')
    }
    const fields = {
      title: form.title,
      client: form.client || null,
      location: form.location || null,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      reminder_date: form.reminderDate || null,
      status: form.status,
      notes: form.notes || null
    }
    const id = editing || String(Date.now())
    try{
      const payload = editing ? { id, ...fields } : { id, ...fields, created_at: new Date().toISOString() }
      const { data, error } = await supabase.from('missions').upsert(payload).select().maybeSingle()
      if(error) throw error
      if(editing){
        setItems(prev => prev.map(p => p.id === editing ? { ...p, ...(data || payload) } : p))
      } else {
        setItems(prev => [ data || payload, ...prev ])
      }
      setOpen(false)
    }catch(e){
      console.warn('Mission save failed', e)
      alert("Échec de l'enregistrement : " + (e?.message || String(e)))
    }
  }

  async function handleDelete(id){
    if(!window.confirm('Supprimer cette mission ?')) return
    try{
      const { error } = await supabase.from('missions').delete().eq('id', id)
      if(error) throw error
      setItems(prev => prev.filter(p => p.id !== id))
    }catch(e){
      console.warn('Mission delete failed', e)
      alert("Échec de la suppression : " + (e?.message || String(e)))
    }
  }

  if(loading) return <div className="admin-panel">Chargement de l'agenda…</div>

  return (
    <div className="missions-agenda">
      <Link to="/admin/entreprise" className="admin-back-link">← Retour</Link>

      <div className="fa-header">
        <div>
          <h2>Agenda de programmation des missions</h2>
          <p className="muted">{items.length} mission{items.length > 1 ? 's' : ''} au total</p>
        </div>
        <button className="btn" onClick={openCreate}>+ Nouvelle mission</button>
      </div>

      {errorMsg && <div className="admin-error-banner">{errorMsg}</div>}

      {dueReminders.length > 0 && (
        <div className="mission-reminder-banner">
          🔔 <strong>{dueReminders.length} rappel{dueReminders.length > 1 ? 's' : ''} à traiter :</strong>{' '}
          {dueReminders.map(m => m.title).join(', ')}
        </div>
      )}

      {items.length === 0 && !errorMsg && (
        <div className="admin-empty-state">
          <div className="admin-empty-icon" aria-hidden="true">🗓️</div>
          <p><strong>Aucune mission programmée</strong></p>
          <p className="muted">Clique sur "+ Nouvelle mission" pour en ajouter une.</p>
        </div>
      )}

      <div className="mission-list">
        {items.map(m => (
          <div key={m.id} className={`mission-card status-${m.status || 'planifiee'}`}>
            {needsReminder(m) && <div className="mission-reminder-badge">🔔 Rappel</div>}
            <div className="mission-card-main">
              <p className="mission-status-pill">{statusLabel(m.status)}</p>
              <h3>{m.title}</h3>
              {m.client && <p className="mission-meta">Client : <strong>{m.client}</strong></p>}
              {m.location && <p className="mission-meta">Lieu : {m.location}</p>}
              {(m.start_date || m.end_date) && (
                <p className="mission-meta">
                  📅 {m.start_date && m.end_date
                    ? `Du ${formatFr(m.start_date)} au ${formatFr(m.end_date)}`
                    : m.start_date ? `À partir du ${formatFr(m.start_date)}` : `Jusqu'au ${formatFr(m.end_date)}`}
                </p>
              )}
              {m.reminder_date && <p className="mission-meta">Rappel prévu le {formatFr(m.reminder_date)}</p>}
              {m.notes && <p className="mission-notes">{m.notes}</p>}
            </div>
            <div className="mission-card-actions">
              <button className="admin-btn admin-btn-edit" onClick={()=>openEdit(m)}>Éditer</button>
              <button className="admin-btn admin-btn-delete" onClick={()=>handleDelete(m.id)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fa-modal">
          <div className="fa-modal-inner" role="dialog" aria-modal="true">
            <h3>{editing ? 'Éditer la mission' : 'Nouvelle mission'}</h3>
            <label className="fa-field">
              <span>Titre</span>
              <input name="title" value={form.title} onChange={handleChange} placeholder="Ex : Audit interne — Ministère X" />
            </label>
            <label className="fa-field">
              <span>Client</span>
              <input name="client" value={form.client} onChange={handleChange} />
            </label>
            <label className="fa-field">
              <span>Lieu</span>
              <input name="location" value={form.location} onChange={handleChange} />
            </label>
            <div className="fa-field-row">
              <label className="fa-field">
                <span>Date de début</span>
                <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
              </label>
              <label className="fa-field">
                <span>Date de fin</span>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
              </label>
            </div>
            <label className="fa-field">
              <span>Date de rappel (optionnel)</span>
              <input type="date" name="reminderDate" value={form.reminderDate} onChange={handleChange} />
            </label>
            <label className="fa-field">
              <span>Statut</span>
              <select name="status" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </label>
            <label className="fa-field">
              <span>Notes</span>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
            </label>
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
