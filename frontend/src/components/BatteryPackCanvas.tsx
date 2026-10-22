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
  
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + index) * 0.05;
    }
  });

  let color = "#FFFFFF";
  if (isAnomaly) {
    color = "#DC2626";
  } else {
    const normalized = Math.max(0, Math.min(1, (voltage - 3.0) / 1.2));
    color = normalized > 0.8 ? "#FFFFFF" : "#DFE3DC";
  }

  return (
    <Box position={position} args={[1.8, 0.4, 1.2]} ref={mesh}>
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.4} />
      <Edges scale={1.05} threshold={15} color={isAnomaly ? "#DC2626" : "#1E2229"} />
    </Box>
  );
}

export default function BatteryPackCanvas({ cells, status }: BatteryPackCanvasProps) {
  const rows = 4;
  const cols = 6;
  const spacingX = 2.2;
  const spacingZ = 1.6;

  const avgV = cells.length > 0 ? cells.reduce((sum, v) => sum + v, 0) / cells.length : 4.0;

  return (
    <div style={{ width: "100%", height: "300px", backgroundColor: "#ECEEEA", border: "2px solid #1E2229", position: "relative" }}>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10, color: "#4B5565", fontFamily: "monospace", fontSize: "10px", pointerEvents: "none", fontWeight: "bold" }}>
        3D SKATEBOARD PACK ARCHITECTURE<br/>
        <span style={{ color: status === "FAULT" ? "#DC2626" : status === "WARN" ? "#D97706" : "#059669" }}>{status}</span>
      </div>
      <Canvas camera={{ position: [0, 8, 10], fov: 40 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-10, 5, -5]} intensity={0.4} color="#DFE3DC" />
        
        <group position={[-((cols - 1) * spacingX) / 2, 0, -((rows - 1) * spacingZ) / 2]}>
          {cells.map((volt, idx) => {
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            const isAnomaly = Math.abs(volt - avgV) > 0.05 || (status === "FAULT" && idx === 14);
            
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
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
