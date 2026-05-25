import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function Logo3D() {
  const meshRef = useRef();
  const [hovered, setHover] = useState(false);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <Float speed={3} rotationIntensity={0.3} floatIntensity={0.3}>
      <group ref={meshRef} scale={hovered ? 1.3 : 1}>
        {/* Back glow effect */}
        <mesh position={[0, 0, -0.5]}>
          <circleGeometry args={[2, 32]} />
          <meshStandardMaterial 
            color="#f59e0b" 
            transparent 
            opacity={0.3}
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>
        
        {/* Logo container */}
        <mesh 
          onPointerOver={() => setHover(true)}
          onPointerOut={() => setHover(false)}
        >
          <planeGeometry args={[2.5, 2.5]} />
          <meshStandardMaterial 
            color="#ffffff" 
            metalness={0.3} 
            roughness={0.4} 
            envMapIntensity={1.5}
          />
        </mesh>
        
        {/* SAHE Logo plane */}
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[1.8, 1.8]} />
          <meshStandardMaterial 
            color="#f59e0b"
            transparent={true}
            opacity={0.9}
            metalness={0.2}
            roughness={0.3}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Particles() {
  const particles = useRef();
  const count = 500;
  
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    if (particles.current) {
      particles.current.rotation.y += 0.001;
      particles.current.rotation.x += 0.0005;
    }
  });

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.02} 
        color="#f59e0b" 
        sizeAttenuation 
        transparent 
        opacity={0.6}
      />
    </points>
  );
}

export default function LoadingAnimation() {
  return (
    <div className="w-full h-full relative">
      <img 
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrVJuuA7wZqoEsOZLFq8q3XdSHQAGi1uaLqg&s"
        alt="SAHE Logo"
        className="absolute inset-0 w-full h-full object-contain animate-pulse"
        style={{
          filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.5))',
          animation: 'float 3s ease-in-out infinite, rotate 4s linear infinite'
        }}
      />
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
