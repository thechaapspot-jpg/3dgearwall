/**
 * 3D Gear Wall - Hero 3D BMW M3 Interactive Viewer
 * Exact recreation of original Three.js setup with studio lighting, shadow plane, scroll rotation, and drag controls.
 */

(function () {
  'use strict';

  function init3DHero() {
    // Find canvas in hero section
    const canvas = document.querySelector('section canvas') || document.querySelector('canvas');
    if (!canvas) {
      console.warn('[3D Hero] Canvas element not found in DOM');
      return;
    }

    const container = canvas.parentElement;
    if (!container) return;

    // Check THREE & GLTFLoader
    if (typeof THREE === 'undefined') {
      console.warn('[3D Hero] THREE.js not loaded, waiting...');
      setTimeout(init3DHero, 100);
      return;
    }

    if (typeof THREE.GLTFLoader === 'undefined') {
      console.warn('[3D Hero] GLTFLoader not loaded, waiting...');
      setTimeout(init3DHero, 100);
      return;
    }

    // Prevent double initialization
    if (canvas.__initialized3D) return;
    canvas.__initialized3D = true;

    // Original exact configurations
    const desktopConfig = {
      rotation: { x: 0, y: -0.42 },
      position: { x: 5.7, y: -0.8 },
      scale: 1.8,
      camera: { x: 4, y: 0.6, z: 9 },
      fov: 40
    };

    const mobileConfig = {
      rotation: { x: 0, y: -0.12 },
      position: { x: 1.5, y: -2 },
      scale: 1.4,
      camera: { x: 0, y: 0.5, z: 10 },
      fov: 50
    };

    let isMobile = window.innerWidth < 768;
    let cfg = isMobile ? mobileConfig : desktopConfig;

    // Scene & Camera
    const scene = new THREE.Scene();
    
    // Size determination
    function getSize() {
      const w = container.clientWidth || (isMobile ? window.innerWidth : window.innerWidth * 0.65);
      const h = container.clientHeight || window.innerHeight;
      return { width: Math.max(w, 300), height: Math.max(h, 300) };
    }

    let { width, height } = getSize();

    const camera = new THREE.PerspectiveCamera(cfg.fov, width / height, 0.1, 100);
    camera.position.set(cfg.camera.x, cfg.camera.y, cfg.camera.z);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Studio Lighting (matching original setup)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.6);
    scene.add(hemiLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight2.position.set(-5, 5, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xff6b35, 1.0, 25);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);

    // Group hierarchy:
    // scene -> carOuterGroup (position) -> carRotationGroup (scroll & drag rotation) -> carInnerGroup (scale 1.2, holds model + shadow)
    const carOuterGroup = new THREE.Group();
    carOuterGroup.position.set(cfg.position.x, cfg.position.y, 0);
    scene.add(carOuterGroup);

    const carRotationGroup = new THREE.Group();
    carRotationGroup.rotation.x = cfg.rotation.x;
    carRotationGroup.rotation.y = cfg.rotation.y;
    carRotationGroup.scale.set(cfg.scale, cfg.scale, cfg.scale);
    carOuterGroup.add(carRotationGroup);

    const carInnerGroup = new THREE.Group();
    carInnerGroup.scale.set(1.2, 1.2, 1.2);
    carRotationGroup.add(carInnerGroup);

    // Shadow Plane
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/shadow.png',
      shadowTex => {
        const shadowGeo = new THREE.PlaneGeometry(5, 2.5);
        const shadowMat = new THREE.MeshBasicMaterial({
          map: shadowTex,
          transparent: true,
          opacity: 1.2,
          depthWrite: false
        });
        const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
        shadowMesh.rotation.set(-Math.PI / 2, 0, 1.5);
        shadowMesh.position.set(0, 0, 0);
        carInnerGroup.add(shadowMesh);
      },
      undefined,
      err => console.warn('[3D Hero] Shadow load warning:', err)
    );

    // Load Car Model
    let carModel = null;

    const loader = new THREE.GLTFLoader();
    loader.load(
      '/free_bmw_m3_e30.glb',
      gltf => {
        carModel = gltf.scene;
        carModel.traverse(node => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            if (node.material) {
              node.material.roughness = Math.min(node.material.roughness || 0.4, 0.45);
              node.material.metalness = Math.max(node.material.metalness || 0.5, 0.6);
            }
          }
        });
        carInnerGroup.add(carModel);
        console.log('✅ [3D Hero] BMW M3 Model successfully loaded into scene!');
      },
      undefined,
      err => {
        console.error('❌ [3D Hero] Error loading BMW M3 model:', err);
      }
    );

    // Enable smooth user interaction on canvas
    container.style.pointerEvents = 'auto';
    canvas.style.pointerEvents = 'auto';
    canvas.style.cursor = 'grab';

    // Scroll-based rotation tracking (matches original Next.js implementation)
    let scrollYRatio = 0;
    let scrollRaf = null;
    let lastScrollTime = 0;
    const onScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime < 16 || scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        const vh = window.innerHeight || 800;
        scrollYRatio = window.scrollY / vh;
        lastScrollTime = now;
        scrollRaf = null;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Interactive Drag rotation controls
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let targetDragY = 0;
    let targetDragX = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      dragStartX = (e.touches ? e.touches[0].clientX : e.clientX);
      dragStartY = (e.touches ? e.touches[0].clientY : e.clientY);
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
      const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
      const dx = clientX - dragStartX;
      const dy = clientY - dragStartY;
      targetDragY += dx * 0.006;
      targetDragX += dy * 0.003;
      targetDragX = Math.max(-0.35, Math.min(0.35, targetDragX));
      dragStartX = clientX;
      dragStartY = clientY;
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp, { passive: true });

    // Responsive Resize
    function onResize() {
      isMobile = window.innerWidth < 768;
      cfg = isMobile ? mobileConfig : desktopConfig;

      const size = getSize();
      width = size.width;
      height = size.height;

      camera.aspect = width / height;
      camera.fov = cfg.fov;
      camera.position.set(cfg.camera.x, cfg.camera.y, cfg.camera.z);
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      carOuterGroup.position.set(cfg.position.x, cfg.position.y, 0);
      carRotationGroup.scale.set(cfg.scale, cfg.scale, cfg.scale);
    }

    window.addEventListener('resize', onResize, { passive: true });

    // Render loop - smooth scroll rotation and drag with lerp
    let currentRotationY = cfg.rotation.y;
    let currentRotationX = cfg.rotation.x;
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      // Exact scroll formula: (PI / 4) * min(scrollY / innerHeight, 1.5)
      const scrollAngle = (Math.PI / 4) * Math.min(scrollYRatio, 1.5);
      const targetRotationY = cfg.rotation.y - scrollAngle + targetDragY;
      const targetRotationX = cfg.rotation.x + targetDragX;

      const lerpSpeed = isMobile ? 0.03 : 0.05;
      currentRotationY = THREE.MathUtils.lerp(currentRotationY, targetRotationY, lerpSpeed);
      currentRotationX = THREE.MathUtils.lerp(currentRotationX, targetRotationX, lerpSpeed);

      carRotationGroup.rotation.y = currentRotationY;
      carRotationGroup.rotation.x = currentRotationX;

      // Gentle natural breathing float
      const elapsed = clock.getElapsedTime();
      carRotationGroup.position.y = Math.sin(elapsed * 1.5) * 0.03;

      renderer.render(scene, camera);
    }
    animate();
  }

  // Auto-init on script execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3DHero);
  } else {
    init3DHero();
  }
})();
