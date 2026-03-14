import { create } from 'zustand';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const useVehicleStore = create((set, get) => ({
  vehicles: {}, // Normalized state: { [id]: vehicleData }
  selectedVehicle: null,
  activeRoute: null,
  socket: null,
  worker: null,
  isSearching: false,
  
  user: null,
  token: localStorage.getItem('token') || null,

  login: (userData, token) => {
    localStorage.setItem('token', token);
    set({ user: userData, token });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  initSocket: () => {
    if (get().socket) return;
    
    const socket = io(SOCKET_URL);
    
    // Initial blast of all vehicles
    socket.on('fleet-initial', (initialVehicles) => {
      const normalized = {};
      initialVehicles.forEach(v => {
        normalized[v.id] = v;
      });
      set({ vehicles: normalized });
    });

    // Handle delta updates for moved vehicles
    socket.on('fleet-update', (deltas) => {
      set(state => {
        const updatedVehicles = { ...state.vehicles };
        let selectedVehicleNeedsUpdate = false;
        
        deltas.forEach(delta => {
          updatedVehicles[delta.id] = delta;
          if (state.selectedVehicle && state.selectedVehicle.id === delta.id) {
            selectedVehicleNeedsUpdate = true;
          }
        });
        
        return {
          vehicles: updatedVehicles,
          selectedVehicle: selectedVehicleNeedsUpdate ? updatedVehicles[state.selectedVehicle.id] : state.selectedVehicle
        };
      });
    });

    set({ socket: socket });
  },

  initWorker: () => {
    if (get().worker) return;
    
    const worker = new Worker(new URL('../workers/routeWorker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'RESULT') {
        if (!payload.error) {
          set({ 
            selectedVehicle: payload.driver, 
            activeRoute: payload.route,
            isSearching: false
          });
        } else {
          set({ isSearching: false });
        }
      }
    };
    
    set({ worker });
  },

  findNearestDriver: (targetLat, targetLng) => {
    const { worker, vehicles } = get();
    const vehicleArray = Object.values(vehicles);
    if (!worker || vehicleArray.length === 0) return;
    
    set({ isSearching: true, activeRoute: null });
    worker.postMessage({
      type: 'FIND_NEAREST_AND_ROUTE',
      payload: { vehicles: vehicleArray, targetLat, targetLng }
    });
  },

  selectVehicle: (vehicle) => {
    set({ selectedVehicle: vehicle, activeRoute: null });
  },
  
  clearSelection: () => {
    set({ selectedVehicle: null, activeRoute: null });
  }
}));

export default useVehicleStore;
