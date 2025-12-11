import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    let revalidateInterval = null

    const LOCAL_KEY = 'ceca_local_user'

    function persistLocalUser(u){
      try{ if(u) localStorage.setItem(LOCAL_KEY, JSON.stringify(u)) }catch(e){}
    }
    function clearLocalUser(){ try{ localStorage.removeItem(LOCAL_KEY) }catch(e){} }
    function readLocalUser(){ try{ const v = localStorage.getItem(LOCAL_KEY); return v ? JSON.parse(v) : null }catch(e){ return null } }

    async function enrichAndSet(sessionUser){
      if(!sessionUser) return setUser(null)
      try{
        const { data: profileData, error: profileErr } = await supabase.from('profiles').select('role, full_name').eq('id', sessionUser.id).maybeSingle()
        const role = profileErr ? undefined : profileData?.role
        const full_name = profileErr ? undefined : profileData?.full_name
        const enriched = { ...sessionUser, role: role || undefined, full_name: full_name || undefined }
        setUser(enriched)
        persistLocalUser(enriched)
      }catch(e){
        console.warn('Impossible de charger le profile utilisateur', e)
        setUser(sessionUser)
        persistLocalUser(sessionUser)
      }
    }

    async function init(){
      try{
        const { data } = await supabase.auth.getSession()
        const session = data?.session
        if(!mounted) return
        if(session?.user) {
          await enrichAndSet(session.user)
        } else {
          // fallback to any locally persisted user (helps when session transiently disappears)
          const local = readLocalUser()
          if(local) setUser(local)
          else setUser(null)
        }
      }catch(e){
        const local = readLocalUser()
        if(local) setUser(local)
        else if(mounted) setUser(null)
      } finally {
        if(mounted) setLoading(false)
      }
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if(!mounted) return
      if(session?.user){
        ;(async ()=>{
          await enrichAndSet(session.user)
        })()
      } else {
        // clear persisted user on explicit sign out
        if(event === 'SIGNED_OUT') clearLocalUser()
        setUser(null)
      }
      setLoading(false)
    })

    // Periodic revalidation to reduce transient sign-outs
    revalidateInterval = setInterval(async ()=>{
      try{
        const { data } = await supabase.auth.getSession()
        const session = data?.session
        if(session?.user){
          await enrichAndSet(session.user)
        }
      }catch(e){
        // ignore
      }
    }, 60_000)

    return ()=>{
      mounted = false
      try{ if(listener?.subscription) listener.subscription.unsubscribe() }catch(e){}
      try{ if(revalidateInterval) clearInterval(revalidateInterval) }catch(e){}
    }
  },[])

  async function signUp({ email, password, name }){
    const { data, error } = await supabase.auth.signUp({ email, password })
    if(error) return { error }

    // attempt to create or upsert a profile row. If RLS blocks this, it will fail silently here.
    try{
      if(data?.user){
        await supabase.from('profiles').upsert({ id: data.user.id, email, full_name: name, role: 'learner' })
        const enriched = { ...data.user, full_name: name, role: 'learner' }
        try{ localStorage.setItem('ceca_local_user', JSON.stringify(enriched)) }catch(e){}
      }
    }catch(e){
      console.warn('Création de profile échouée', e)
    }

    return { user: data.user }
  }

  async function signIn({ email, password }){
    // Dev override: allow a local admin login regardless of Supabase state
    const ADMIN_EMAIL = 'ceca-admin@gmail.com'
    const ADMIN_PASSWORD = 'adminpass'
    if(String(email).toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD){
      const localUser = { id: 'local-admin', email: ADMIN_EMAIL, role: 'admin', full_name: 'CECA Admin' }
      setUser(localUser)
      try{ localStorage.setItem('ceca_local_user', JSON.stringify(localUser)) }catch(e){}
      return { user: localUser }
    }

    try{
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      // Debug logs for failed sign-in (remove in production)
      if(error){
        console.warn('Supabase signIn error:', error)
        return { error }
      }
      if(!data?.user){
        console.warn('Supabase signIn returned no user, data:', data)
        return { error: { message: 'No user returned' } }
      }
      // enrich profile and persist locally
      try{
        const { data: profileData } = await supabase.from('profiles').select('role, full_name').eq('id', data.user.id).maybeSingle()
        const role = profileData?.role
        const full_name = profileData?.full_name
        const enriched = { ...data.user, role: role || undefined, full_name: full_name || undefined }
        setUser(enriched)
        try{ localStorage.setItem('ceca_local_user', JSON.stringify(enriched)) }catch(e){}
      }catch(e){
        setUser(data.user)
      }
      return { user: data.user }
    }catch(e){
      console.error('Unexpected signIn error', e)
      return { error: { message: 'Erreur inattendue lors de la connexion' } }
    }
  }

  async function signOut(){
    try{ await supabase.auth.signOut() }catch(e){/* ignore */}
    try{ localStorage.removeItem('ceca_local_user') }catch(e){}
    setUser(null)
    return { ok: true }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
