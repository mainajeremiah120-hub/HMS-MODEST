import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'
import Staff from './pages/Staff'
import Patients from './pages/Patients'
import Appointments from './pages/Appointments'
import Reception from './pages/Reception'
import Clinical from './pages/Clinical'
import Lab from './pages/Lab'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reception" element={<Reception />} />
        <Route path="/clinical" element={<Clinical />} />
        <Route path="/lab" element={<Lab />} /> 
      </Route>
    </Routes>
  )
}

export default App