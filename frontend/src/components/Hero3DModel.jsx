import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Sphere, MeshDistortMaterial, Float, Stars,
  OrbitControls, Text, Line, Trail, MeshWobbleMaterial,
  Billboard, Ring
} from '@react-three/drei';
import * as THREE from 'three';

/* ─────────────────────────────────────────────
   Hook: responsive window size
───────────────────────────────────────────── */
const useWindowSize = () => {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const h = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return size;
};

/* ─────────────────────────────────────────────
   Pulsing instructor node at center
───────────────────────────────────────────── */
const InstructorCore = () => {
  const meshRef = useRef();
  const ringRef = useRef();
  const ring2Ref = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.scale.setScalar(1 + Math.sin(t * 1.8) * 0.04);
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.4;
      ringRef.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.3) * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.3;
      ring2Ref.current.rotation.y = t * 0.2;
    }
  });

  return (
    <group>
      {/* Core sphere */}
      <Sphere ref={meshRef} args={[0.65, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#6366f1"
          distort={0.35}
          speed={2.5}
          roughness={0.1}
          metalness={0.7}
          emissive="#4f46e5"
          emissiveIntensity={1.2}
        />
      </Sphere>

      {/* Glow halo */}
      <Sphere args={[0.85, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#6366f1"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Orbital ring 1 — tilted */}
      <group ref={ringRef}>
        <Ring args={[1.4, 1.45, 80]} rotation={[Math.PI / 3, 0, 0]}>
          <meshStandardMaterial
            color="#818cf8"
            emissive="#818cf8"
            emissiveIntensity={0.6}
            transparent
            opacity={0.5}
          />
        </Ring>
      </group>

      {/* Orbital ring 2 — reverse tilt */}
      <group ref={ring2Ref}>
        <Ring args={[1.8, 1.84, 80]} rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={0.5}
            transparent
            opacity={0.35}
          />
        </Ring>
      </group>

      {/* Billboard label */}
      <Billboard position={[0, -1.0, 0]}>
        <Text
          fontSize={0.18}
          color="#a5b4fc"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjOg.woff2"
        >
          instructor
        </Text>
      </Billboard>
    </group>
  );
};

/* ─────────────────────────────────────────────
   Student node (orbiting sphere with label)
───────────────────────────────────────────── */
const StudentNode = ({ index, total, orbitRadius, speed, tiltX, tiltY, color, emissive, label, isMobile }) => {
  const ref = useRef();
  const trailRef = useRef();
  const initialAngle = useMemo(() => (index / total) * Math.PI * 2, [index, total]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + initialAngle;
    const x = Math.cos(t) * orbitRadius;
    const z = Math.sin(t) * orbitRadius;
    const y = Math.sin(t * 0.5) * 0.3;

    // Apply tilt transform
    const cx = x;
    const cy = y * Math.cos(tiltX) - z * Math.sin(tiltX);
    const cz = y * Math.sin(tiltX) + z * Math.cos(tiltX);
    const fx = cx * Math.cos(tiltY) + cz * Math.sin(tiltY);
    const fy = cy;
    const fz = -cx * Math.sin(tiltY) + cz * Math.cos(tiltY);

    ref.current.position.set(fx, fy, fz);

    // Pulse
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.12;
    ref.current.scale.setScalar(pulse);
  });

  return (
    <group>
      <group ref={ref}>
        <Sphere args={[isMobile ? 0.1 : 0.13, 16, 16]}>
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={0.9}
            roughness={0.2}
            metalness={0.6}
          />
        </Sphere>
        {/* Tiny glow */}
        <Sphere args={[isMobile ? 0.16 : 0.2, 8, 8]}>
          <meshStandardMaterial color={color} transparent opacity={0.1} side={THREE.BackSide} />
        </Sphere>
        {!isMobile && label && (
          <Billboard position={[0, 0.28, 0]}>
            <Text
              fontSize={0.10}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
              font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjOg.woff2"
            >
              {label}
            </Text>
          </Billboard>
        )}
      </group>
    </group>
  );
};

/* ─────────────────────────────────────────────
   Dynamic connection lines from center to nodes
───────────────────────────────────────────── */
const ConnectionLines = ({ nodePositions }) => {
  return (
    <>
      {nodePositions.map((pos, i) => (
        <Line
          key={i}
          points={[[0, 0, 0], pos]}
          color={i % 3 === 0 ? '#6366f1' : i % 3 === 1 ? '#22d3ee' : '#c084fc'}
          lineWidth={0.3}
          transparent
          opacity={0.15}
          dashed={false}
        />
      ))}
    </>
  );
};

/* ─────────────────────────────────────────────
   Floating code tokens
───────────────────────────────────────────── */
const FloatingCodeToken = ({ text, position, speed, color, isMobile }) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed;
    ref.current.position.y = position[1] + Math.sin(t) * 0.3;
    ref.current.rotation.z = Math.sin(t * 0.5) * 0.1;
  });

  if (isMobile) return null;

  return (
    <Billboard ref={ref} position={position}>
      <Text
        fontSize={0.2}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjOg.woff2"
        fillOpacity={0.55}
      >
        {text}
      </Text>
    </Billboard>
  );
};

/* ─────────────────────────────────────────────
   Broadcast pulse rings
───────────────────────────────────────────── */
const BroadcastPulse = () => {
  const r1 = useRef();
  const r2 = useRef();
  const r3 = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    [r1, r2, r3].forEach((r, i) => {
      if (!r.current) return;
      const phase = (t * 0.5 + i * 0.8) % 2;
      const scale = 1 + phase * 2.5;
      r.current.scale.setScalar(scale);
      r.current.material.opacity = Math.max(0, 0.12 * (1 - phase / 2));
    });
  });

  const mat = (
    <meshStandardMaterial
      color="#6366f1"
      transparent
      opacity={0.1}
      side={THREE.DoubleSide}
    />
  );

  return (
    <>
      <Ring ref={r1} args={[0.9, 0.92, 64]}>{mat}</Ring>
      <Ring ref={r2} args={[0.9, 0.92, 64]}>{mat}</Ring>
      <Ring ref={r3} args={[0.9, 0.92, 64]}>{mat}</Ring>
    </>
  );
};

/* ─────────────────────────────────────────────
   Camera responsive FOV
───────────────────────────────────────────── */
const ResponsiveCamera = ({ isMobile }) => {
  const { camera } = useThree();
  useEffect(() => {
    camera.fov = isMobile ? 65 : 48;
    camera.position.set(0, 0.5, isMobile ? 7 : 6);
    camera.updateProjectionMatrix();
  }, [isMobile, camera]);
  return null;
};

/* ─────────────────────────────────────────────
   Full scene
───────────────────────────────────────────── */
const ClassroomScene = ({ isMobile }) => {
  const groupRef = useRef();

  // Student configs: 3 groups on 3 different orbits
  const studentGroups = useMemo(() => [
    // Inner ring — 4 students
    { orbitRadius: 1.45, speed: 0.4, tiltX: Math.PI / 3, tiltY: 0.2, nodes: 4,
      colors: ['#22d3ee', '#6366f1', '#22d3ee', '#a78bfa'], emissives: ['#06b6d4', '#4f46e5', '#06b6d4', '#7c3aed'],
      labels: ['stu_01', 'stu_02', 'stu_03', 'stu_04'] },
    // Middle ring — 5 students  
    { orbitRadius: 1.85, speed: 0.28, tiltX: -Math.PI / 4, tiltY: Math.PI / 5, nodes: 5,
      colors: ['#c084fc', '#22d3ee', '#f472b6', '#22d3ee', '#c084fc'], emissives: ['#9333ea', '#06b6d4', '#db2777', '#06b6d4', '#9333ea'],
      labels: ['stu_05', 'stu_06', 'stu_07', 'stu_08', 'stu_09'] },
    // Outer ring — 4 students (hidden on mobile)
    { orbitRadius: isMobile ? 0 : 2.4, speed: 0.18, tiltX: Math.PI / 6, tiltY: -Math.PI / 4, nodes: isMobile ? 0 : 4,
      colors: ['#34d399', '#6366f1', '#34d399', '#6366f1'], emissives: ['#059669', '#4f46e5', '#059669', '#4f46e5'],
      labels: ['stu_10', 'stu_11', 'stu_12', 'stu_13'] },
  ], [isMobile]);

  const codeTokens = [
    { text: '</>',   position: [-3.2, 1.5, -1],  speed: 0.6,  color: '#6366f1' },
    { text: 'fn()',  position: [3.0, 1.2, -0.5], speed: 0.5,  color: '#22d3ee' },
    { text: '{ }',   position: [-2.8, -1.3, 0.5],speed: 0.7,  color: '#c084fc' },
    { text: '=>',    position: [2.5, -1.5, 1],   speed: 0.55, color: '#a78bfa' },
    { text: '[ ]',   position: [-0.5, 2.6, -1],  speed: 0.45, color: '#34d399' },
    { text: 'class', position: [0.8, -2.5, 0.5], speed: 0.65, color: '#f472b6' },
  ];

  return (
    <>
      <ResponsiveCamera isMobile={isMobile} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} color="#e0e7ff" />
      <pointLight position={[-6, -4, -4]} intensity={1.2} color="#6366f1" />
      <pointLight position={[6, 4, 4]}  intensity={0.8} color="#22d3ee" />
      <pointLight position={[0, 6, 0]}  intensity={0.5} color="#c084fc" />

      <Stars radius={80} depth={60} count={isMobile ? 800 : 1800} factor={3} saturation={0} fade speed={0.5} />

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.6}>
        <group ref={groupRef}>
          {/* Center instructor */}
          <InstructorCore />

          {/* Broadcast pulses */}
          <BroadcastPulse />

          {/* Student nodes across rings */}
          {studentGroups.map((group, gi) =>
            Array.from({ length: group.nodes }).map((_, ni) => (
              <StudentNode
                key={`${gi}-${ni}`}
                index={ni}
                total={group.nodes}
                orbitRadius={group.orbitRadius}
                speed={group.speed}
                tiltX={group.tiltX}
                tiltY={group.tiltY}
                color={group.colors[ni % group.colors.length]}
                emissive={group.emissives[ni % group.emissives.length]}
                label={group.labels[ni]}
                isMobile={isMobile}
              />
            ))
          )}

          {/* Floating code tokens */}
          {codeTokens.map((t, i) => (
            <FloatingCodeToken key={i} {...t} isMobile={isMobile} />
          ))}
        </group>
      </Float>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.6}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
};

/* ─────────────────────────────────────────────
   Exported component
───────────────────────────────────────────── */
const Hero3DModel = ({ className = '' }) => {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: isMobile ? 320 : 480 }}>
      {/* Gradient vignette */}
      <div className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
        style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(6,9,18,0.7) 100%)' }} />

      {/* Subtle border glow */}
      <div className="absolute inset-0 z-0 rounded-3xl"
        style={{ boxShadow: 'inset 0 0 60px rgba(99,102,241,0.08)' }} />

      <Canvas
        dpr={[1, isMobile ? 1.5 : 2]}
        style={{ borderRadius: '1.5rem' }}
        gl={{ antialias: true, alpha: true }}
      >
        <ClassroomScene isMobile={isMobile} />
      </Canvas>

      {/* UI overlay badges */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 px-3 py-1.5 rounded-xl text-xs"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-slate-300">13 students live</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/70 backdrop-blur-sm border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <span className="text-indigo-300">session.broadcast()</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <div className="bg-slate-900/70 backdrop-blur-sm border border-cyan-500/30 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <span className="text-cyan-400">● REC</span>
          <span className="text-slate-400">00:14:32</span>
        </div>
      </div>
    </div>
  );
};

export default Hero3DModel;