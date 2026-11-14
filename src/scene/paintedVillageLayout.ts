import type {VillageBuildingId} from './villageBuildingGeometry'

type PaintedBuilding={crop:readonly[number,number,number,number];height:number;shadowWidth:number;shadowDepth:number}
export const PAINTED_ATLAS={url:'/assets/buildings/village-painted-atlas-v1.png',width:1536,height:1024}
export const PAINTED_BASELINE=.04
// Pixel bounds include an 8px transparent gutter around each painted silhouette.
export const paintedBuildings:Record<VillageBuildingId,PaintedBuilding>={
  'cloud-forge':{crop:[55,155,432,340],height:5.0,shadowWidth:5.7,shadowDepth:2.6},
  'data-tower':{crop:[574,16,369,480],height:6.2,shadowWidth:4.1,shadowDepth:2.3},
  'learning-lab':{crop:[1042,86,431,407],height:5.2,shadowWidth:4.8,shadowDepth:2.4},
  'about-cottage':{crop:[71,546,384,423],height:5.8,shadowWidth:4.4,shadowDepth:2.5},
  'hobbies-hut':{crop:[532,639,445,330],height:4.5,shadowWidth:4.7,shadowDepth:2.3},
  'signal-station':{crop:[1068,517,379,453],height:8.3,shadowWidth:4.7,shadowDepth:2.6},
}

export function paintedBuildingSize(id:VillageBuildingId){
  const {crop,height}=paintedBuildings[id]
  return{width:height*crop[2]/crop[3],height}
}

/** Map a feature in the atlas to the camera-facing building's local plane. */
export function paintedArtPoint(id:VillageBuildingId,x:number,y:number,z=0):[number,number,number]{
  const {crop}=paintedBuildings[id],size=paintedBuildingSize(id)
  return[((x-crop[0])/crop[2]-.5)*size.width,(1-(y-crop[1])/crop[3]-PAINTED_BASELINE)*size.height,z]
}

export const PAINTED_FORGE_ANCHORS={
  chimney:paintedArtPoint('cloud-forge',355,170),
  hearth:paintedArtPoint('cloud-forge',310,443,.035),
  flameWidth:1.04,flameHeight:1.12,
}
