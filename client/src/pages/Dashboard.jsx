import React, { useEffect } from 'react';
import useVehicleStore from '../store/vehicleStore';
import MapView from '../components/MapView';
import VehicleList from '../components/VehicleList';
import { LogOut, Navigation } from 'lucide-react';

export default function Dashboard() {
  const { initSocket, initWorker, vehicles, activeRoute, logout, user } = useVehicleStore();

  useEffect(() => {
    initSocket();
    initWorker();
  }, [initSocket, initWorker]);

  const activeCount = Object.values(vehicles).filter(v => v.status !== 'offline').length;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 overflow-hidden text-slate-200">
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shadow-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Navigation className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">Voyager Fleet<span className="text-blue-400">OS</span></h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-lg border border-slate-700">
            <div className="text-center">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Fleet</p>
              <p className="text-lg font-bold text-white leading-tight">{Object.keys(vehicles).length}</p>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="text-center">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active</p>
              <p className="text-lg font-bold text-emerald-400 leading-tight">{activeCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-bold border border-slate-600">
               {user?.username?.charAt(0).toUpperCase() || 'U'}
             </div>
             <button 
               onClick={logout}
               className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
               title="Logout"
             >
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden">
        <aside className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col shadow-xl z-10">
          <VehicleList />
        </aside>

        <main className="flex-1 relative bg-slate-900">
          <MapView />
        </main>
      </div>
    </div>
  );
}
