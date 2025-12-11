import React, { Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Header from './components/Header'
import Footer from './components/Footer'
import Accueil from './pages/Accueil'
import Catalogue from './pages/Catalogue'
import Formation from './pages/Formation'
const Elearning = React.lazy(() => import('./pages/Elearning'))
import APropos from './pages/APropos'
import References from './pages/References'
import Contact from './pages/Contact'
const Admin = React.lazy(() => import('./pages/Admin'))
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider } from './context/AuthContext'

export default function App(){
  const location = useLocation()
  return (
    <AuthProvider>
    <div className="app-root">
      <Header />
      <main>
        <div key={location.pathname} className="page-transition">
          <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/formation/:id" element={<Formation />} />
          <Route path="/elearning/:id" element={<ProtectedRoute><Suspense fallback={<div>Chargement…</div>}><Elearning /></Suspense></ProtectedRoute>} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/references" element={<References />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<AdminRoute><Suspense fallback={<div>Chargement…</div>}><Admin /></Suspense></AdminRoute>} />
          <Route path="/admin/formations" element={<AdminRoute><Suspense fallback={<div>Chargement…</div>}><Admin /></Suspense></AdminRoute>} />
          <Route path="/admin/apprenants" element={<AdminRoute><Suspense fallback={<div>Chargement…</div>}><Admin /></Suspense></AdminRoute>} />
          <Route path="/admin/certificats" element={<AdminRoute><Suspense fallback={<div>Chargement…</div>}><Admin /></Suspense></AdminRoute>} />
          <Route path="/admin/instructeurs" element={<AdminRoute><Suspense fallback={<div>Chargement…</div>}><Admin /></Suspense></AdminRoute>} />
          <Route path="/admin/parametres" element={<AdminRoute><Suspense fallback={<div>Chargement…</div>}><Admin /></Suspense></AdminRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
    </AuthProvider>
  )
}
