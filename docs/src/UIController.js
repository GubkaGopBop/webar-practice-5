export class UIController {
  constructor() { this.$ = id => document.getElementById(id); }
  bind(app) {
    const on = (id,event,fn) => this.$(id).addEventListener(event,fn);
    on('start','click',()=>app.ar.start()); on('preview','click',()=>app.preview());
    on('exit','click',()=>app.exit()); on('place','click',()=>app.ar.place());
    on('reset','click',()=>app.ar.reset());
    on('model','change',e=>app.object.changeModel(e.target.value));
    on('color','input',e=>app.object.setColor(e.target.value));
    on('left','click',()=>app.object.rotate(-Math.PI/12));
    on('right','click',()=>app.object.rotate(Math.PI/12));
    on('auto','change',e=>{app.object.autoRotate=e.target.checked;});
    this.$('overlay').addEventListener('beforexrselect',e=>{
      if(e.target.closest('button,select,input,label,.card')) e.preventDefault();
    });
  }
  status(text) { if(this.$('status').textContent!==text) this.$('status').textContent=text; }
  error(text='') { this.$('error').textContent=text; this.$('error').hidden=!text; }
  mode(mode) {
    document.body.classList.toggle('ar',mode==='ar');
    this.$('intro').hidden=mode!=='intro'; this.$('hud').hidden=mode==='intro';
    this.$('place').hidden=mode!=='ar'; this.$('reset').hidden=true;
    if(mode==='preview') this.status('Потяните по сцене, чтобы осмотреть мебель.');
  }
  placement(placed,canPlace) {
    this.$('place').hidden=placed; this.$('place').disabled=!canPlace;
    this.$('reset').hidden=!placed;
  }
}
