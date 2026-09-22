import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import Lista from './pages/Conductores/Lista'
import Detalle from './pages/Conductores/Detalle'
import Mapa from './pages/Mapa'
import Solicitudes from './pages/Solicitudes'
import Tarifas from './pages/Tarifas'
import Configuracion from './pages/Configuracion'

function ProtectedLayout() {
  const { estaAutenticado } = useAuth()
  if (!estaAutenticado) return <Navigate to="/login" replace />
  return <Layout />
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<Home />} />
        <Route path="conductores" element={<Lista />} />
        <Route path="conductores/:id" element={<Detalle />} />
        <Route path="mapa" element={<Mapa />} />
        <Route path="solicitudes" element={<Solicitudes />} />
        <Route path="tarifas" element={<Tarifas />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}