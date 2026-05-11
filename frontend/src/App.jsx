import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Facturacion from './pages/Facturacion';
import ListaVehiculos from './pages/ListaVehiculos';
import Mantenimiento from './pages/Mantenimiento';
import Logistica from './pages/Logistica';
import Operadores from './pages/Operadores';
import Monitoreo from './pages/Monitoreo';
import Combustibles from './pages/Combustibles';
import Catalogos from './pages/Catalogos';
import Tickets from './pages/Tickets';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute allowedRoles={['capturista', 'admin', 'jefe_logistica', 'monitoreo']} />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="facturacion" element={<Facturacion />} />
              <Route path="vehiculos" element={<ListaVehiculos />} />
              <Route path="mantenimiento" element={<Mantenimiento />} />
              <Route path="catalogos" element={<Catalogos />} />
              <Route path="logistica" element={<Logistica />} />
              <Route path="operadores" element={<Operadores />} />
              <Route path="monitoreo" element={<Monitoreo />} />
              <Route path="combustible" element={<Combustibles />} />
              <Route path="tickets" element={<Tickets />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
