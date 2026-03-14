class Point {
  constructor(x, y, data) {
    this.x = x;
    this.y = y;
    this.data = data;
  }
}

class Rectangle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  
  contains(point) {
    return (
      point.x >= this.x - this.w &&
      point.x < this.x + this.w &&
      point.y >= this.y - this.h &&
      point.y < this.y + this.h
    );
  }

  intersects(range) {
    return !(
      range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h
    );
  }
}

class QuadTree {
  constructor(boundary, capacity) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
  }

  subdivide() {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const w = this.boundary.w;
    const h = this.boundary.h;

    this.northwest = new QuadTree(new Rectangle(x - w / 2, y - h / 2, w / 2, h / 2), this.capacity);
    this.northeast = new QuadTree(new Rectangle(x + w / 2, y - h / 2, w / 2, h / 2), this.capacity);
    this.southwest = new QuadTree(new Rectangle(x - w / 2, y + h / 2, w / 2, h / 2), this.capacity);
    this.southeast = new QuadTree(new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2), this.capacity);

    this.divided = true;
  }

  insert(point) {
    if (!this.boundary.contains(point)) return false;

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) this.subdivide();

    return (
      this.northwest.insert(point) ||
      this.northeast.insert(point) ||
      this.southwest.insert(point) ||
      this.southeast.insert(point)
    );
  }

  findNearest(searchPoint, maxRadius = 5.0, currentBest = null) {
    let bestDistSq = currentBest 
      ? Math.pow(currentBest.x - searchPoint.x, 2) + Math.pow(currentBest.y - searchPoint.y, 2) 
      : maxRadius * maxRadius;
    
    let bestPoint = currentBest ? currentBest : null;

    const searchRange = new Rectangle(searchPoint.x, searchPoint.y, Math.sqrt(bestDistSq), Math.sqrt(bestDistSq));
    if (!this.boundary.intersects(searchRange)) return bestPoint;

    for (let p of this.points) {
      const distSq = Math.pow(p.x - searchPoint.x, 2) + Math.pow(p.y - searchPoint.y, 2);
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestPoint = p;
      }
    }

    if (this.divided) {
      bestPoint = this.northwest.findNearest(searchPoint, maxRadius, bestPoint) || bestPoint;
      bestPoint = this.northeast.findNearest(searchPoint, maxRadius, bestPoint) || bestPoint;
      bestPoint = this.southwest.findNearest(searchPoint, maxRadius, bestPoint) || bestPoint;
      bestPoint = this.southeast.findNearest(searchPoint, maxRadius, bestPoint) || bestPoint;
    }

    return bestPoint;
  }
}

export { Point, Rectangle, QuadTree };
