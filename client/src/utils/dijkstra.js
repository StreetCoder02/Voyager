class Graph {
  constructor() {
    this.nodes = new Map();
  }

  addNode(id, details) {
    this.nodes.set(id, { edges: [], ...details });
  }

  addEdge(node1, node2, weight) {
    if (this.nodes.has(node1) && this.nodes.has(node2)) {
      this.nodes.get(node1).edges.push({ node: node2, weight });
      this.nodes.get(node2).edges.push({ node: node1, weight });
    }
  }

  dijkstra(startNode, endNode) {
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set();

    for (let node of this.nodes.keys()) {
      distances.set(node, Infinity);
      previous.set(node, null);
      unvisited.add(node);
    }
    
    distances.set(startNode, 0);

    while (unvisited.size > 0) {
      let currNode = null;
      let minDistance = Infinity;
      for (let node of unvisited) {
        if (distances.get(node) < minDistance) {
          minDistance = distances.get(node);
          currNode = node;
        }
      }

      if (currNode === null || currNode === endNode) break;
      unvisited.delete(currNode);

      const neighbors = this.nodes.get(currNode).edges;
      for (let neighbor of neighbors) {
        if (!unvisited.has(neighbor.node)) continue;

        const newDist = distances.get(currNode) + neighbor.weight;
        if (newDist < distances.get(neighbor.node)) {
          distances.set(neighbor.node, newDist);
          previous.set(neighbor.node, currNode);
        }
      }
    }

    const path = [];
    let curr = endNode;
    if (previous.get(curr) !== null || curr === startNode) {
      while (curr) {
        path.unshift(curr);
        curr = previous.get(curr);
      }
    }

    return path;
  }
}

export function getRoutePath(startLat, startLng, endLat, endLng) {
  const mapGraph = new Graph();
  const gridSize = 5;
  const latStep = (endLat - startLat) / gridSize;
  const lngStep = (endLng - startLng) / gridSize;

  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      mapGraph.addNode(`${i},${j}`, { lat: startLat + latStep * i, lng: startLng + lngStep * j });
    }
  }

  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      const id = `${i},${j}`;
      if (i < gridSize) mapGraph.addEdge(id, `${i + 1},${j}`, Math.random() * 2 + 1);
      if (j < gridSize) mapGraph.addEdge(id, `${i},${j + 1}`, Math.random() * 2 + 1);
    }
  }

  const pathIds = mapGraph.dijkstra('0,0', `${gridSize},${gridSize}`);
  return pathIds.map(id => ({
    lat: mapGraph.nodes.get(id).lat,
    lng: mapGraph.nodes.get(id).lng
  }));
}
