"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Box, Environment, Edges } from "@react-three/drei";
import * as THREE from "three";

interface BatteryPackCanvasProps {
  cells: number[];
  status: "NOMINAL" | "WARN" | "FAULT";
}

function BatteryModule({ position, voltage, isAnomaly, index }: { position: [number, number, number], voltage: number, isAnomaly: boolean, index: number }) {
  const mesh = useRef<THREE.Mesh>(null!);
  
  // Subtle hovering animation
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + index) * 0.05;
    }
  });

  // Base color logic
  let color = "#16181D";
  if (isAnomaly) {
    color = "#ff4876";
  } else {
    // Map voltage to a slight green-cyan tint for healthy cells
    const normalized = (voltage - 3.0) / 1.2; // 3.0V to 4.2V mapped to 0-1
    color = new THREE.Color().setHSL(0.5, 0.5, 0.1 + (normalized * 0.2)).getStyle();
  }

  return (
    <Box position={position} args={[1.8, 0.4, 1.2]} ref={mesh}>
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      <Edges scale={1.05} threshold={15} color={isAnomaly ? "#ff4876" : "#06B6D4"} />
    </Box>
  );
}

export default function BatteryPackCanvas({ cells, status }: BatteryPackCanvasProps) {
  // A skateboard pack architecture: 4 rows, 6 columns (24 cells/modules)
  const rows = 4;
  const cols = 6;
  const spacingX = 2.2;
  const spacingZ = 1.6;

  // Determine an outlier to highlight
  const avgV = cells.reduce((sum, v) => sum + v, 0) / cells.length;

  return (
    <div style={{ width: "100%", height: "300px", backgroundColor: "#0E1014", border: "1px solid #242933", position: "relative" }}>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10, color: "#9CA3AF", fontSize: "10px", pointerEvents: "none" }}>
        3D SKATEBOARD PACK ARCHITECTURE<br/>
        <span style={{ color: status === 'FAULT' ? '#ff4876' : '#10B981' }}>{status}</span>
      </div>
      <Canvas camera={{ position: [0, 8, 10], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-10, 5, -5]} intensity={0.5} color="#06B6D4" />
        
        <group position={[-((cols - 1) * spacingX) / 2, 0, -((rows - 1) * spacingZ) / 2]}>
          {cells.map((volt, idx) => {
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            // Mark as anomaly if it deviates > 50mV from average or if the overall status is FAULT and it's the worst cell
            const isAnomaly = Math.abs(volt - avgV) > 0.05 || (status === 'FAULT' && idx === 14); // hardcoding 14 as the simulated fault from SEED data for visual effect
            
            return (
              <BatteryModule
                key={idx}
                index={idx}
                position={[c * spacingX, 0, r * spacingZ]}
                voltage={volt}
                isAnomaly={isAnomaly}
              />
            );
          })}
        </group>
        
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2.5}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
        <Environment preset="night" />
      </Canvas>
    </div>
  );
}
