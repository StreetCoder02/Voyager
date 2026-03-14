import React, { useState, useMemo } from 'react';
import useVehicleStore from '../store/vehicleStore';
import { Search, MapPin, Activity, Package } from 'lucide-react';

const VehicleRow = React.memo(({ vehicle, isSelected, onSelect }) => {
  const statusColors = {
    idle: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    delivering: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    offline: 'bg-slate-700/50 text-slate-400 border-slate-600/50',
  };

  return (
    <div 
      onClick={() => onSelect(vehicle)}
      className={`p-3 border-b border-slate-700/50 cursor-pointer transition-all hover:bg-slate-700/50 ${isSelected ? 'bg-blue-900/30 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-200">{vehicle.id}</h3>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${statusColors[vehicle.status]}`}>
          {vehicle.status}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
        <MapPin className="w-3.5 h-3.5" />
        <span>{vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}</span>
      </div>
      <div className="flex items-center gap-4 text-slate-500 text-xs mt-2">
        <div className="flex items-center gap-1">
          <Activity className="w-3.5 h-3.5" />
          <span>{vehicle.speed} km/h</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{vehicle.driverName}</span>
        </div>
      </div>
    </div>
  );
});

export default function VehicleList() {
  const [searchTerm, setSearchTerm] = useState('');
  const vehicles = useVehicleStore(state => state.vehicles);
  const selectedVehicle = useVehicleStore(state => state.selectedVehicle);
  const selectVehicle = useVehicleStore(state => state.selectVehicle);
  const activeRoute = useVehicleStore(state => state.activeRoute);

  const filteredVehicles = useMemo(() => {
    const vehicleArray = Object.values(vehicles);
    if (!searchTerm) return vehicleArray.slice(0, 50); // Show max 50 to prevent freezing DOM
    const lower = searchTerm.toLowerCase();
    return vehicleArray.filter(v => 
      v.id.toLowerCase().includes(lower) || 
      v.driverName.toLowerCase().includes(lower)
    ).slice(0, 50);
  }, [vehicles, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-slate-800">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search ID or Driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>
      
      {activeRoute && selectedVehicle && (
         <div className="p-4 bg-blue-900/20 border-b border-blue-900/50 shrink-0">
           <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Active Route</h4>
           <div className="flex items-center gap-2 text-sm text-slate-300">
             <MapPin className="w-4 h-4 text-blue-400" />
             <span>Routing to Driver <strong>{selectedVehicle.id}</strong></span>
           </div>
         </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map(v => (
            <VehicleRow 
              key={v.id} 
              vehicle={v} 
              isSelected={selectedVehicle?.id === v.id}
              onSelect={selectVehicle}
            />
          ))
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm">
            No vehicles found
          </div>
        )}
      </div>
    </div>
  );
}
