import { canWalkTo } from './worldNavigation'

export type WalkPoint = { x: number; z: number }
const step = .55, minX = -33, minZ = -15, width = 122, height = 78
const walkable = new Int8Array(width * height)
const point = (index: number): WalkPoint => ({ x: minX + (index % width) * step, z: minZ + Math.floor(index / width) * step })
function open(index: number) {
  if (!walkable[index]) { const p = point(index); walkable[index] = canWalkTo(p.x, p.z) ? 1 : -1 }
  return walkable[index] === 1
}
export function clearWalkingLine(a: WalkPoint, b: WalkPoint) {
  const count = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / .14))
  for (let i = 1; i <= count; i++) if (!canWalkTo(a.x + (b.x - a.x) * i / count, a.z + (b.z - a.z) * i / count)) return false
  return true
}
function nearest(p: WalkPoint) {
  const x = Math.round((p.x - minX) / step), z = Math.round((p.z - minZ) / step)
  let best = -1, distance = Infinity
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const nx = x + dx, nz = z + dz, index = nz * width + nx
    if (nx < 0 || nz < 0 || nx >= width || nz >= height || !open(index)) continue
    const candidate = point(index), d = Math.hypot(p.x - candidate.x, p.z - candidate.z)
    if (d < distance && clearWalkingLine(p, candidate) && clearWalkingLine(candidate, p)) { best = index; distance = d }
  }
  return best
}

/** A* runs only on destination clicks. Cached cells and line smoothing keep it small. */
export function findWalkingPath(start: WalkPoint, goal: WalkPoint): WalkPoint[] {
  if (!canWalkTo(goal.x, goal.z)) return []
  if (clearWalkingLine(start, goal)) return [goal]
  const from = nearest(start), to = nearest(goal)
  if (from < 0 || to < 0) return []
  const costs = new Float32Array(width * height).fill(Infinity), previous = new Int32Array(width * height).fill(-1)
  const closed = new Uint8Array(width * height), heap: { index: number; score: number }[] = []
  const estimate = (index: number) => Math.hypot(index % width - to % width, Math.floor(index / width) - Math.floor(to / width))
  function push(index: number, score: number) {
    let child = heap.length; heap.push({ index, score })
    while (child > 0) { const parent = (child - 1) >> 1; if (heap[parent].score <= score) break
      heap[child] = heap[parent]; child = parent }
    heap[child] = { index, score }
  }
  function pop() {
    const first = heap[0], last = heap.pop()!
    if (heap.length) {
      let parent = 0
      while (parent * 2 + 1 < heap.length) {
        let child = parent * 2 + 1
        if (child + 1 < heap.length && heap[child + 1].score < heap[child].score) child++
        if (heap[child].score >= last.score) break
        heap[parent] = heap[child]; parent = child
      }
      heap[parent] = last
    }
    return first.index
  }
  costs[from] = 0; push(from, estimate(from))
  while (heap.length) {
    const current = pop()
    if (closed[current]) continue
    if (current === to) {
      const path = [goal]
      for (let index = to; index >= 0; index = previous[index]) path.push(point(index))
      path.push(start); path.reverse()
      const smooth: WalkPoint[] = []; let anchor = 0
      while (anchor < path.length - 1) {
        let next = path.length - 1
        while (next > anchor + 1 && !clearWalkingLine(path[anchor], path[next])) next--
        smooth.push(path[next]); anchor = next
      }
      return smooth
    }
    closed[current] = 1
    const x = current % width, z = Math.floor(current / width), a = point(current)
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue
      const nx = x + dx, nz = z + dz, next = nz * width + nx
      if (nx < 0 || nz < 0 || nx >= width || nz >= height || closed[next] || !open(next)) continue
      if (dx && dz && (!open(z * width + nx) || !open(nz * width + x))) continue
      const cost = costs[current] + Math.hypot(dx, dz)
      if (cost >= costs[next] || !clearWalkingLine(a, point(next))) continue
      costs[next] = cost; previous[next] = current; push(next, cost + estimate(next))
    }
  }
  return []
}
