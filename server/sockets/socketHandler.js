const { startGpsSimulation } = require('../gpsSimulator');

function initSockets(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Clients emit this to let the server know which area they are looking at
    // so we don't send them vehicles outside their view.
    // For now, doing simple delta updates is enough to reduce 90% of traffic,
    // but this sets up bounding box filtering for the future.
    socket.on('set-viewport-bounds', (bounds) => {
      socket.viewportBounds = bounds; 
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Start the simulation engine
  startGpsSimulation(io);
}

module.exports = { initSockets };
