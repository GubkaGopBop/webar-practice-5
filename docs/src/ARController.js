import * as THREE from '../vendor/three.module.js';

export class ARController {
  constructor(app) {
    this.app=app; this.supported=false; this.starting=false; this.session=null;
    this.reticle=new THREE.Mesh(new THREE.RingGeometry(0.26,0.28,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x29ac84,side:THREE.DoubleSide}));
    this.reticle.matrixAutoUpdate=false; this.reticle.visible=false; app.scene.add(this.reticle);
  }
  async checkSupport() {
    const ui=this.app.ui;
    if(!isSecureContext) { ui.$('support').textContent='Для AR нужен HTTPS. Для просмотра на ПК подходит localhost.'; return; }
    try { this.supported=!!navigator.xr && await navigator.xr.isSessionSupported('immersive-ar'); }
    catch { this.supported=false; }
    ui.$('start').disabled=!this.supported;
    ui.$('support').textContent=this.supported?'AR доступна. Найдите хорошо освещённый участок пола.':'WebXR AR недоступна. Можно открыть 3D-просмотр.';
  }
  async start() {
    if(this.session||this.starting||!this.supported) return;
    this.starting=true;
    const {ui,renderer,object}=this.app;
    ui.error(); ui.$('start').disabled=true; ui.$('preview').disabled=true;
    let requested;
    try {
      // DOM overlay is required: the object's HTML controls must work in AR.
      requested=await navigator.xr.requestSession('immersive-ar',{
        requiredFeatures:['hit-test','local','dom-overlay'], domOverlay:{root:ui.$('overlay')}
      });
      this.session=requested;
      requested.addEventListener('end',()=>this.cleanup(requested),{once:true});
      requested.addEventListener('select',()=>this.place());
      requested.addEventListener('visibilitychange',()=>{this.reticle.visible=false;ui.placement(object.anchor.visible,false);});
      const viewer=await requested.requestReferenceSpace('viewer');
      const source=await requested.requestHitTestSource({space:viewer,entityTypes:['plane']});
      if(this.session!==requested) { source.cancel(); return; }
      this.source=source;
      await renderer.xr.setSession(requested);
      if(this.session!==requested) return;
      this.app.mode='ar'; this.app.scene.background=null; object.hide();
      ui.mode('ar'); ui.placement(false,false); ui.status('Двигайте телефон: ищем поверхность пола.');
    } catch(error) {
      if(requested) { await requested.end().catch(()=>{}); this.cleanup(requested); }
      ui.error(error.name==='NotAllowedError'?'Разрешите доступ к AR и камере, затем повторите.':error.name==='NotSupportedError'?'Устройство не поддерживает нужные функции AR: поиск плоскостей и HTML-интерфейс.':'Не удалось начать AR: '+error.message);
    } finally {
      this.starting=false; ui.$('start').disabled=!!this.session||!this.supported; ui.$('preview').disabled=!!this.session;
    }
  }
  cleanup(session) {
    if(this.session!==session) return;
    this.source?.cancel(); this.source=null; this.session=null; this.reticle.visible=false;
    this.app.mode='intro'; this.app.object.hide(); this.app.scene.background=new THREE.Color(0xedf1ef);
    const ui=this.app.ui; ui.mode('intro'); ui.$('start').disabled=!this.supported; ui.$('preview').disabled=false;
  }
  place() {
    if(!this.session||this.session.visibilityState!=='visible'||!this.reticle.visible||this.app.object.anchor.visible) return;
    this.app.object.place(this.reticle.matrix); this.reticle.visible=false;
    this.app.ui.placement(true,false); this.app.ui.status('Объект размещён. Меняйте цвет, модель и поворот.');
  }
  reset() { this.app.object.hide(); this.reticle.visible=false; this.app.ui.placement(false,false); }
  update(frame) {
    if(!frame||!this.session||!this.source) return;
    this.reticle.visible=false;
    if(this.session.visibilityState!=='visible'||this.app.object.anchor.visible) return;
    try {
      const reference=this.app.renderer.xr.getReferenceSpace();
      const viewer=reference && frame.getViewerPose(reference);
      const hits=viewer?frame.getHitTestResults(this.source):[];
      const pose=hits.length?hits[0].getPose(reference):null;
      if(pose) { this.reticle.matrix.fromArray(pose.transform.matrix); this.reticle.matrixWorldNeedsUpdate=true; this.reticle.visible=true; }
      this.app.ui.status(pose?'Поверхность найдена. Нажмите «Разместить здесь».':'Ищем пол. Добавьте света и медленно двигайте телефон.');
    } catch { this.app.ui.status('Поиск поверхности недоступен. Выйдите и повторите запуск AR.'); }
    this.app.ui.placement(false,this.reticle.visible);
  }
}
