import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Simulator from './pages/Simulator'
import Chat from './pages/Chat'
import Appointments from './pages/Appointments'
import Subscription from './pages/Subscription'
import Settings from './pages/Settings'
import PatientProfile from './pages/PatientProfile'
import VideoCalls from './pages/VideoCalls'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-hg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-hg-red border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/simulator" element={
        <ProtectedRoute><Simulator /></ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute><Chat /></ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute><Appointments /></ProtectedRoute>
      } />
      <Route path="/subscription" element={
        <ProtectedRoute><Subscription /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      } />
      <Route path="/patient/:patientId" element={
        <ProtectedRoute><PatientProfile /></ProtectedRoute>
      } />
      <Route path="/video-calls" element={
        <ProtectedRoute><VideoCalls /></ProtectedRoute>
      } />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
