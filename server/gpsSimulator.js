const VEHICLE_COUNT = 5000;
const UPDATE_INTERVAL = 2000; // ms

// Base center: New York City
const BASE_LAT = 40.7128;
const BASE_LNG = -74.0060;
const LAT_SPREAD = 0.5; // About 50km radius
const LNG_SPREAD = 0.5;

const vehicles = Array.from({ length: VEHICLE_COUNT }, (_, i) => ({
  id: `VHL-${String(i + 1).padStart(4, '0')}`,
  latitude: BASE_LAT + (Math.random() * LAT_SPREAD * 2 - LAT_SPREAD),
  longitude: BASE_LNG + (Math.random() * LNG_SPREAD * 2 - LNG_SPREAD),
  speed: Math.floor(Math.random() * 60) + 10, // 10-70 km/h
  status: ['idle', 'delivering', 'offline'][Math.floor(Math.random() * 3)],
  driverName: `Driver ${i + 1}`
}));

function startGpsSimulation(io) {
  console.log(`Started GPS simulation for ${VEHICLE_COUNT} vehicles`);
  
  // Initial blast of all vehicles when a client first connects
  io.on('connection', (socket) => {
    socket.emit('fleet-initial', vehicles);
  });
  
  setInterval(() => {
    const deltas = [];

    for (let i = 0; i < vehicles.length; i++) {
        const v = vehicles[i];
        
        let didWait = false;
        
        // Simulate random movement if not offline
        if (v.status !== 'offline') {
          // Add roughly a ~10% chance a vehicle actually moves this tick.
          // In reality, 5000 cars don't all magically report coordinates at the exact same ms.
          if (Math.random() > 0.90) {
            v.latitude += (Math.random() - 0.5) * 0.002;
            v.longitude += (Math.random() - 0.5) * 0.002;
            v.speed = Math.floor(Math.random() * 60) + 10;
            didWait = true;
          }
          
          // Randomly change status occasionally
          if (Math.random() > 0.98) {
            v.status = ['idle', 'delivering'][Math.floor(Math.random() * 2)];
            didWait = true;
          }
        }
        
        // Only push to the network queue if the vehicle's state changed
        if (didWait) {
          deltas.push(v);
        }
    }

    if (deltas.length > 0) {
      // Delta updates scale far better over websockets
      io.emit('fleet-update', deltas);
    }
  }, UPDATE_INTERVAL);
}

module.exports = { startGpsSimulation };
