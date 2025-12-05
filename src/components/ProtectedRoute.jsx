import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'

export default function ProtectedRoute({ children }){
  const { user, loading } = useAuth()
  const location = useLocation()

  if(loading) return <div style={{padding:24}}><Loading text="Vérification de la session" /></div>
  if(!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  // Ensure only learners can access protected learner pages
  if(user && user.role && user.role !== 'learner'){
    return (
      <div style={{padding:24}}>
        <h3>Accès réservé</h3>
        <p>Cette section est réservée aux apprenants. Veuillez vous connecter avec un compte apprenant.</p>
      </div>
    )
  }
  return children
}
