import React, { useEffect, useState } from 'react'
import coursesSeed from '../../data/courses'
import { supabase } from '../../lib/supabase'
import './FormationsAdmin.css'
import { Link } from 'react-router-dom'

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

export default function FormationsAdmin(){
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title:'', category:'', duration:'', description:'' })

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

  function openCreate(){ setEditing(null); setForm({ title:'', category:'', duration:'', description:'' }); setOpen(true) }
  function openEdit(it){ setEditing(it.id); setForm({ title:it.title, category:it.category, duration:it.duration, description:it.description }); setOpen(true) }

  function handleChange(e){ const { name, value } = e.target; setForm(s=>({ ...s, [name]: value })) }

  async function handleSave(){
    if(!form.title.trim()) return alert('Titre requis')
    if(USE_SUPABASE && supabase){
      try{
        if(editing){
          const { data, error } = await supabase.from('formations').update({ title: form.title, category: form.category, duration: form.duration, description: form.description }).eq('id', editing).select().maybeSingle()
          if(error) throw error
          setItems(prev=>prev.map(p=> p.id === editing ? { ...p, ...data } : p))
        } else {
          const id = String(Date.now())
          const toCreate = { id, title: form.title, category: form.category, duration: form.duration, description: form.description, created_at: new Date().toISOString() }
          const { data, error } = await supabase.from('formations').insert([toCreate]).select().maybeSingle()
          if(error) throw error
          setItems(prev=>[ data || toCreate, ...prev ])
        }
        setOpen(false)
        return
      }catch(e){
        console.warn('Supabase save failed', e)
        alert('Échec de l\'enregistrement sur Supabase — bascuage en mode local')
      }
    }

    if(editing){
      setItems(prev=>prev.map(p=> p.id === editing ? { ...p, ...form } : p))
    } else {
      const id = String(Date.now())
      setItems(prev=>[{ id, ...form }, ...prev])
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
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h2>Formations</h2>
          <p className="muted">Liste des formations disponibles</p>
        </div>
        <div>
          <button className="btn" onClick={openCreate}>Nouveau cours</button>
        </div>
      </div>

      <div style={{marginTop:12,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>
        {items.map(c => (
          <div key={c.id} className="card" style={{textAlign:'left'}}>
            <div style={{fontWeight:700}}>{c.title}</div>
            <div className="muted" style={{fontSize:13}}>{c.category} • {c.duration}</div>
            <div style={{marginTop:8,fontSize:14,color:'#333'}}>{c.description}</div>
            <div style={{marginTop:10,display:'flex',gap:8}}>
              <Link to={`/formation/${c.id}`} className="btn small">Voir</Link>
              <button className="btn small" onClick={()=>openEdit(c)}>Éditer</button>
              <button className="btn small" onClick={()=>handleDelete(c.id)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fa-modal">
          <div className="fa-modal-inner">
            <h3>{editing ? 'Éditer le cours' : 'Nouveau cours'}</h3>
            <label>Titre<label className="muted"><input name="title" value={form.title} onChange={handleChange} /></label></label>
            <label>Catégorie<label className="muted"><input name="category" value={form.category} onChange={handleChange} /></label></label>
            <label>Durée<label className="muted"><input name="duration" value={form.duration} onChange={handleChange} /></label></label>
            <label>Description<label className="muted"><textarea name="description" value={form.description} onChange={handleChange} rows={4} /></label></label>
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button className="btn" onClick={handleSave}>{editing ? 'Enregistrer' : 'Créer'}</button>
              <button className="btn" onClick={()=>setOpen(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
