import { gsap } from 'gsap';
import * as THREE from 'three';

/**
 * Pulses the scale of a Three.js object (e.g. on a kick beat).
 */
export function pulseScale(
  target: THREE.Object3D | THREE.Object3D[],
  amount = 1.2,
  duration = 0.08
) {
  const targets = Array.isArray(target) ? target : [target];
  targets.forEach((t) => {
    if (!t) return;
    gsap.killTweensOf(t.scale);
    gsap.fromTo(
      t.scale,
      { x: 1, y: 1, z: 1 },
      {
        x: amount,
        y: amount,
        z: amount,
        duration: duration,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      }
    );
  });
}

/**
 * Flashes the intensity of a light source and fades it back to a base level.
 */
export function flashLight(
  light: THREE.Light | null,
  peakIntensity: number,
  baseIntensity: number,
  duration = 0.3
) {
  if (!light) return;
  gsap.killTweensOf(light);
  gsap.fromTo(
    light,
    { intensity: peakIntensity },
    {
      intensity: baseIntensity,
      duration: duration,
      ease: 'power1.out',
    }
  );
}

/**
 * Shakes the camera by offsetting its position or rotation slightly.
 */
export function shakeCamera(
  camera: THREE.Camera | null,
  intensity = 0.2,
  duration = 0.15
) {
  if (!camera) return;
  gsap.killTweensOf(camera.position);
  
  // Store initial position
  const initialZ = camera.position.z;
  
  const tl = gsap.timeline();
  tl.to(camera.position, {
    x: `+=${(Math.random() - 0.5) * intensity}`,
    y: `+=${(Math.random() - 0.5) * intensity}`,
    duration: duration / 3,
    ease: 'power1.inOut',
  })
  .to(camera.position, {
    x: `+=${(Math.random() - 0.5) * intensity}`,
    y: `+=${(Math.random() - 0.5) * intensity}`,
    duration: duration / 3,
    ease: 'power1.inOut',
  })
  .to(camera.position, {
    x: 0,
    y: 0,
    z: initialZ,
    duration: duration / 3,
    ease: 'power1.inOut',
  });
}

/**
 * Expands a shockwave or ring and fades its opacity.
 */
export function animateRing(
  mesh: THREE.Mesh | null,
  maxScale = 6,
  duration = 0.6
) {
  if (!mesh) return;
  
  const material = mesh.material as THREE.Material;
  if (!material) return;
  
  gsap.killTweensOf(mesh.scale);
  gsap.killTweensOf(material);
  
  mesh.scale.set(0.1, 0.1, 0.1);
  material.opacity = 1;
  material.transparent = true;
  
  gsap.to(mesh.scale, {
    x: maxScale,
    y: maxScale,
    z: maxScale,
    duration: duration,
    ease: 'power2.out',
  });
  
  gsap.to(material, {
    opacity: 0,
    duration: duration,
    ease: 'power2.out',
  });
}

/**
 * Tweens color of a materials or ambient colors.
 */
export function transitionColor(
  material: THREE.MeshBasicMaterial | THREE.MeshStandardMaterial | null,
  targetColorHex: string,
  duration = 0.5
) {
  if (!material) return;
  gsap.killTweensOf(material.color);
  
  const color = new THREE.Color(targetColorHex);
  gsap.to(material.color, {
    r: color.r,
    g: color.g,
    b: color.b,
    duration: duration,
    ease: 'power1.inOut',
  });
}
