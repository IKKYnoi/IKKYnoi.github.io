import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { ARButton } from 'https://unpkg.com/three@0.158.0/examples/jsm/webxr/ARButton.js';

let scene, camera, renderer, globe, video, videoTexture;
let isDragging = false;
let previousX = 0;
let previousY = 0;
let loader; // ใช้ร่วมกับ updateBackground

init();
animate();

function init() {

  // 🔹 ขออนุญาต Motion / Orientation สำหรับ iOS
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          console.log('Device motion permission granted');
        } else {
          alert('Device motion permission denied');
        }
      })
      .catch(console.error);
  }

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.01, 20);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  // 🔹 โหลดพื้นหลังตาม orientation
  loader = new THREE.TextureLoader();
  updateBackground(); // เรียกครั้งแรก
  window.addEventListener('resize', updateBackground);
  window.addEventListener('orientationchange', updateBackground);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  // Video
  video = document.createElement('video');
  video.src = 'Pangaea_Texture_VDO_Reverse_30.mp4';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;   // ✅ สำคัญมากสำหรับ iPhone
  video.autoplay = true;      // ✅ เผื่อ browser รองรับ autoplay

  // Safari iPhone: ต้องรอให้ video เริ่ม play สำเร็จก่อนค่อยสร้าง texture
  video.play().then(() => {
    videoTexture = new THREE.VideoTexture(video);
    videoTexture.encoding = THREE.sRGBEncoding;
    videoTexture.needsUpdate = true;

    if (globe) {
      globe.material.map = videoTexture;
      globe.material.needsUpdate = true;
    }
  }).catch((err) => {
    console.warn("Video play() failed:", err);
  });

  // Sphere สำหรับลูกโลก
  const geometry = new THREE.SphereGeometry(0.35, 64, 64);
  const material = new THREE.MeshStandardMaterial({ map: videoTexture });
  globe = new THREE.Mesh(geometry, material);
  globe.position.set(0, 0, -1);
  scene.add(globe);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  // —— เพิ่มฟังก์ชันลากหมุนลูกโลก ——
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
      globe.rotation.y += deltaX * 0.005; // หมุนซ้ายขวา
      globe.rotation.x += deltaY * 0.005; // หมุนขึ้นลง
      globe.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, globe.rotation.x)); // จำกัดหมุนไม่เกิน 90°
    }
  });
}

// ✅ ฟังก์ชันเปลี่ยนพื้นหลัง
function updateBackground() {
  if (!loader) return;
  if (window.innerHeight > window.innerWidth) {
    // 📱 แนวตั้ง
    scene.background = loader.load('Sky_box_portrait.png');
  } else {
    // 💻 แนวนอน
    scene.background = loader.load('Sky_box_landscape.png');
  }
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  renderer.render(scene, camera);
}
