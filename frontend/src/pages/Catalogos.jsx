import React, { useState } from 'react';
import { Tag, Wrench, Users, LayoutGrid } from 'lucide-react';
import Productos from './Productos';
import Talleres from './Talleres';
import Proveedores from './Proveedores';

const Catalogos = () => {
  const [activeTab, setActiveTab] = useState('productos');

  const tabs = [
    { id: 'productos', label: 'Productos', icon: <Tag size={20} />, component: <Productos /> },
    { id: 'talleres', label: 'Talleres', icon: <Wrench size={20} />, component: <Talleres /> },
    { id: 'proveedores', label: 'Proveedores', icon: <Users size={20} />, component: <Proveedores /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <LayoutGrid className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Administración de Catálogos</h1>
            <p className="text-slate-500 text-xs font-medium">Gestiona productos, talleres y proveedores en un solo lugar</p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 self-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="transition-all duration-300">
        {tabs.find(t => t.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default Catalogos;
