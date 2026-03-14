import { Point, Rectangle, QuadTree } from '../utils/quadtree.js';
import { getRoutePath } from '../utils/dijkstra.js';

self.onmessage = function (e) {
  const { type, payload } = e.data;

  if (type === 'FIND_NEAREST_AND_ROUTE') {
    const { vehicles, targetLat, targetLng } = payload;
    
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    
    for (const v of vehicles) {
      if (v.latitude < minLat) minLat = v.latitude;
      if (v.latitude > maxLat) maxLat = v.latitude;
      if (v.longitude < minLng) minLng = v.longitude;
      if (v.longitude > maxLng) maxLng = v.longitude;
    }

    const w = (maxLat - minLat) / 2 || 1;
    const h = (maxLng - minLng) / 2 || 1;
    const cx = minLat + w;
    const cy = minLng + h;

    const boundary = new Rectangle(cx, cy, Math.max(w, 0.001), Math.max(h, 0.001));
    const qt = new QuadTree(boundary, 4);

    for (const v of vehicles) {
      qt.insert(new Point(v.latitude, v.longitude, v));
    }

    const nearest = qt.findNearest(new Point(targetLat, targetLng, null), Math.max(w, h));
    
    if (!nearest) {
      self.postMessage({ type: 'RESULT', payload: { error: 'No drivers found' } });
      return;
    }

    const driver = nearest.data;
    const route = getRoutePath(driver.latitude, driver.longitude, targetLat, targetLng);

    self.postMessage({
      type: 'RESULT',
      payload: { driver, route }
    });
  }
};
