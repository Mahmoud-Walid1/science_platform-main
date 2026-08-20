/**
 * Liquid & Material Shaders (Three.js Custom Materials)
 * Single Responsibility: Generates high-performance procedural shaders for realistic liquids, oil density stratification & glass reflection.
 */

import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';

export function createLiquidMaterial({ color = 0x38bdf8, opacity = 0.8, roughness = 0.1 } = {}) {
    return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        transmission: 0.85,
        opacity: opacity,
        transparent: true,
        roughness: roughness,
        ior: 1.333, // Water refractive index
        thickness: 1.2,
        specularIntensity: 1.0,
        specularColor: new THREE.Color(0xffffff),
        side: THREE.DoubleSide
    });
}

export function createOilMaterial() {
    return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xfacc15), // Golden yellow oil
        transmission: 0.75,
        opacity: 0.88,
        transparent: true,
        roughness: 0.2,
        ior: 1.47, // Vegetable oil refractive index
        thickness: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide
    });
}

export function createGlassMaterial() {
    return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xffffff),
        transmission: 0.95,
        opacity: 0.3,
        transparent: true,
        roughness: 0.05,
        ior: 1.5,
        thickness: 0.8,
        specularIntensity: 1.0,
        side: THREE.DoubleSide
    });
}

export function createWaveShaderMaterial(baseColorHex = 0x38bdf8) {
    const uniforms = {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(baseColorHex) },
        uWaveAmp: { value: 0.05 }
    };

    const vertexShader = `
        uniform float uTime;
        uniform float uWaveAmp;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
            vUv = uv;
            vNormal = normal;
            vec3 pos = position;
            float wave = sin(pos.x * 10.0 + uTime * 3.0) * cos(pos.z * 10.0 + uTime * 2.5) * uWaveAmp;
            pos.y += wave;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `;

    const fragmentShader = `
        uniform vec3 uColor;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
            float alpha = 0.82;
            vec3 lightDir = normalize(vec3(1.0, 2.0, 1.5));
            float diff = max(dot(vNormal, lightDir), 0.3);
            gl_FragColor = vec4(uColor * diff + vec3(0.1), alpha);
        }
    `;

    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    });
}
