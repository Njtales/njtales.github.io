import { portfolioSpots,type PortfolioSpot } from './portfolioData'

type BuildingLayout={id:string;x:number;z:number;rectangles:readonly(readonly[number,number,number,number])[];
  entrance:readonly[number,number];path:readonly[number,number]}
const localLayouts=[
  {id:'clocktower',rectangles:[[-2.20,2.20,-1.10,1.10],[-1.90,-.40,1.10,2.0]],entrance:[-1.15,2.65],path:[-1.15,2.08]},
  {id:'cloud-forge',rectangles:[[-2.90,2.65,-1.50,1.55],[.10,1.55,1.55,2.30]],entrance:[.80,3.0],path:[.80,2.45]},
  {id:'data-tower',rectangles:[[-2.05,2.05,-1.38,1.42],[.0,1.40,1.42,2.28]],entrance:[.70,2.85],path:[.70,2.34]},
  {id:'learning-lab',rectangles:[[-2.45,2.45,-1.40,1.45],[-1.40,.05,1.45,2.25]],entrance:[-.65,2.90],path:[-.65,2.38]},
  {id:'hobbies-hut',rectangles:[[-2.20,2.25,-1.30,1.40],[.0,1.45,1.40,2.18]],entrance:[.70,2.80],path:[.70,2.28]},
  {id:'signal-station',rectangles:[[-2.45,2.45,-1.50,1.50],[.05,1.50,1.50,2.30]],entrance:[.75,3.0],path:[.75,2.44]},
  {id:'about-cottage',rectangles:[[-2.15,2.15,-1.40,1.50],[-.05,1.40,1.50,2.30]],entrance:[.65,2.95],path:[.65,2.42]},
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
