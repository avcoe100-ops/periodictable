import React, { Suspense, useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html, PerspectiveCamera, Float, useTexture, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { Search, Info, Home, ZoomIn, ZoomOut, Layers, Menu, X, ArrowRight, Zap } from 'lucide-react';

// --- DATA MODEL ---
const CELESTIAL_DATA = {
  sun: {
    name: "Sun",
    type: "Star",
    color: "#ffcc33",
    size: 5,
    distance: 0,
    description: "The Sun is the star at the center of our Solar System. It is a nearly perfect sphere of hot plasma.",
    details: {
      temp: "5,500°C (Surface)",
      mass: "1.989 × 10^30 kg",
      gravity: "274 m/s²",
    }
  },
  mercury: {
    name: "Mercury",
    type: "Planet",
    color: "#A5A5A5",
    size: 0.8,
    distance: 10,
    speed: 0.04,
    description: "The smallest planet in the Solar System and the closest to the Sun.",
    details: { day: "58d 15h", year: "88 days", moons: 0 }
  },
  venus: {
    name: "Venus",
    type: "Planet",
    color: "#E3BB76",
    size: 1.2,
    distance: 15,
    speed: 0.015,
    description: "Second planet from the Sun. It is the hottest planet in our solar system.",
    details: { day: "116d 18h", year: "225 days", moons: 0 }
  },
  earth: {
    name: "Earth",
    type: "Planet",
    color: "#2271B3",
    size: 1.3,
    distance: 20,
    speed: 0.01,
    description: "Our home planet. The only place we know of so far that’s inhabited by living things.",
    details: { day: "24h", year: "365 days", moons: 1 }
  },
  mars: {
    name: "Mars",
    type: "Planet",
    color: "#E27B58",
    size: 1,
    distance: 28,
    speed: 0.008,
    description: "The Red Planet. Home to Olympus Mons, the largest volcano in the solar system.",
    details: { day: "24h 37m", year: "687 days", moons: 2 }
  },
  jupiter: {
    name: "Jupiter",
    type: "Planet",
    color: "#D39C7E",
    size: 3,
    distance: 45,
    speed: 0.004,
    description: "The largest planet in our solar system. A gas giant with a Great Red Spot.",
    details: { day: "9h 56m", year: "12 years", moons: 79 }
  }
};

// --- COMPONENTS ---

const Planet = ({ name, size, color, distance, speed, onSelect }) => {
  const meshRef = useRef();
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    if (meshRef.current) {
      meshRef.current.position.x = Math.sin(t) * distance;
      meshRef.current.position.z = Math.cos(t) * distance;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group>
      {/* Orbital Path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[distance - 0.1, distance + 0.1, 64]} />
        <meshBasicMaterial color="white" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onSelect(name.toLowerCase()); }}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.3} />
        <Html distanceFactor={15}>
          <div className="text-white text-xs whitespace-nowrap bg-black/50 px-2 py-1 rounded border border-white/20 pointer-events-none select-none">
            {name}
          </div>
        </Html>
      </mesh>
    </group>
  );
};

const Sun = ({ onSelect }) => {
  return (
    <mesh onClick={() => onSelect('sun')}>
      <sphereGeometry args={[CELESTIAL_DATA.sun.size, 32, 32]} />
      <meshStandardMaterial 
        emissive={CELESTIAL_DATA.sun.color} 
        emissiveIntensity={2} 
        color={CELESTIAL_DATA.sun.color} 
      />
      <pointLight intensity={2} distance={100} color="#ffcc33" />
    </mesh>
  );
};

const UIOverlay = ({ selectedObject, setSelectedObject }) => {
  const data = selectedObject ? CELESTIAL_DATA[selectedObject] : null;

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-10 font-sans text-white z-10">
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black tracking-tighter italic">COSMOS</h1>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-blue-400 font-bold">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            Universe Explorer
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-2 flex items-center px-4 gap-3">
            <Search size={18} className="text-white/50" />
            <input 
              type="text" 
              placeholder="Search celestial bodies..." 
              className="bg-transparent border-none outline-none text-sm w-32 md:w-64"
            />
          </div>
          <button className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full p-3 hover:bg-white/20 transition-all">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Info Panel */}
      {data && (
        <div className="absolute bottom-10 left-10 w-full max-w-md bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 pointer-events-auto transform transition-all duration-500 animate-in slide-in-from-left">
          <button 
            onClick={() => setSelectedObject(null)}
            className="absolute top-4 right-4 text-white/30 hover:text-white"
          >
            <X size={20} />
          </button>
          
          <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">{data.type}</div>
          <h2 className="text-5xl font-bold mb-4">{data.name}</h2>
          <p className="text-white/70 leading-relaxed mb-6">
            {data.description}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {Object.entries(data.details).map(([key, value]) => (
              <div key={key} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">{key}</div>
                <div className="text-lg font-medium">{value}</div>
              </div>
            ))}
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
            Initiate Flyby <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-end gap-3 pointer-events-auto absolute bottom-10 right-10">
        <div className="flex flex-col gap-2">
          <button onClick={() => setSelectedObject(null)} className="p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
            <Home size={20} />
          </button>
          <button className="p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
            <ZoomIn size={20} />
          </button>
          <button className="p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
            <ZoomOut size={20} />
          </button>
          <button className="p-4 bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
            <Zap size={20} />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="absolute top-32 left-10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
        <span>Universe</span>
        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
        <span>Milky Way</span>
        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
        <span className="text-white/80 italic">Solar System</span>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

export default function App() {
  const [selectedObject, setSelectedObject] = useState(null);

  return (
    <div className="w-full h-screen bg-[#020205] overflow-hidden">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center text-white bg-black">
          <div className="text-center">
            <div className="text-4xl font-black italic tracking-tighter mb-4 animate-pulse">COSMOS</div>
            <div className="text-xs uppercase tracking-widest text-blue-400 font-bold">Loading Star Charts...</div>
          </div>
        </div>
      }>
        <Canvas shadows gl={{ antialias: true }}>
          <PerspectiveCamera makeDefault position={[0, 40, 80]} fov={45} />
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 0, 0]} intensity={2.5} color="#fff5d1" />
          
          <Sun onSelect={setSelectedObject} />
          
          {Object.entries(CELESTIAL_DATA).map(([key, data]) => {
            if (key === 'sun') return null;
            return (
              <Planet 
                key={key}
                name={data.name}
                size={data.size}
                color={data.color}
                distance={data.distance}
                speed={data.speed}
                onSelect={setSelectedObject}
              />
            );
          })}

          <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} fade speed={1} />
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            maxDistance={200} 
            minDistance={10} 
            makeDefault
          />
        </Canvas>
      </Suspense>

      <UIOverlay selectedObject={selectedObject} setSelectedObject={setSelectedObject} />
      
      {/* Intro Backdrop if nothing selected */}
      {!selectedObject && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4">
            <h2 className="text-white/20 text-[10vw] font-black italic tracking-tighter select-none">EXPLORE</h2>
          </div>
        </div>
      )}
    </div>
  );
}
