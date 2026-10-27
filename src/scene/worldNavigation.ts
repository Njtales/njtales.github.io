import { canWalkTo as onTerrain } from './groundContours'
import { foliageObstacles } from './foliageLayout'
import { blockedByBuilding } from './buildingLayout'

export function canWalkTo(x: number, z: number) {
  if (blockedByBuilding(x,z)) return false
  for (const obstacle of foliageObstacles) {
    if (Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius + 0.42) return false
  }
  return onTerrain(x, z)
}
