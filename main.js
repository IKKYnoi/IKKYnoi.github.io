import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { ARButton } from 'https://unpkg.com/three@0.158.0/examples/jsm/webxr/ARButton.js';

let scene, camera, renderer, globe, video, videoTexture;

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
  video.play();

  videoTexture = new THREE.VideoTexture(video);
  videoTexture.encoding = THREE.sRGBEncoding;

  // Sphere สำหรับลูกโลก
  const geometry = new THREE.SphereGeometry(0.5, 64, 64);
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
  
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  if (globe) globe.rotation.y += 0.002; // หมุนลูกโลกช้า ๆ
  renderer.render(scene, camera);
}
