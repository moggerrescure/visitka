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
  scene.fog = new THREE.FogExp2(0x0d0d12, 0.001);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 40;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  canvasContainer.appendChild(renderer.domElement);

  // Neural Network Particles & Lines
  const particlesCount = 400; // Reduced for performance with lines
  const positions = new Float32Array(particlesCount * 3);
  const velocities = [];

  const color1 = new THREE.Color(0x9d4edd); // Purple
  const color2 = new THREE.Color(0xff9e00); // Orange

  for(let i = 0; i < particlesCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    
    velocities.push({
      x: (Math.random() - 0.5) * 0.05,
      y: (Math.random() - 0.5) * 0.05,
      z: (Math.random() - 0.5) * 0.05,
      explodeX: 0,
      explodeY: 0,
      explodeZ: 0
    });
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.4,
    color: 0x9d4edd,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // Lines
  const linesMaterial = new THREE.LineBasicMaterial({
    color: 0xff9e00,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
  });
  
  const linesGeometry = new THREE.BufferGeometry();
  const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
  scene.add(linesMesh);

  // Mouse Interaction & Shockwave
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) * 0.05;
    mouseY = (event.clientY - windowHalfY) * 0.05;
  });

  const raycaster = new THREE.Raycaster();
  const mouseVec = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const clickTarget = new THREE.Vector3();

  window.addEventListener('click', (event) => {
    // Normalize mouse coordinates for raycasting
    mouseVec.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseVec.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouseVec, camera);
    raycaster.ray.intersectPlane(plane, clickTarget);

    const posAttribute = particlesGeometry.attributes.position;
    for (let i = 0; i < particlesCount; i++) {
      const px = posAttribute.array[i * 3];
      const py = posAttribute.array[i * 3 + 1];
      const pz = posAttribute.array[i * 3 + 2];
      
      const dx = px - clickTarget.x;
      const dy = py - clickTarget.y;
      const dz = pz - clickTarget.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      // If particle is near the click, apply an explosive outward force
      if (dist < 40 && dist > 0.1) {
        const force = (40 - dist) / 40; 
        velocities[i].explodeX += (dx / dist) * force * 2.5;
        velocities[i].explodeY += (dy / dist) * force * 2.5;
        velocities[i].explodeZ += (dz / dist) * force * 2.5;
      }
    }
  });

  // Animation Loop
  const clock = new THREE.Clock();

  const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    
    // Smooth camera movement
    targetX = mouseX * 0.5;
    targetY = mouseY * 0.5;
    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.y += (-targetY - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    // Update particle positions
    const posAttribute = particlesGeometry.attributes.position;
    for (let i = 0; i < particlesCount; i++) {
      posAttribute.array[i * 3] += velocities[i].x + velocities[i].explodeX;
      posAttribute.array[i * 3 + 1] += velocities[i].y + velocities[i].explodeY;
      posAttribute.array[i * 3 + 2] += velocities[i].z + velocities[i].explodeZ;
      
      // Apply damping to the explosive force so it slows down smoothly
      velocities[i].explodeX *= 0.92;
      velocities[i].explodeY *= 0.92;
      velocities[i].explodeZ *= 0.92;
      
      // Bounce off boundaries
      if (Math.abs(posAttribute.array[i * 3]) > 40) velocities[i].x *= -1;
      if (Math.abs(posAttribute.array[i * 3 + 1]) > 40) velocities[i].y *= -1;
      if (Math.abs(posAttribute.array[i * 3 + 2]) > 40) velocities[i].z *= -1;
    }
    posAttribute.needsUpdate = true;

    // Slowly rotate the whole network
    particlesMesh.rotation.y = elapsedTime * 0.05;
    linesMesh.rotation.y = elapsedTime * 0.05;
    particlesMesh.rotation.x = elapsedTime * 0.02;
    linesMesh.rotation.x = elapsedTime * 0.02;

    // Update lines (connect nearby particles)
    const linePositions = [];
    for (let i = 0; i < particlesCount; i++) {
      for (let j = i + 1; j < particlesCount; j++) {
        const dx = posAttribute.array[i * 3] - posAttribute.array[j * 3];
        const dy = posAttribute.array[i * 3 + 1] - posAttribute.array[j * 3 + 1];
        const dz = posAttribute.array[i * 3 + 2] - posAttribute.array[j * 3 + 2];
        const distSq = dx*dx + dy*dy + dz*dz;

        // Connect if close enough
        if (distSq < 150) {
          linePositions.push(
            posAttribute.array[i * 3], posAttribute.array[i * 3 + 1], posAttribute.array[i * 3 + 2],
            posAttribute.array[j * 3], posAttribute.array[j * 3 + 1], posAttribute.array[j * 3 + 2]
          );
        }
      }
    }
    linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

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

// 3. Initialize UI Enhancements
const initUI = () => {
  // 3.1 Custom Cursor
  const cursorDot = document.querySelector('.custom-cursor-dot');
  const cursorRing = document.querySelector('.custom-cursor-ring');
  
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    gsap.set(cursorDot, { x: mouseX, y: mouseY });
  });

  const renderCursor = () => {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    gsap.set(cursorRing, { x: ringX, y: ringY });
    requestAnimationFrame(renderCursor);
  };
  renderCursor();

  document.addEventListener('mousedown', () => {
    gsap.to(cursorRing, { width: 50, height: 50, duration: 0.2, ease: 'power2.out' });
  });
  document.addEventListener('mouseup', () => {
    gsap.to(cursorRing, { width: 30, height: 30, duration: 0.2, ease: 'power2.out' });
  });

  const interactives = document.querySelectorAll('a, button, .scroll-progress-container');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
      gsap.to(cursorRing, { width: 50, height: 50, backgroundColor: 'rgba(255, 158, 0, 0.1)', duration: 0.2 });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(cursorRing, { width: 30, height: 30, backgroundColor: 'transparent', duration: 0.2 });
    });
  });

  // 3.2 Cyber-reveal text
  const heroTitle = document.querySelector('.hero-title .highlight');
  if (heroTitle) {
    const originalText = "Workout";
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let iterations = 0;
    const interval = setInterval(() => {
      heroTitle.innerText = originalText.split("")
        .map((letter, index) => {
          if (index < iterations) {
            return originalText[index];
          }
          return letters[Math.floor(Math.random() * 36)];
        })
        .join("");
      
      if (iterations >= originalText.length) {
        clearInterval(interval);
      }
      iterations += 1/3;
    }, 30);
  }

  // 3.3 Scroll Progress Ring
  const progressBar = document.querySelector('.scroll-progress-bar');
  const scrollContainer = document.querySelector('.scroll-progress-container');
  
  if (progressBar) {
    const radius = progressBar.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    progressBar.style.strokeDasharray = `${circumference} ${circumference}`;
    progressBar.style.strokeDashoffset = circumference;
    
    window.addEventListener('scroll', () => {
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      const offset = circumference - scrollPercent * circumference;
      progressBar.style.strokeDashoffset = offset;
    });

    scrollContainer.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 3.4 3D Tilt Effect for Images
  const cards = document.querySelectorAll('.image-glass');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -15;
      const rotateY = ((x - centerX) / centerX) * 15;
      
      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 1000,
        ease: 'power1.out',
        duration: 0.5
      });
    });
    
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        ease: 'power3.out',
        duration: 0.5
      });
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  initGSAP();
  initUI();
});
