import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { ARButton } from 'https://unpkg.com/three@0.158.0/examples/jsm/webxr/ARButton.js';

let scene, camera, renderer, globe, video, videoTexture;
let isDragging = false;
let previousX = 0;
let previousY = 0;
let loader;

init();
animate();

function init() {
  // Motion Permission (iOS)
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission().catch(console.error);
  }

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.01, 20);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  loader = new THREE.TextureLoader();
  updateBackground();
  window.addEventListener('resize', updateBackground);
  window.addEventListener('orientationchange', updateBackground);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  // Video element
  video = document.createElement('video');
  video.src = 'Pangaea_Texture_VDO_Reverse_30.mp4';
  video.loop = true;
  video.muted = true;       // ✅ autoplay ต้อง muted
  video.playsInline = true; // ✅ iOS ต้องการ
  videoTexture = new THREE.VideoTexture(video);
  videoTexture.encoding = THREE.sRGBEncoding;

  // Sphere globe
  const geometry = new THREE.SphereGeometry(0.35, 64, 64);
  const material = new THREE.MeshStandardMaterial({ map: videoTexture });
  globe = new THREE.Mesh(geometry, material);
  globe.position.set(0, 0, -1);
  scene.add(globe);

  // 🔹 กดปุ่ม Start ถึงจะเล่นวิดีโอ
  const startButton = document.getElementById('startButton');
  startButton.addEventListener('click', async () => {
    try {
      await video.play();
      startButton.style.display = 'none'; // ซ่อนปุ่มหลังเริ่มเล่น
    } catch (err) {
      console.warn("Video play failed:", err);
      alert("ไม่สามารถเล่นวิดีโอได้ ลองกดอีกครั้ง");
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Lights
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  // Drag control
  renderer.domElement.addEventListener('pointerdown', (event) => {
    isDragging = true;
    previousX = event.clientX;
    previousY = event.clientY;
  });

  renderer.domElement.addEventListener('pointerup', () => {
    isDragging = false;
  });

  renderer.domElement.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    const deltaX = event.clientX - previousX;
    const deltaY = event.clientY - previousY;
    previousX = event.clientX;
    previousY = event.clientY;

    if (globe) {
      globe.rotation.y += deltaX * 0.005;
      globe.rotation.x += deltaY * 0.005;
      globe.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, globe.rotation.x));
    }
  });
}

function updateBackground() {
  if (!loader) return;
  scene.background = (window.innerHeight > window.innerWidth)
    ? loader.load('Sky_box_portrait.png')
    : loader.load('Sky_box_landscape.png');
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  renderer.render(scene, camera);
}
