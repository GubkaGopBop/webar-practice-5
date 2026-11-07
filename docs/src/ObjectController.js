import * as THREE from '../vendor/three.module.js';
import { ModelFactory } from './ModelFactory.js';

export class ObjectController {
  constructor(scene) {
    this.anchor = new THREE.Group();
    this.anchor.matrixAutoUpdate = false;
    this.anchor.visible = false;
    this.pivot = new THREE.Group();
    this.anchor.add(this.pivot);
    scene.add(this.anchor);
    this.factory = new ModelFactory();
    this.color = '#345e57';
    this.autoRotate = false;
    this.changeModel('chair');
  }
  changeModel(type) {
    const next = this.factory.create(type);
    if (this.model) {
      this.pivot.remove(this.model);
      const geometries = new Set(), materials = new Set();
      this.model.traverse(node => { if(node.isMesh) { geometries.add(node.geometry); for(const m of [].concat(node.material)) materials.add(m); } });
      geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
    }
    this.model = next;
    this.type = type;
    this.pivot.add(next);
    this.setColor(this.color);
  }
  setColor(color) {
    this.color = color;
    this.model.traverse(node => { if(node.isMesh && node.material.userData.tintable) node.material.color.set(color); });
  }
  rotate(delta) { this.pivot.rotation.y += delta; }
  update(dt) { if(this.autoRotate && this.anchor.visible) this.rotate(dt * 0.5); }
  place(matrix) { this.anchor.matrix.copy(matrix); this.anchor.matrixWorldNeedsUpdate=true; this.anchor.visible=true; }
  preview() { this.place(new THREE.Matrix4()); }
  hide() { this.anchor.visible=false; }
}
