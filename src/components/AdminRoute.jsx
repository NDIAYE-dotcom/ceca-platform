import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'

export default function AdminRoute({ children }){
  const { user, loading } = useAuth()
  const location = useLocation()

  if(loading) return <div style={{padding:24}}><Loading text="Vérification de la session" /></div>
  if(!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if(user && user.role && user.role !== 'admin'){
    return (
      <div style={{padding:24}}>
        <h3>Accès réservé aux administrateurs</h3>
        <p>Votre compte ne dispose pas des droits nécessaires pour accéder à cette section.</p>
      </div>
    )
  }
  return children
}
