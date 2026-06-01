import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// 1. Initialize Three.js Scene
const initThreeJS = () => {
  const canvasContainer = document.getElementById('canvas-container');
  if (!canvasContainer) return;

  const scene = new THREE.Scene();
  // Add a soft fog to blend the edges of the particles
  scene.fog = new THREE.FogExp2(0x0d0d12, 0.001);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  canvasContainer.appendChild(renderer.domElement);

  // Particles
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 1500;
  const posArray = new Float32Array(particlesCount * 3);
  const colorsArray = new Float32Array(particlesCount * 3);

  const color1 = new THREE.Color(0x9d4edd); // Primary purple
  const color2 = new THREE.Color(0xff9e00); // Accent orange

  for(let i = 0; i < particlesCount * 3; i+=3) {
    // Spread particles in a wide area
    posArray[i] = (Math.random() - 0.5) * 100;
    posArray[i+1] = (Math.random() - 0.5) * 100;
    posArray[i+2] = (Math.random() - 0.5) * 100;

    // Mix colors
    const mixedColor = color1.clone().lerp(color2, Math.random());
    colorsArray[i] = mixedColor.r;
    colorsArray[i+1] = mixedColor.g;
    colorsArray[i+2] = mixedColor.b;
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // Mouse Interaction
  let mouseX = 0;
  let mouseY = 0;

  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) - 0.5;
    mouseY = (event.clientY / window.innerHeight) - 0.5;
  });

  // Animation Loop
  const clock = new THREE.Clock();

  const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Slowly rotate the particle system
    particlesMesh.rotation.y = elapsedTime * 0.05;
    particlesMesh.rotation.x = elapsedTime * 0.02;

    // Subtle reaction to mouse
    camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 5 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
  };

  tick();

  // Handle Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
};

// 2. Initialize GSAP Animations
const initGSAP = () => {
  // Hero Animation
  const heroTl = gsap.timeline();
  heroTl.from('.hero-title', { y: 50, opacity: 0, duration: 1, ease: 'power3.out' })
        .from('.hero-subtitle', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
        .from('.hero-description', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
        .from('.hero-actions', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4');

  // Feature Sections Scroll Animations
  const sections = document.querySelectorAll('.feature-section');
  
  sections.forEach((section) => {
    const textElements = section.querySelectorAll('.feature-text > *');
    const imageElements = section.querySelectorAll('.image-glass');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        end: 'bottom 25%',
        toggleActions: 'play none none reverse'
      }
    });

    tl.from(textElements, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power2.out'
    }).from(imageElements, {
      y: 60,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'back.out(1.7)'
    }, '-=0.6');
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  initGSAP();
});
