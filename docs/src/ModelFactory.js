import * as THREE from '../vendor/three.module.js';
import { createOfficeChair } from './chair.js';

export class ModelFactory {
  create(type) {
    if (type === 'chair') {
      const chair = createOfficeChair();
      chair.traverse(node => {
        if (node.isMesh && node.material.roughness >= 0.9 && node.material.color.getHex() !== 0x111820) node.material.userData.tintable = true;
      });
      return chair;
    }
    if (type !== 'stool') throw new Error('Неизвестная модель');
    const stool = new THREE.Group();
    stool.name = 'bar-stool';
    const fabric = new THREE.MeshStandardMaterial({color:0x345e57,roughness:0.86});
    fabric.userData.tintable = true;
    const metal = new THREE.MeshStandardMaterial({color:0xb4bdc3,metalness:0.85,roughness:0.24});
    const add = (geometry, material, y) => { const mesh = new THREE.Mesh(geometry,material); mesh.position.y=y; stool.add(mesh); return mesh; };
    add(new THREE.CylinderGeometry(0.24,0.24,0.10,48),fabric,0.82);
    add(new THREE.CylinderGeometry(0.16,0.20,0.04,32),metal,0.75);
    add(new THREE.CylinderGeometry(0.035,0.045,0.66,24),metal,0.40);
    add(new THREE.CylinderGeometry(0.27,0.29,0.045,48),metal,0.0225);
    const ring=add(new THREE.TorusGeometry(0.17,0.014,12,48),metal,0.28);
    ring.rotation.x=Math.PI/2;
    return stool;
  }
}
