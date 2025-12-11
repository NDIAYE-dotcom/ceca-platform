import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'

export default function AdminRoute({ children }){
  const { user, loading } = useAuth()
  const location = useLocation()

  if(loading) return <div style={{padding:24}}><Loading text="Vérification de la session" /></div>
  if(!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  // Restrict strictly to the single admin identity
  const ALLOWED_ADMIN = 'ceca-admin@gmail.com'
  const email = (user?.email || '').toLowerCase()
  if(email !== ALLOWED_ADMIN){
    return (
      <div style={{padding:24}}>
        <h3>Accès réservé aux administrateurs</h3>
        <p>Seul le compte administrateur <strong>{ALLOWED_ADMIN}</strong> peut accéder à cette section.</p>
      </div>
    )
  }
  return children
}
