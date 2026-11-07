import * as THREE from '../vendor/three.module.js';

export class Environment {
  constructor(renderer, scene) {
    // Linear HDR radiance, including studio softboxes with values above 1.
    const width = 512, height = 256;
    const data = new Float32Array(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width, v = y / height;
        const sky = 0.16 + 0.45 * (1 - v);
        const key = Math.abs(u - 0.23) < 0.065 && Math.abs(v - 0.35) < 0.14 ? 7 : 0;
        const fill = Math.abs(u - 0.74) < 0.1 && Math.abs(v - 0.38) < 0.16 ? 3 : 0;
        const i = (y * width + x) * 4;
        data[i] = sky + key + fill * 0.85;
        data[i + 1] = sky + key * 0.96 + fill * 0.94;
        data[i + 2] = sky + key * 0.88 + fill;
        data[i + 3] = 1;
      }
    }
    const hdr = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    hdr.colorSpace = THREE.LinearSRGBColorSpace;
    hdr.needsUpdate = true;
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.target = pmrem.fromEquirectangular(hdr);
    scene.environment = this.target.texture;
    scene.environmentIntensity = 1;
    hdr.dispose();
    pmrem.dispose();
  }
  dispose() { this.target.dispose(); }
}
