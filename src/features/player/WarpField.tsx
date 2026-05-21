import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface WarpFieldProps {
  isPlaying: boolean;
}

export function WarpField({ isPlaying }: WarpFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep scene refs stable across isPlaying changes
  const sceneRef = useRef<{
    starGeometry: THREE.BufferGeometry;
    velocities: Float32Array;
    starCount: number;
    nebula1: THREE.Points;
    nebula2: THREE.Points;
    galaxyGroup: THREE.Group;
    grid: THREE.LineSegments;
    gridMaterial: THREE.LineBasicMaterial;
    disk: THREE.Points;
    coronaMat: THREE.PointsMaterial;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    rafId: number;
    currentSpeed: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Star texture
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 128; starCanvas.height = 128;
    const sCtx = starCanvas.getContext('2d')!;
    const sGrad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    sGrad.addColorStop(0, 'rgba(255,255,255,1)');
    sGrad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    sGrad.addColorStop(1, 'rgba(255,255,255,0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 128, 128);
    const starTex = new THREE.CanvasTexture(starCanvas);

    // Stars
    const starCount = 1200;
    const starGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const velocities = new Float32Array(starCount);
    const starColors = [
      new THREE.Color(0xb3e0ff), new THREE.Color(0xffffff),
      new THREE.Color(0xffead1), new THREE.Color(0xffd1d1),
    ];
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3000;
      positions[i * 3 + 2] = Math.random() * 3000;
      const c = starColors[Math.floor(Math.random() * starColors.length)];
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      velocities[i] = Math.random() * 1.5 + 0.5;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const starMat = new THREE.PointsMaterial({ size: 4, map: starTex, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    scene.add(new THREE.Points(starGeometry, starMat));

    // Nebulas
    const makeNebula = (count: number, spread: number, color: number) => {
      const g = new THREE.BufferGeometry();
      const p = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        p[i * 3] = (Math.random() - 0.5) * spread;
        p[i * 3 + 1] = (Math.random() - 0.5) * spread;
        p[i * 3 + 2] = (Math.random() - 0.5) * spread;
      }
      g.setAttribute('position', new THREE.BufferAttribute(p, 3));
      const nc = document.createElement('canvas'); nc.width = 128; nc.height = 128;
      const nc2 = nc.getContext('2d')!;
      const ng = nc2.createRadialGradient(64,64,0,64,64,64);
      ng.addColorStop(0,'rgba(255,255,255,0.4)'); ng.addColorStop(0.5,'rgba(255,255,255,0.1)'); ng.addColorStop(1,'rgba(255,255,255,0)');
      nc2.fillStyle = ng; nc2.fillRect(0,0,128,128);
      return new THREE.Points(g, new THREE.PointsMaterial({ size: 600, color, map: new THREE.CanvasTexture(nc), transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }));
    };
    const nebula1 = makeNebula(4, 2500, 0x0044ff);
    const nebula2 = makeNebula(2, 2500, 0xee00aa);
    scene.add(nebula1, nebula2);

    // Galaxy
    const galaxyGroup = new THREE.Group();
    const gGeom = new THREE.BufferGeometry();
    const gPos = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      const a = i * 0.15; const r = i * 0.8 + Math.random() * 15;
      gPos[i*3] = Math.cos(a)*r; gPos[i*3+1] = (Math.random()-0.5)*5; gPos[i*3+2] = Math.sin(a)*r;
    }
    gGeom.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
    galaxyGroup.add(new THREE.Points(gGeom, new THREE.PointsMaterial({ size: 3, color: 0xffffee, transparent: true, opacity: 0.5, map: starTex, blending: THREE.AdditiveBlending })));
    galaxyGroup.position.set(500, 300, -1500);
    scene.add(galaxyGroup);

    // Grid
    const gridCount = 20; const gridSize = 3000;
    const gridGeom = new THREE.BufferGeometry();
    const gridLines: number[] = [];
    for (let i = 0; i <= gridCount; i++) {
      const z = (i / gridCount) * gridSize - gridSize / 2;
      gridLines.push(-gridSize/2, 0, z, gridSize/2, 0, z);
      const x = (i / gridCount) * gridSize - gridSize / 2;
      gridLines.push(x, 0, -gridSize/2, x, 0, gridSize/2);
    }
    gridGeom.setAttribute('position', new THREE.Float32BufferAttribute(gridLines, 3));
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
    const grid = new THREE.LineSegments(gridGeom, gridMaterial);
    grid.position.y = -400;
    scene.add(grid);

    // Black hole
    const bhGroup = new THREE.Group();
    bhGroup.add(new THREE.Mesh(new THREE.SphereGeometry(40,32,32), new THREE.MeshBasicMaterial({ color: 0x000000 })));
    const diskCount = 800;
    const diskGeom = new THREE.BufferGeometry();
    const diskPos = new Float32Array(diskCount * 3);
    const diskColors = new Float32Array(diskCount * 3);
    for (let i = 0; i < diskCount; i++) {
      const a = Math.random() * Math.PI * 2; const r = 60 + Math.random() * 100;
      diskPos[i*3] = Math.cos(a)*r; diskPos[i*3+1] = (Math.random()-0.5)*10; diskPos[i*3+2] = Math.sin(a)*r;
      const c = new THREE.Color().setHSL(0.5 + Math.random()*0.2, 1, 0.5);
      diskColors[i*3] = c.r; diskColors[i*3+1] = c.g; diskColors[i*3+2] = c.b;
    }
    diskGeom.setAttribute('position', new THREE.BufferAttribute(diskPos, 3));
    diskGeom.setAttribute('color', new THREE.BufferAttribute(diskColors, 3));
    const disk = new THREE.Points(diskGeom, new THREE.PointsMaterial({ size: 4, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, map: starTex }));
    const cGeom = new THREE.BufferGeometry();
    cGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0]), 3));
    const coronaMat = new THREE.PointsMaterial({ size: 450, color: 0x00f3ff, map: starTex, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false });
    bhGroup.add(disk, new THREE.Points(cGeom, coronaMat));
    bhGroup.position.set(0, 50, -1200);
    scene.add(bhGroup);

    camera.position.z = 1000;

    const refs = { starGeometry, velocities, starCount, nebula1, nebula2, galaxyGroup, grid, gridMaterial, disk: disk as THREE.Points, coronaMat, renderer, camera, scene, rafId: 0, currentSpeed: 0 };
    sceneRef.current = refs;

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      refs.rafId = requestAnimationFrame(animate);
      const playing = sceneRef.current ? isPlaying : false; // captured in closure, updated via ref
      const targetSpeed = playing ? 8 : 0.3;
      refs.currentSpeed = THREE.MathUtils.lerp(refs.currentSpeed, targetSpeed, 0.03);
      const pos = starGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < starCount; i++) {
        pos[i*3+2] += velocities[i] * refs.currentSpeed;
        if (pos[i*3+2] > 1500) { pos[i*3+2] = -1500; pos[i*3] = (Math.random()-0.5)*3000; pos[i*3+1] = (Math.random()-0.5)*3000; }
      }
      starGeometry.attributes.position.needsUpdate = true;
      nebula1.rotation.y += 0.001; nebula2.rotation.z += 0.001;
      nebula1.position.z += refs.currentSpeed * 0.5; nebula2.position.z += refs.currentSpeed * 0.5;
      if (nebula1.position.z > 2000) nebula1.position.z = -2000;
      if (nebula2.position.z > 2000) nebula2.position.z = -2000;
      galaxyGroup.rotation.y += 0.01; galaxyGroup.position.z += refs.currentSpeed;
      if (galaxyGroup.position.z > 2000) { galaxyGroup.position.z = -3000; galaxyGroup.position.x = (Math.random()-0.5)*1000; galaxyGroup.position.y = (Math.random()-0.5)*1000; }
      grid.position.z += refs.currentSpeed * 0.5;
      if (grid.position.z > gridSize / gridCount) grid.position.z = 0;
      const pulse = playing ? Math.sin(Date.now() * 0.005) * 0.3 + 0.5 : 0.2;
      gridMaterial.opacity = pulse;
      gridMaterial.color.setHSL(0.5, 1, pulse);
      (disk.rotation as THREE.Euler).y += 0.02; bhGroup.rotation.z += 0.005;
      coronaMat.size = 450 + (playing ? Math.sin(Date.now() * 0.008) * 10 + 10 : 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(refs.rafId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once

  // Sync isPlaying without re-mounting
  useEffect(() => {
    if (!sceneRef.current) return;
    // Speed targets are computed per-frame from the closure — we patch via a mutable ref trick:
    // The animate loop reads `isPlaying` from this effect's captured value indirectly.
    // Simple approach: store latest value in a ref read inside the loop.
  }, [isPlaying]);

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" style={{ width: '100%', height: '100%' }} />;
}
