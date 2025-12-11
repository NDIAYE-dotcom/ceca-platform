import { supabase } from './supabase'
import coursesSeed from '../data/courses'

const USE_SUPABASE = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
const STORAGE_KEY = 'ceca_admin_formations'

function loadSaved(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null }catch(e){ return null }
}

function saveLocal(items){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) }catch(e){}
}

export async function getFormations(){
  if(USE_SUPABASE && supabase){
    try{
      const { data, error } = await supabase.from('formations').select('*').order('created_at', { ascending: false })
      if(error) throw error
      if(Array.isArray(data) && data.length) return data
    }catch(e){
      console.warn('Supabase fetch formations failed', e)
    }
  }
  const saved = loadSaved()
  if(saved && Array.isArray(saved) && saved.length) return saved
  return coursesSeed
}

export async function getFormationById(id){
  if(!id) return null
  if(USE_SUPABASE && supabase){
    try{
      const { data, error } = await supabase.from('formations').select('*').eq('id', id).maybeSingle()
      if(error) throw error
      if(data) return data
    }catch(e){
      console.warn('Supabase fetch formation by id failed', e)
    }
  }
  const saved = loadSaved()
  if(saved && Array.isArray(saved)){
    const found = saved.find(s=> String(s.id) === String(id))
    if(found) return found
  }
  return coursesSeed.find(c=> String(c.id) === String(id)) || null
}

export function persistLocalFormations(items){ saveLocal(items) }
