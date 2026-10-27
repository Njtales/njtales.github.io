import { portfolioSpots,type PortfolioSpot } from './portfolioData'

type BuildingLayout={id:string;x:number;z:number;rectangles:readonly(readonly[number,number,number,number])[];
  entrance:readonly[number,number];path:readonly[number,number]}
const localLayouts=[
  {id:'clocktower',rectangles:[[-1.25,1.25,-1.04,1.13],[-.88,.44,1.13,1.82],[.90,2.24,-.12,1.62]],entrance:[0,2.7],path:[0,2.1]},
  {id:'cloud-forge',rectangles:[[-1.94,1.94,-1.55,1.55],[-2.82,-1.7,-1.28,1.4],[.45,1.75,1.55,2.33]],entrance:[1.10,2.85],path:[1.10,2.35]},
  {id:'data-tower',rectangles:[[-1.38,1.38,-1.38,1.42],[-2.10,-1.1,-.78,.88],[-.70,.70,1.42,2.28]],entrance:[0,2.8],path:[0,2.30]},
  {id:'learning-lab',rectangles:[[-1.67,1.1,-1.5,1.5],[.8,2.27,-1.38,1.60],[-.98,.4,1.5,2.28]],entrance:[-.30,2.85],path:[-.30,2.35]},
  {id:'hobbies-hut',rectangles:[[-1.80,1.80,-1.44,1.46],[.04,1.32,1.46,2.18]],entrance:[.68,2.7],path:[.68,2.20]},
  {id:'signal-station',rectangles:[[-1.22,1.22,-1.22,1.23],[-.70,.70,1.23,1.89]],entrance:[0,2.55],path:[0,2.02]},
  {id:'about-cottage',rectangles:[[-1.86,1.86,-1.51,1.51],[-.9,.5,1.51,2.31],[.2,1.65,1.51,2.18]],entrance:[-.2,2.9],path:[-.2,2.4]},
] as const
export const buildingFootprints:BuildingLayout[]=localLayouts.map(layout=>{
  const spot=portfolioSpots.find(spot=>spot.id===layout.id)!
  return{...layout,x:spot.position[0],z:spot.position[2]}
})

export function blockedByBuilding(x:number,z:number,clearance=.42) {
  return buildingFootprints.some(building=>building.rectangles.some(([minX,maxX,minZ,maxZ])=>{
    const dx=Math.max(minX-(x-building.x),0,x-building.x-maxX)
    const dz=Math.max(minZ-(z-building.z),0,z-building.z-maxZ)
    return Math.hypot(dx,dz)<clearance
  }))
}

export const entranceInteractionRadius=3.4
export function findNearbyLandmark(x:number,z:number){
  let nearest:PortfolioSpot|null=null,distance=entranceInteractionRadius
  for(const building of buildingFootprints){
    const next=Math.hypot(x-building.x-building.entrance[0],z-building.z-building.entrance[1])
    if(next<distance){distance=next;nearest=portfolioSpots.find(spot=>spot.id===building.id)??null}
  }
  return nearest
}
