import * as THREE from 'three'
import { NIRO,type NiroRig } from './niroRig'

export type SurfaceSample={position:THREE.Vector3;normal:THREE.Vector3;supported:boolean}
export type GroundSampler=(x:number,z:number,out:SurfaceSample)=>void
export function surfaceSample():SurfaceSample{return{position:new THREE.Vector3(),normal:new THREE.Vector3(0,1,0),supported:true}}
export type VerticalState={height:number;velocity:number;grounded:boolean}

/** Ground contact has no visual height lag. Unsupported drops use gravity. */
export function integrateNiroHeight(state:VerticalState,ground:number,delta:number){
  const gap=state.height-ground
  if(state.grounded && gap<=NIRO.snapDown && gap>=-NIRO.stepUp){
    state.height=ground;state.velocity=0;return
  }
  state.grounded=false
  let remaining=Math.min(delta,0.05)
  while(remaining>0){
    const dt=Math.min(remaining,1/120)
    state.height+=state.velocity*dt-NIRO.gravity*dt*dt*0.5
    state.velocity-=NIRO.gravity*dt
    if(state.height<=ground){state.height=ground;state.velocity=0;state.grounded=true;break}
    remaining-=dt
  }
}

type Foot={surface:SurfaceSample;from:THREE.Vector3;fromNormal:THREE.Vector3;target:SurfaceSample;
  elapsed:number;duration:number;yaw:number;fromYaw:number;recover:boolean}
const down=new THREE.Vector3(0,-1,0)

/** World-space foot plants plus two-bone IK. Geometry is never rebuilt here. */
export class NiroWalker{
  readonly feet:Foot[]=[0,1].map(()=>({surface:surfaceSample(),from:new THREE.Vector3(),
    fromNormal:new THREE.Vector3(0,1,0),target:surfaceSample(),elapsed:0,duration:0.2,yaw:0,fromYaw:0,recover:false}))
  active=-1
  footfalls=0
  maxReachError=0
  phase=0
  private initialized=false
  private next=0
  private first=true
  private pelvisHeight=0
  private lastYaw=0
  private armSwing=0
  private forward=new THREE.Vector3()
  private right=new THREE.Vector3()
  private travelForward=new THREE.Vector3(0,0,1)
  private previousBody=new THREE.Vector3()
  private hip=new THREE.Vector3()
  private ankle=new THREE.Vector3()
  private direction=new THREE.Vector3()
  private bend=new THREE.Vector3()
  private knee=new THREE.Vector3()
  private segment=new THREE.Vector3()
  private normal=new THREE.Vector3()
  private footForward=new THREE.Vector3()
  private footRight=new THREE.Vector3()
  private matrix=new THREE.Matrix4()
  private upperQ=new THREE.Quaternion()
  private lowerQ=new THREE.Quaternion()
  private inverseQ=new THREE.Quaternion()
  private footQ=new THREE.Quaternion()
  private pitchQ=new THREE.Quaternion()
  private xAxis=new THREE.Vector3(1,0,0)

  constructor(private sampleGround:GroundSampler){}

  /** During a sharp pivot, pause body travel before stretching a planted leg.
   * The other paw can finish its step and establish a new support position. */
  constrainTravel(position:THREE.Vector3,previous:THREE.Vector3,yaw:number){
    if(!this.initialized)return
    const moveX=position.x-previous.x,moveZ=position.z-previous.z
    const a=moveX*moveX+moveZ*moveZ
    if(a<1e-12)return
    let fraction=1
    this.feet.forEach((foot,index)=>{
      if(this.active===index)return
      const side=(index===0?-1:1)*NIRO.stanceWidth,n=foot.surface.normal
      const x=previous.x+Math.cos(yaw)*side-foot.surface.position.x-n.x*NIRO.ankleHeight
      const z=previous.z-Math.sin(yaw)*side-foot.surface.position.z-n.z*NIRO.ankleHeight
      const vertical=Math.max(0.15,position.y+NIRO.hipHeight-0.13-foot.surface.position.y-n.y*NIRO.ankleHeight)
      const radius=Math.min(0.53,Math.sqrt(Math.max(0.04,(NIRO.upperLeg+NIRO.lowerLeg-0.002)**2-vertical*vertical)))
      if((x+moveX)**2+(z+moveZ)**2<=radius*radius)return
      const b=2*(x*moveX+z*moveZ),c=x*x+z*z-radius*radius
      const exit=(-b+Math.sqrt(Math.max(0,b*b-4*a*c)))/(2*a)
      fraction=Math.min(fraction,THREE.MathUtils.clamp(exit,0,1))
    })
    position.x=previous.x+moveX*fraction;position.z=previous.z+moveZ*fraction
  }

  private restPoint(index:number,position:THREE.Vector3,ahead:number,out:THREE.Vector3,travelling=false){
    const side=index===0?-1:1
    out.copy(position).addScaledVector(this.right,side*NIRO.stanceWidth)
      .addScaledVector(travelling?this.travelForward:this.forward,ahead)
  }
  private initialize(position:THREE.Vector3,yaw:number){
    this.feet.forEach((foot,index)=>{
      this.restPoint(index,position,0.035,foot.from)
      this.sampleGround(foot.from.x,foot.from.z,foot.surface)
      foot.yaw=yaw;foot.fromYaw=yaw
    })
    this.initialized=true;this.active=-1;this.first=true
  }
  private start(index:number,speed:number,yaw:number,recover:boolean){
    const foot=this.feet[index]
    foot.from.copy(foot.surface.position);foot.fromNormal.copy(foot.surface.normal);foot.fromYaw=foot.yaw
    foot.elapsed=0;foot.recover=recover
    foot.duration=recover?0.16:this.first?0.14:THREE.MathUtils.clamp(NIRO.stepTravel/Math.max(speed,1.8),0.18,0.38)
    foot.yaw=yaw;this.first=false;this.active=index
  }

  update(rig:NiroRig,position:THREE.Vector3,yaw:number,speed:number,distance:number,delta:number,time:number,grounded:boolean,velocity?:THREE.Vector2){
    const yawDelta=THREE.MathUtils.euclideanModulo(yaw-this.lastYaw+Math.PI,Math.PI*2)-Math.PI
    const yawRate=this.initialized?yawDelta/Math.max(delta,0.001):0
    this.lastYaw=yaw
    this.forward.set(Math.sin(yaw),0,Math.cos(yaw));this.right.set(Math.cos(yaw),0,-Math.sin(yaw))
    const moving=speed>0.045
    if(velocity&&velocity.lengthSq()>0.002){this.travelForward.set(velocity.x,0,velocity.y).normalize()}
    else if(this.initialized&&distance>0.0001){this.travelForward.subVectors(position,this.previousBody).setY(0).normalize()}
    else this.travelForward.copy(this.forward)
    this.previousBody.copy(position)
    this.phase+=distance/(NIRO.stepTravel*2)*Math.PI*2
    if(!this.initialized && grounded)this.initialize(position,yaw)
    if(!grounded){
      this.initialized=false;this.active=-1
      this.feet.forEach((foot,index)=>{
        this.restPoint(index,position,0.06,foot.surface.position)
        foot.surface.position.y=position.y+0.03;foot.surface.normal.set(0,1,0);foot.yaw=yaw
      })
    }else{
      if(this.active<0){
        if(moving)this.start(this.next,NIRO.maxSpeed,yaw,false)
        else{
          let candidate=-1,largest=0.08
          this.feet.forEach((foot,index)=>{
            this.restPoint(index,position,0.035,this.ankle)
            const error=Math.hypot(this.ankle.x-foot.surface.position.x,this.ankle.z-foot.surface.position.z)
            const turn=Math.abs(THREE.MathUtils.euclideanModulo(foot.yaw-yaw+Math.PI,Math.PI*2)-Math.PI)
            if(error>largest || turn>0.30){candidate=index;largest=error}
          })
          if(candidate>=0)this.start(candidate,0,yaw,true)
          else this.first=true
        }
      }
      if(this.active>=0){
        const foot=this.feet[this.active]
        // Landing prediction follows travel, not the heading still turning
        // toward it. Finish the swing earlier when the support paw is stretched.
        const support=this.feet[1-this.active],side=(this.active===0?1:-1)*NIRO.stanceWidth
        const supportX=position.x+this.right.x*side-support.surface.position.x
        const supportZ=position.z+this.right.z*side-support.surface.position.z
        const prediction=0.06*THREE.MathUtils.clamp(Math.abs(yawRate)/6,0,1)
        const predictedYaw=yaw+THREE.MathUtils.clamp(yawRate*prediction,-0.55,0.55)
        const futureX=position.x+this.travelForward.x*speed*prediction+Math.cos(predictedYaw)*side-support.surface.position.x
        const futureZ=position.z+this.travelForward.z*speed*prediction-Math.sin(predictedYaw)*side-support.surface.position.z
        const reachRisk=Math.max(Math.hypot(supportX,supportZ),Math.hypot(futureX,futureZ))
        const urgency=THREE.MathUtils.clamp((reachRisk-0.28)/0.16,0,1)
        foot.elapsed=Math.min(foot.duration,foot.elapsed+delta*(1+urgency*3))
        const t=foot.elapsed/foot.duration,u=t*t*(3-2*t)
        const reach=THREE.MathUtils.lerp(0.055,NIRO.frontReach,THREE.MathUtils.clamp(speed/NIRO.maxSpeed,0,1))
        const ahead=foot.recover||!moving?0.035:speed*(foot.duration-foot.elapsed)+reach
        this.restPoint(this.active,position,ahead,this.ankle,moving&&!foot.recover)
        this.sampleGround(this.ankle.x,this.ankle.z,foot.target)
        if(!foot.target.supported){
          this.restPoint(this.active,position,0.035,this.ankle)
          this.sampleGround(this.ankle.x,this.ankle.z,foot.target)
        }
        foot.surface.position.lerpVectors(foot.from,foot.target.position,u)
        foot.surface.position.y+=Math.sin(t*Math.PI)*(foot.recover?0.065:0.115)
        foot.surface.normal.lerpVectors(foot.fromNormal,foot.target.normal,u).normalize()
        const turn=THREE.MathUtils.euclideanModulo(yaw-foot.fromYaw+Math.PI,Math.PI*2)-Math.PI
        foot.yaw=foot.fromYaw+turn*u
        if(t>=1){
          this.next=1-this.active;this.active=-1;this.footfalls++
          // Transfer support immediately; an extra both-planted frame caused
          // the old rear leg to pull the pelvis down at every direction change.
          if(moving)this.start(this.next,NIRO.maxSpeed,yaw,false)
        }
      }
    }

    let pelvis=moving?Math.sin(this.phase*2)*0.012:Math.sin(time*1.7)*0.006
    const maxLength=NIRO.upperLeg+NIRO.lowerLeg-0.002
    if(grounded){
      this.feet.forEach((foot,index)=>{
        // Keep the departing paw reachable through toe-off, then let the
        // airborne leg bend without pulling the whole torso down.
        if(index===this.active&&foot.elapsed/foot.duration>0.16)return
        const dx=foot.surface.position.x+foot.surface.normal.x*NIRO.ankleHeight-position.x
        const dz=foot.surface.position.z+foot.surface.normal.z*NIRO.ankleHeight-position.z
        const lx=dx*Math.cos(yaw)-dz*Math.sin(yaw)-(index===0?-1:1)*NIRO.stanceWidth
        const lz=dx*Math.sin(yaw)+dz*Math.cos(yaw)
        const vertical=Math.sqrt(Math.max(0.02,maxLength*maxLength-lx*lx-lz*lz))
        pelvis=Math.min(pelvis,foot.surface.position.y+foot.surface.normal.y*NIRO.ankleHeight-position.y+vertical-NIRO.hipHeight)
      })
    }
    pelvis=Math.max(-0.16,pelvis)
    this.pelvisHeight=Math.min(pelvis,THREE.MathUtils.damp(this.pelvisHeight,pelvis,14,delta))
    pelvis=this.pelvisHeight
    if(this.active>=0){
      // On a rising slope, lift the free paw enough to stay within the leg's
      // reach instead of letting the IK clamp it and look like a short leg.
      const foot=this.feet[this.active],side=(this.active===0?-1:1)*NIRO.stanceWidth
      const dx=foot.surface.position.x+foot.surface.normal.x*NIRO.ankleHeight-position.x-Math.cos(yaw)*side
      const dz=foot.surface.position.z+foot.surface.normal.z*NIRO.ankleHeight-position.z+Math.sin(yaw)*side
      const vertical=Math.sqrt(Math.max(0.001,maxLength*maxLength-dx*dx-dz*dz))
      const minimum=position.y+NIRO.hipHeight+pelvis-vertical-foot.surface.normal.y*NIRO.ankleHeight
      foot.surface.position.y=Math.max(foot.surface.position.y,minimum+0.001)
    }
    if(rig.torso.current){
      rig.torso.current.position.y=pelvis
      rig.torso.current.rotation.z=THREE.MathUtils.damp(rig.torso.current.rotation.z,moving?Math.sin(this.phase)*.014:-.025,12,delta)
      rig.torso.current.rotation.y=THREE.MathUtils.damp(rig.torso.current.rotation.y,moving?0:.035,12,delta)
      rig.torso.current.rotation.x=THREE.MathUtils.damp(rig.torso.current.rotation.x,moving?.025:-.015,12,delta)
    }
    this.feet.forEach((foot,index)=>this.solveLeg(rig,index,foot,position,yaw,pelvis))
    const armPhase=this.active>=0?(this.active*Math.PI+this.feet[this.active].elapsed/this.feet[this.active].duration*Math.PI):this.phase
    this.armSwing=THREE.MathUtils.damp(this.armSwing,moving?-Math.cos(armPhase)*0.26:0,24,delta)
    if(rig.leftArm.current)rig.leftArm.current.rotation.x=this.armSwing+(moving?0:-.035)
    if(rig.rightArm.current)rig.rightArm.current.rotation.x=-this.armSwing+(moving?0:.055)
    if(rig.tail.current){rig.tail.current.rotation.y=Math.sin(time*2+this.phase)*0.065;rig.tail.current.rotation.x=Math.sin(time*1.8)*0.025}
    if(rig.eyes.current){const blink=time%4.7;rig.eyes.current.scale.y=blink>4.48?Math.max(0.10,Math.abs(blink-4.59)/0.11):1}
  }

  private solveLeg(rig:NiroRig,index:number,foot:Foot,position:THREE.Vector3,yaw:number,pelvis:number){
    const upper=(index===0?rig.leftHip:rig.rightHip).current
    const lower=(index===0?rig.leftKnee:rig.rightKnee).current
    const paw=(index===0?rig.leftFoot:rig.rightFoot).current
    if(!upper||!lower||!paw)return
    const cos=Math.cos(yaw),sin=Math.sin(yaw),p=foot.surface.position,n=foot.surface.normal
    const dx=p.x+n.x*NIRO.ankleHeight-position.x,dz=p.z+n.z*NIRO.ankleHeight-position.z
    this.ankle.set(dx*cos-dz*sin,p.y+n.y*NIRO.ankleHeight-position.y,dx*sin+dz*cos)
    this.hip.set((index===0?-1:1)*NIRO.stanceWidth,NIRO.hipHeight+pelvis,0)
    this.direction.subVectors(this.ankle,this.hip)
    const requested=this.direction.length()
    const length=THREE.MathUtils.clamp(requested,0.03,NIRO.upperLeg+NIRO.lowerLeg-0.0001)
    this.maxReachError=Math.max(this.maxReachError,Math.abs(requested-length))
    this.direction.normalize()
    this.bend.set(0,0,1).addScaledVector(this.direction,-this.direction.z).normalize()
    const along=(NIRO.upperLeg**2-NIRO.lowerLeg**2+length*length)/(2*length)
    const height=Math.sqrt(Math.max(0,NIRO.upperLeg**2-along*along))
    this.knee.copy(this.hip).addScaledVector(this.direction,along).addScaledVector(this.bend,height)
    this.ankle.copy(this.hip).addScaledVector(this.direction,length)
    this.segment.subVectors(this.knee,this.hip).normalize()
    this.upperQ.setFromUnitVectors(down,this.segment)
    this.segment.subVectors(this.ankle,this.knee).normalize()
    this.lowerQ.setFromUnitVectors(down,this.segment)
    upper.position.copy(this.hip);upper.quaternion.copy(this.upperQ)
    lower.quaternion.copy(this.inverseQ.copy(this.upperQ).invert()).multiply(this.lowerQ)
    this.normal.set(n.x*cos-n.z*sin,n.y,n.x*sin+n.z*cos)
    this.footForward.set(Math.sin(foot.yaw-yaw),0,Math.cos(foot.yaw-yaw))
      .addScaledVector(this.normal,-this.footForward.dot(this.normal)).normalize()
    this.footRight.crossVectors(this.normal,this.footForward).normalize()
    this.footForward.crossVectors(this.footRight,this.normal).normalize()
    this.matrix.makeBasis(this.footRight,this.normal,this.footForward)
    this.footQ.setFromRotationMatrix(this.matrix)
    if(this.active===index){
      const t=foot.elapsed/foot.duration
      this.footQ.multiply(this.pitchQ.setFromAxisAngle(this.xAxis,-Math.sin(t*Math.PI)*0.12))
    }
    paw.quaternion.copy(this.inverseQ.copy(this.lowerQ).invert()).multiply(this.footQ)
  }
}
