import * as THREE from '../vendor/three.module.js';
import { Environment } from './Environment.js';
import { ObjectController } from './ObjectController.js';
import { UIController } from './UIController.js';
import { ARController } from './ARController.js';

export class App {
  constructor() {
    this.mode='intro'; this.angle=0.65;
    this.scene=new THREE.Scene(); this.scene.background=new THREE.Color(0xedf1ef);
    this.camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,0.01,30);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); this.renderer.setSize(innerWidth,innerHeight);
    this.renderer.xr.enabled=true; this.renderer.xr.setReferenceSpaceType('local');
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    document.body.prepend(this.renderer.domElement);
    this.environment=new Environment(this.renderer,this.scene);
    this.object=new ObjectController(this.scene);
    this.ui=new UIController(); this.ar=new ARController(this); this.ui.bind(this);
    this.floor=new THREE.Mesh(new THREE.CircleGeometry(2,64),new THREE.MeshStandardMaterial({color:0xe0e7e1,roughness:1}));
    this.floor.rotation.x=-Math.PI/2; this.floor.position.y=-0.005; this.floor.visible=false; this.scene.add(this.floor);
    this.bindViewport(); this.ar.checkSupport();
    let last;
    this.renderer.setAnimationLoop((time,frame)=>{
      const dt=last===undefined?0:Math.min((time-last)/1000,0.05); last=time;
      this.ar.update(frame); this.object.update(dt);
      if(this.mode!=='ar') {
        this.camera.position.set(Math.sin(this.angle)*2.5,1.45,Math.cos(this.angle)*2.5);
        this.camera.lookAt(0,0.63,0);
      }
      this.floor.visible=this.mode==='preview';
      if(!this.renderer.xr.isPresenting) {
        const mobilePreview=this.mode==='preview' && innerWidth<=600;
        const bottom=mobilePreview?this.ui.$('hud').getBoundingClientRect().height+28:0;
        const top=mobilePreview?76:0;
        const height=Math.max(100,innerHeight-bottom-top);
        this.renderer.setViewport(0,bottom,innerWidth,height);
        this.camera.aspect=innerWidth/height;
        this.camera.updateProjectionMatrix();
      }
      this.renderer.render(this.scene,this.camera);
    });
  }
  preview() { if(this.ar.session||this.ar.starting)return;this.mode='preview';this.ui.error();this.object.preview();this.ui.mode('preview'); }
  async exit() {
    if(this.ar.session) { try { await this.ar.session.end(); } catch { this.ui.error('Используйте кнопку выхода из AR в браузере.'); } }
    else { this.mode='intro';this.object.hide();this.ui.mode('intro'); }
  }
  bindViewport() {
    const canvas=this.renderer.domElement; let dragging=false,lastX=0;
    canvas.addEventListener('pointerdown',e=>{if(this.mode!=='preview')return;dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(!dragging||this.mode!=='preview')return;this.angle-=(e.clientX-lastX)*0.01;lastX=e.clientX;});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{dragging=false;});
    addEventListener('resize',()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();if(!this.renderer.xr.isPresenting)this.renderer.setSize(innerWidth,innerHeight);});
    addEventListener('pagehide',()=>this.ar.session?.end().catch(()=>{}));
  }
}
