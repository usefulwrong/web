// The painting's upper edge stays on the rail; the rest can bend without stretching apart.
export function createCoatCloth() {
  // shortcut: one painted view; a rotating camera would need actual garment geometry.
  const columns = 12, rows = 28, width = 315, height = 682, points = [], links = [];
  for (let y = 0; y <= rows; y++) for (let x = 0; x <= columns; x++) {
    const ox = x * width / columns, oy = y * height / rows;
    points.push({x: ox, y: oy, z: 0, px: ox, py: oy, pz: 0, ox, oy, pinned: y <= 3});
  }
  const link = (a, b) => links.push([a, b, Math.hypot(points[a].ox - points[b].ox, points[a].oy - points[b].oy)]);
  for (let y = 0; y <= rows; y++) for (let x = 0; x <= columns; x++) {
    const i = y * (columns + 1) + x;
    if (x < columns) link(i, i + 1);
    if (y < rows) link(i, i + columns + 1);
    if (x < columns && y < rows) { link(i, i + columns + 2); link(i + 1, i + columns + 1); }
  }
  let grab = null;
  function hold(x, y) {
    let nearest = -1, distance = Infinity;
    points.forEach((p, i) => {
      if (p.pinned) return;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < distance) { distance = d; nearest = i; }
    });
    if (nearest >= 0) grab = {i: nearest, x, y};
  }
  function move(x, y) {
    if (!grab) return;
    const p = points[grab.i];
    grab.x = Math.max(p.ox - 125, Math.min(p.ox + 125, x));
    grab.y = Math.max(p.oy - 65, Math.min(p.oy + 65, y));
  }
  function impulse() {
    for (const p of points) if (!p.pinned) {
      const freedom = (p.oy / height) ** 2;
      p.px -= 15 * freedom;
      p.pz -= 12 * freedom * Math.sin(p.ox / width * Math.PI);
    }
  }
  function reset() {
    grab = null;
    for (const p of points) { p.x = p.px = p.ox; p.y = p.py = p.oy; p.z = p.pz = 0; }
  }
  function step() {
    let energy = 0;
    for (const p of points) {
      if (p.pinned) continue;
      const vx = (p.x - p.px) * .91, vy = (p.y - p.py) * .91, vz = (p.z - p.pz) * .91;
      p.px = p.x; p.py = p.y; p.pz = p.z;
      p.x += vx + (p.ox - p.x) * .009;
      p.y += vy + (p.oy - p.y) * .009;
      p.z += vz - p.z * .009;
    }
    for (let pass = 0; pass < 5; pass++) {
      if (grab) {
        const p = points[grab.i];
        p.x += (grab.x - p.x) * .65;
        p.y += (grab.y - p.y) * .65;
        p.z += (Math.abs(grab.x - p.ox) * .35 - p.z) * .25;
      }
      for (const [a, b, length] of links) {
        const p = points[a], q = points[b];
        const dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z;
        const distance = Math.hypot(dx, dy, dz);
        const correction = distance ? (distance - length) / distance * .45 : 0;
        if (!p.pinned) { p.x += dx * correction; p.y += dy * correction; p.z += dz * correction; }
        if (!q.pinned) { q.x -= dx * correction; q.y -= dy * correction; q.z -= dz * correction; }
      }
    }
    for (const p of points) energy += Math.abs(p.x - p.ox) + Math.abs(p.y - p.oy) + Math.abs(p.z);
    if (!grab && energy < .3) reset();
    return Boolean(grab) || energy >= .3;
  }
  return {points, columns, rows, hold, move, release: () => { grab = null; }, impulse, reset, step};
}
