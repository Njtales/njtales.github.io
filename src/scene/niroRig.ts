import { createRef, type RefObject } from 'react'
import type * as THREE from 'three'

export const NIRO = {
  upperLeg:0.46,lowerLeg:0.44,hipHeight:0.90,ankleHeight:0.095,
  stanceWidth:0.23,stepTravel:0.68,frontReach:0.32,
  maxSpeed:4.2,turnResponse:24,maxTurnSpeed:16,gravity:12,stepUp:0.22,snapDown:0.12,
} as const
type GroupRef=RefObject<THREE.Group|null>
export type NiroRig={
  torso:GroupRef;leftHip:GroupRef;rightHip:GroupRef;leftKnee:GroupRef;rightKnee:GroupRef
  leftFoot:GroupRef;rightFoot:GroupRef;leftArm:GroupRef;rightArm:GroupRef;tail:GroupRef;eyes:GroupRef
}
export function createNiroRig():NiroRig{
  return {torso:createRef(),leftHip:createRef(),rightHip:createRef(),leftKnee:createRef(),rightKnee:createRef(),
    leftFoot:createRef(),rightFoot:createRef(),leftArm:createRef(),rightArm:createRef(),tail:createRef(),eyes:createRef()}
}
