import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'

export default function AdminRoute({ children }){
  const { user, loading } = useAuth()
  const location = useLocation()

  if(loading) return <div style={{padding:24}}><Loading text="Vérification de la session" /></div>
  if(!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  // Restrict to accounts whose Supabase profile has role = 'admin'
  if(user?.role !== 'admin'){
    return (
      <div style={{padding:24}}>
        <h3>Accès réservé aux administrateurs</h3>
        <p>Seuls les comptes avec le rôle administrateur peuvent accéder à cette section.</p>
      </div>
    )
  }
  return children
}
