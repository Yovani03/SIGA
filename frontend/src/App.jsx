import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import AltaFactura from './pages/AltaFactura';
import AltaVehiculo from './pages/AltaVehiculo';
import ListaVehiculos from './pages/ListaVehiculos';
import Mantenimiento from './pages/Mantenimiento';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="alta-factura" element={<AltaFactura />} />
          <Route path="alta-vehiculo" element={<AltaVehiculo />} />
          <Route path="vehiculos" element={<ListaVehiculos />} />
          <Route path="mantenimiento" element={<Mantenimiento />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
