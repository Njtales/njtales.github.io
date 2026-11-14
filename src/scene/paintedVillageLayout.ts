import type {VillageBuildingId} from './villageBuildingGeometry'

type PaintedBuilding={crop:readonly[number,number,number,number];height:number;shadowWidth:number;shadowDepth:number}
export const PAINTED_ATLAS={url:'/assets/buildings/village-distinct-atlas-v2.png',width:1536,height:1024}
export const PAINTED_BASELINE=.04
// Pixel bounds include an 8px transparent gutter around each painted silhouette.
export const paintedBuildings:Record<VillageBuildingId,PaintedBuilding>={
  'cloud-forge':{crop:[39,93,488,353],height:4.8,shadowWidth:5.8,shadowDepth:2.6},
  'data-tower':{crop:[574,39,428,410],height:5.5,shadowWidth:4.8,shadowDepth:2.4},
  'learning-lab':{crop:[1052,27,452,420],height:5.3,shadowWidth:5.0,shadowDepth:2.5},
  'about-cottage':{crop:[72,498,378,429],height:5.8,shadowWidth:4.4,shadowDepth:2.5},
  'hobbies-hut':{crop:[511,605,522,327],height:3.7,shadowWidth:4.7,shadowDepth:2.3},
  'signal-station':{crop:[1115,490,324,445],height:8.6,shadowWidth:4.7,shadowDepth:2.6},
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
  chimney:paintedArtPoint('cloud-forge',163,108),
  hearth:paintedArtPoint('cloud-forge',334,381,.035),
  flameWidth:.97,flameHeight:.93,
}
