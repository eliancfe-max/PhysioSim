
import React, { useState, Suspense, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, RoundedBox, Html } from '@react-three/drei';
import { Vector3 } from 'three';
import { GameState, Patient, Electrode, DeviceConfig, PatientPosition, Maneuver, ManeuverStep } from './types';
import { generatePatientScenario } from './services/geminiService';
import { PatientModel } from './components/PatientModel';
import { HumanAnatomyModel } from './components/HumanAnatomyModel'; // SPKQ Model
import { DeviceInterface } from './components/DeviceInterface';
import { SPKQInterface } from './components/SPKQInterface'; // SPKQ UI
import { Loader2, CheckCircle2, AlertCircle, User, Zap, Activity, ArrowDown, ArrowUp, Armchair, Hand, Layers } from 'lucide-react';
import * as THREE from 'three';

// --- HIGH FIDELITY PROCEDURAL ASSETS ---

const ModernBookshelf = (props: any) => {
  const woodColor = "#855E42"; 
  const woodRoughness = 0.6;
  
  const width = 1.6;
  const height = 2.2;
  const depth = 0.4;
  const thickness = 0.04;

  const books = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => {
        const h = 0.2 + Math.random() * 0.08;
        const w = 0.03 + Math.random() * 0.05;
        const color = new THREE.Color().setHSL(Math.random(), 0.6, 0.4);
        return { height: h, width: w, color };
    });
  }, []);

  return (
    <group {...props}>
      <mesh position={[0, height/2, -depth/2 + 0.01]} receiveShadow>
          <boxGeometry args={[width, height, 0.02]} />
          <meshStandardMaterial color={woodColor} roughness={woodRoughness} />
      </mesh>
      <mesh position={[-width/2 + thickness/2, height/2, 0]} castShadow receiveShadow>
          <boxGeometry args={[thickness, height, depth]} />
          <meshStandardMaterial color={woodColor} roughness={woodRoughness} />
      </mesh>
      <mesh position={[width/2 - thickness/2, height/2, 0]} castShadow receiveShadow>
           <boxGeometry args={[thickness, height, depth]} />
           <meshStandardMaterial color={woodColor} roughness={woodRoughness} />
      </mesh>
      <mesh position={[0, height - thickness/2, 0]} castShadow receiveShadow>
           <boxGeometry args={[width, thickness, depth]} />
           <meshStandardMaterial color={woodColor} roughness={woodRoughness} />
      </mesh>
      <mesh position={[0, thickness/2, 0]} castShadow receiveShadow>
           <boxGeometry args={[width, thickness, depth]} />
           <meshStandardMaterial color={woodColor} roughness={woodRoughness} />
      </mesh>
      {[0.45, 0.9, 1.35, 1.8].map((y, idx) => (
          <group key={y} position={[0, y, 0]}>
             <mesh castShadow receiveShadow>
                <boxGeometry args={[width - thickness*2, thickness, depth]} />
                <meshStandardMaterial color={woodColor} roughness={woodRoughness} />
             </mesh>
             {idx < 3 && (
                 <group position={[-0.7, thickness/2, 0]}>
                    {books.slice(idx * 10, (idx + 1) * 10).map((book, bIdx) => (
                       <mesh key={bIdx} position={[bIdx * 0.07 + 0.1 + Math.random()*0.05, book.height/2, (Math.random()-0.5)*0.05]} castShadow>
                           <boxGeometry args={[book.width, book.height, 0.26]} />
                           <meshStandardMaterial color={book.color} roughness={0.5} />
                       </mesh>
                    ))}
                 </group>
             )}
          </group>
      ))}
      <mesh position={[0.5, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.25, 32]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.2} roughness={0.1} />
      </mesh>
    </group>
  )
}

const RealisticPlant = (props: any) => {
    return (
        <group {...props}>
            <mesh position={[0, 0.2, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.15, 0.4, 32]} />
                <meshStandardMaterial color="#e5e7eb" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.38, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.05, 32]} />
                <meshStandardMaterial color="#3f2e20" roughness={1} />
            </mesh>
            <group position={[0, 0.4, 0]}>
                {[
                    { rot: [0.5, 0, 0.5], pos: [0.1, 0.4, 0] },
                    { rot: [0.2, 2, 0.2], pos: [-0.1, 0.5, 0.1] },
                    { rot: [-0.3, 4, -0.2], pos: [0, 0.3, -0.1] },
                    { rot: [0.6, 1, 0], pos: [0.1, 0.6, -0.1] },
                    { rot: [0, 3, 0.4], pos: [-0.15, 0.4, 0] },
                ].map((config, i) => (
                    <group key={i} rotation={config.rot as [number,number,number]}>
                         <mesh position={[0, 0.2, 0]}>
                            <cylinderGeometry args={[0.008, 0.008, 0.6]} />
                            <meshStandardMaterial color="#166534" />
                         </mesh>
                         <mesh position={[0, 0.6, 0]} rotation={[0.5, 0, 0]}>
                            <cylinderGeometry args={[0.15, 0.15, 0.01, 7]} />
                            <meshStandardMaterial color="#15803d" side={2} />
                         </mesh>
                         <mesh position={[0, 0.75, 0]} rotation={[0.5, 0, 0]}>
                             <sphereGeometry args={[0.12, 16, 16]} />
                             <meshStandardMaterial color="#15803d" />
                         </mesh>
                    </group>
                ))}
            </group>
        </group>
    )
}

const GymDumbbells = (props: any) => {
    return (
        <group {...props}>
            <group position={[0, 0, 0]} rotation={[0, 0.5, 0]}>
                <mesh position={[0, 0.04, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
                    <cylinderGeometry args={[0.02, 0.02, 0.3, 16]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
                </mesh>
                {[-0.15, 0.15].map((x, i) => (
                    <mesh key={i} position={[x, 0.08, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
                        <cylinderGeometry args={[0.08, 0.08, 0.08, 6]} />
                        <meshStandardMaterial color="#1e293b" roughness={0.5} />
                    </mesh>
                ))}
            </group>
             <group position={[0.25, 0, 0.15]} rotation={[0, 0.2, 0]}>
                <mesh position={[0, 0.04, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
                    <cylinderGeometry args={[0.02, 0.02, 0.3, 16]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
                </mesh>
                {[-0.15, 0.15].map((x, i) => (
                    <mesh key={i} position={[x, 0.08, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
                        <cylinderGeometry args={[0.08, 0.08, 0.08, 6]} />
                        <meshStandardMaterial color="#1e293b" roughness={0.5} />
                    </mesh>
                ))}
            </group>
        </group>
    )
}

const Wheelchair = (props: any) => {
    return (
        <group {...props}>
            <RoundedBox args={[0.45, 0.05, 0.45]} position={[0, 0.5, 0]} radius={0.02} castShadow>
                <meshStandardMaterial color="#1e293b" roughness={0.6} />
            </RoundedBox>
            <RoundedBox args={[0.45, 0.5, 0.05]} position={[0, 0.8, -0.2]} radius={0.02} castShadow>
                <meshStandardMaterial color="#1e293b" roughness={0.6} />
            </RoundedBox>
            
            {[-0.26, 0.26].map((x, i) => (
                <group key={i} position={[x, 0.3, 0]}>
                    <mesh rotation={[0, Math.PI/2, 0]} castShadow>
                        <torusGeometry args={[0.3, 0.02, 16, 32]} />
                        <meshStandardMaterial color="#334155" metalness={0.1} />
                    </mesh>
                     <mesh rotation={[0, Math.PI/2, 0]}>
                        <torusGeometry args={[0.25, 0.01, 8, 32]} />
                        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                    </mesh>
                    {[0, 60, 120].map((angle, j) => (
                        <mesh key={j} rotation={[angle * (Math.PI/180), 0, 0]}>
                             <cylinderGeometry args={[0.005, 0.005, 0.6]} />
                             <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                        </mesh>
                    ))}
                </group>
            ))}
            {[-0.2, 0.2].map((x, i) => (
                <group key={i} position={[x, 0.1, 0.35]}>
                    <mesh rotation={[0, Math.PI/2, 0]} castShadow>
                        <cylinderGeometry args={[0.08, 0.08, 0.04]} />
                        <meshStandardMaterial color="#64748b" />
                    </mesh>
                    <mesh position={[0, 0.1, 0]}>
                        <cylinderGeometry args={[0.02, 0.02, 0.15]} />
                         <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                    </mesh>
                </group>
            ))}
            {[-0.24, 0.24].map((x, i) => (
                <group key={i} position={[x, 0.7, 0]}>
                     <RoundedBox args={[0.05, 0.04, 0.4]} radius={0.01}>
                         <meshStandardMaterial color="#334155" />
                     </RoundedBox>
                     <mesh position={[0, -0.15, -0.15]}>
                         <cylinderGeometry args={[0.015, 0.015, 0.3]} />
                         <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                     </mesh>
                     <mesh position={[0, -0.15, 0.15]}>
                         <cylinderGeometry args={[0.015, 0.015, 0.3]} />
                         <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                     </mesh>
                </group>
            ))}
        </group>
    )
}

const RubberFloorArea = (props: any) => {
    return (
        <group {...props}>
            {Array.from({ length: 3 }).map((_, row) => (
                Array.from({ length: 2 }).map((_, col) => (
                    <RoundedBox 
                        key={`${row}-${col}`} 
                        args={[0.98, 0.02, 0.98]} 
                        position={[col * 1.0 - 0.5, 0, row * 1.0 - 1.0]} 
                        radius={0.01} 
                        receiveShadow
                    >
                        <meshStandardMaterial 
                            color={(row + col) % 2 === 0 ? "#334155" : "#475569"} 
                            roughness={0.9} 
                        />
                    </RoundedBox>
                ))
            ))}
        </group>
    )
}

const ParallelBars = (props: any) => {
    const length = 2.5;
    const height = 0.8;
    const width = 0.6;
    
    return (
        <group {...props}>
            <RoundedBox args={[width + 0.4, 0.05, length + 0.4]} position={[0, 0.025, 0]} radius={0.02} receiveShadow>
                 <meshStandardMaterial color="#d4d4d8" roughness={0.4} />
            </RoundedBox>
            <mesh position={[0, 0.051, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[width, length]} />
                <meshStandardMaterial color="#1e293b" roughness={1} />
            </mesh>
            {[-width/2, width/2].map((x, i) => (
                <group key={i} position={[x, 0, 0]}>
                    <mesh position={[0, height, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.025, 0.025, length]} />
                        <meshStandardMaterial color="#f1f5f9" metalness={0.9} roughness={0.1} />
                    </mesh>
                    {[-length/2 + 0.2, length/2 - 0.2].map((z, j) => (
                        <mesh key={j} position={[0, height/2, z]} castShadow>
                             <cylinderGeometry args={[0.02, 0.02, height]} />
                             <meshStandardMaterial color="#cbd5e1" metalness={0.5} />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    )
}

const StylizedCloud = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshBasicMaterial color="white" toneMapped={false} />
    </mesh>
    <mesh position={[1, -0.2, 0]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial color="white" toneMapped={false} />
    </mesh>
    <mesh position={[-1, -0.1, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="white" toneMapped={false} />
    </mesh>
     <mesh position={[0.5, 0.5, 0.5]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="white" toneMapped={false} />
    </mesh>
  </group>
)

const StylizedView = () => {
    return (
        <group position={[0, -1, -5]}>
             <mesh position={[0, 0, -20]}>
                 <planeGeometry args={[60, 40]} />
                 <meshBasicMaterial color="#bae6fd" toneMapped={false} /> 
             </mesh>
             <group position={[8, 6, -18]}>
                 <mesh>
                     <circleGeometry args={[2, 32]} />
                     <meshBasicMaterial color="#fff7ed" toneMapped={false} />
                 </mesh>
                 <mesh position={[0, 0, -0.1]}>
                     <circleGeometry args={[3.5, 32]} />
                     <meshBasicMaterial color="#fef3c7" transparent opacity={0.6} toneMapped={false} />
                 </mesh>
                 <mesh position={[0, 0, -0.2]}>
                     <circleGeometry args={[5.5, 32]} />
                     <meshBasicMaterial color="#fde68a" transparent opacity={0.4} toneMapped={false} />
                 </mesh>
                 <mesh position={[0, 0, -0.3]}>
                     <circleGeometry args={[9, 32]} />
                     <meshBasicMaterial color="#fcd34d" transparent opacity={0.2} toneMapped={false} />
                 </mesh>
             </group>
             <StylizedCloud position={[4, 8, -12]} scale={1.5} />
             <StylizedCloud position={[-6, 6, -15]} scale={1.2} />
             <StylizedCloud position={[0, 10, -18]} scale={2} />
             <StylizedCloud position={[-1, 5, -13]} scale={0.7} />
             <mesh position={[0, -18, -12]}>
                 <sphereGeometry args={[18, 64, 64]} />
                 <meshBasicMaterial color="#86efac" toneMapped={false} /> 
             </mesh>
             <mesh position={[-10, -16, -8]}>
                 <sphereGeometry args={[15, 64, 64]} />
                 <meshBasicMaterial color="#4ade80" toneMapped={false} /> 
             </mesh>
             <mesh position={[12, -16, -6]}>
                 <sphereGeometry args={[16, 64, 64]} />
                 <meshBasicMaterial color="#22c55e" toneMapped={false} /> 
             </mesh>
             {[
                 [-5, -1.5, -8], [6, -2, -9], [9, -1, -7], [-8, -1, -7]
             ].map((pos, i) => (
                 <group key={i} position={pos as [number, number, number]}>
                     <mesh position={[0, 1, 0]}>
                         <cylinderGeometry args={[0.15, 0.2, 2]} />
                         <meshBasicMaterial color="#78350f" toneMapped={false} />
                     </mesh>
                     <mesh position={[0, 2.2, 0]}>
                         <sphereGeometry args={[1, 16, 16]} />
                         <meshBasicMaterial color="#15803d" toneMapped={false} />
                     </mesh>
                     <mesh position={[0.4, 2.6, 0.2]}>
                         <sphereGeometry args={[0.8, 16, 16]} />
                         <meshBasicMaterial color="#166534" toneMapped={false} />
                     </mesh>
                     <mesh position={[-0.4, 2.5, -0.2]}>
                         <sphereGeometry args={[0.9, 16, 16]} />
                         <meshBasicMaterial color="#14532d" toneMapped={false} />
                     </mesh>
                 </group>
             ))}
        </group>
    )
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [electrodes, setElectrodes] = useState<Electrode[]>([]);
  const [patientPosition, setPatientPosition] = useState<PatientPosition>('supine');
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig>({
    type: 'TENS',
    frequency: 50,
    width: 200,
    time: 15,
    intensity: 0,
    running: false
  });
  const [treatmentScore, setTreatmentScore] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackReasons, setFeedbackReasons] = useState<string[]>([]);
  const [activePillows, setActivePillows] = useState<Record<string, boolean>>({});
  const [orbitEnabled, setOrbitEnabled] = useState(true);

  // SPKQ States
  const [spkqStep, setSpkqStep] = useState<ManeuverStep | null>(null);

  useEffect(() => {
      setActivePillows({});
  }, [patientPosition]);

  // --- Actions ---

  const startSimulation = async () => {
    setGameState(GameState.LOADING_PATIENT);
    setErrorMsg(null);
    try {
      const newPatient = await generatePatientScenario();
      setPatient(newPatient);
      setGameState(GameState.DIAGNOSIS);
      setElectrodes([]);
      setPatientPosition('supine'); 
      setDeviceConfig(prev => ({ ...prev, running: false, intensity: 0 }));
    } catch (err) {
      setErrorMsg("Error al conectar con IA. Verifica tu API Key.");
      setGameState(GameState.START);
    }
  };

  const startSPKQMode = () => {
    setGameState(GameState.SPKQ_MODE);
    setPatientPosition('supine'); // Default starting position for Thomas
  };

  const handleElectrodePlacement = (point: Vector3, part: string) => {
    if (electrodes.length >= 4) return;
    const newElectrode: Electrode = {
      id: Date.now().toString(),
      position: point,
      targetBodyPart: part
    };
    setElectrodes([...electrodes, newElectrode]);
  };

  const evaluateTreatment = () => {
    if (!patient) return;
    
    let score = 100;
    const reasons: string[] = [];
    const correctPlacement = electrodes.filter(e => e.targetBodyPart.includes(patient.targetZone.split('_')[0])).length;
    if (correctPlacement < 2) {
        score -= 40;
        reasons.push("Electrodos mal colocados o insuficientes.");
    }
    const rec = patient.recommendedTreatment;
    if (deviceConfig.type !== rec.deviceType) {
        score -= 20;
        reasons.push(`Tipo de corriente incorrecto. Se esperaba ${rec.deviceType}.`);
    }
    if (Math.abs(deviceConfig.frequency - rec.frequency) > 15) {
        score -= 15;
        reasons.push(`Frecuencia inadecuada. Se recomendaba ~${rec.frequency} Hz.`);
    }
    if (deviceConfig.intensity < rec.intensityRange[0] || deviceConfig.intensity > rec.intensityRange[1]) {
        score -= 10;
        reasons.push(`Intensidad fuera de rango terapéutico (${rec.intensityRange[0]}-${rec.intensityRange[1]} mA).`);
    }
    setTreatmentScore(Math.max(0, score));
    setFeedbackReasons(reasons);
    setGameState(GameState.REPORT);
  };

  const togglePillow = (id: string) => {
      setActivePillows(prev => ({
          ...prev,
          [id]: !prev[id]
      }));
  };

  // --- Environment Component ---
  const ClinicRoom = () => (
    <group>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} receiveShadow>
            <planeGeometry args={[12, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.1} />
        </mesh>
        <gridHelper args={[12, 24, 0xcbd5e1, 0xe2e8f0]} position={[0, -0.89, 0]} />

        {/* Walls */}
        <mesh position={[0, 1.5, -4]} receiveShadow>
            <planeGeometry args={[12, 6]} />
            <meshStandardMaterial color="#f1f5f9" />
        </mesh>
        <mesh position={[6, 1.5, 0]} rotation={[0, -Math.PI/2, 0]} receiveShadow>
            <planeGeometry args={[12, 6]} />
            <meshStandardMaterial color="#f1f5f9" />
        </mesh>
        <mesh position={[-6, 1.5, 0]} rotation={[0, Math.PI/2, 0]} receiveShadow>
            <planeGeometry args={[12, 6]} />
            <meshStandardMaterial color="#f1f5f9" />
        </mesh>

        {/* Front Wall With Panoramic Window */}
        <group position={[0, 1.5, 6]} rotation={[0, Math.PI, 0]}>
            <mesh position={[-4, 0, 0]} receiveShadow>
                <planeGeometry args={[4, 6]} />
                <meshStandardMaterial color="#f0f9ff" />
            </mesh>
            <mesh position={[4, 0, 0]} receiveShadow>
                <planeGeometry args={[4, 6]} />
                <meshStandardMaterial color="#f0f9ff" />
            </mesh>
            <mesh position={[0, 2.05, 0]} receiveShadow>
                <planeGeometry args={[4, 1.9]} />
                <meshStandardMaterial color="#f0f9ff" />
            </mesh>
            <mesh position={[0, -2.05, 0]} receiveShadow>
                <planeGeometry args={[4, 1.9]} />
                <meshStandardMaterial color="#f0f9ff" />
            </mesh>
             <group position={[0, 0, 0.1]}>
                <mesh position={[0, 1.1, 0]}>
                    <boxGeometry args={[4.2, 0.2, 0.2]} />
                    <meshStandardMaterial color="#e2e8f0" />
                </mesh>
                <mesh position={[0, -1.1, 0]}>
                    <boxGeometry args={[4.2, 0.2, 0.2]} />
                    <meshStandardMaterial color="#e2e8f0" />
                </mesh>
                <mesh position={[-2.1, 0, 0]}>
                    <boxGeometry args={[0.2, 2.4, 0.2]} />
                    <meshStandardMaterial color="#e2e8f0" />
                </mesh>
                <mesh position={[2.1, 0, 0]}>
                    <boxGeometry args={[0.2, 2.4, 0.2]} />
                    <meshStandardMaterial color="#e2e8f0" />
                </mesh>
             </group>
             <mesh position={[0, 0, 0.11]}>
                <planeGeometry args={[4, 2.2]} />
                <meshBasicMaterial color="#bfdbfe" transparent opacity={0.1} />
             </mesh>
             <StylizedView />
        </group>

        {/* Baseboards */}
        <mesh position={[0, -0.8, -3.95]}>
             <boxGeometry args={[12, 0.2, 0.1]} />
             <meshStandardMaterial color="#cbd5e1" />
        </mesh>

        {/* --- PROPS --- */}
        <group position={[3, 0.5, -3.9]}>
             <RoundedBox args={[0.1, 2.8, 0.1]} position={[-0.4, 0, 0]} radius={0.02}>
                <meshStandardMaterial color="#b45309" roughness={0.3} metalness={0.1} />
             </RoundedBox>
             <RoundedBox args={[0.1, 2.8, 0.1]} position={[0.4, 0, 0]} radius={0.02}>
                <meshStandardMaterial color="#b45309" roughness={0.3} metalness={0.1} />
             </RoundedBox>
             {Array.from({length: 9}).map((_, i) => (
                 <mesh key={i} position={[0, -1.2 + (i * 0.3), 0]} rotation={[0,0,Math.PI/2]}>
                    <cylinderGeometry args={[0.025, 0.025, 0.8]} />
                    <meshStandardMaterial color="#d97706" roughness={0.4} />
                 </mesh>
             ))}
        </group>

        {/* INTERACTIVE Yoga Balls (SPKQ Trigger) */}
        <group 
            position={[-3.5, -0.9, -3.5]} 
            onClick={(e) => { e.stopPropagation(); startSPKQMode(); }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
        >
            <mesh position={[0, 0.375, 0]} castShadow>
                <sphereGeometry args={[0.375, 32, 32]} />
                <meshPhysicalMaterial color="#3b82f6" roughness={0.2} clearcoat={0.8} />
            </mesh>
            <mesh position={[0.7, 0.325, 0.2]} castShadow>
                <sphereGeometry args={[0.325, 32, 32]} />
                <meshPhysicalMaterial color="#ef4444" roughness={0.2} clearcoat={0.8} />
            </mesh>
             <mesh position={[0.3, 0.275, 0.7]} castShadow>
                <sphereGeometry args={[0.275, 32, 32]} />
                <meshPhysicalMaterial color="#a855f7" roughness={0.2} clearcoat={0.8} />
            </mesh>
            
            {/* Hover Tooltip/Hint Visual */}
            <Html position={[0, 0.8, 0]} center distanceFactor={10}>
                <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Click para Modo SPKQ
                </div>
            </Html>
        </group>

        <ModernBookshelf position={[5.0, -0.9, -1]} rotation={[0, -Math.PI/2, 0]} scale={0.6} />
        <RealisticPlant position={[5.0, -0.9, 2]} scale={1} />
        <GymDumbbells position={[5.0, -0.88, 0.5]} rotation={[0, 0.5, 0]} scale={1} />
        <mesh position={[1.5, 1.6, -3.99]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.8, 1.2]} />
            <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        <mesh position={[1.5, 1.6, -3.98]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.7, 1.1]} />
            <meshBasicMaterial color="#3b82f6" /> 
            <mesh position={[0,0,0.01]}><cylinderGeometry args={[0.05,0.05, 0.8]} /><meshBasicMaterial color="white" /></mesh>
            <mesh position={[0.15,0.2,0.01]} rotation={[0,0,0.5]}><cylinderGeometry args={[0.02,0.02, 0.4]} /><meshBasicMaterial color="white" /></mesh>
            <mesh position={[-0.15,0.2,0.01]} rotation={[0,0,-0.5]}><cylinderGeometry args={[0.02,0.02, 0.4]} /><meshBasicMaterial color="white" /></mesh>
        </mesh>
        <group position={[1, -0.89, 3.5]}>
            <RubberFloorArea />
            <ParallelBars position={[0, 0, 0]} rotation={[0, Math.PI/2, 0]} />
            <Wheelchair position={[-1.5, 0, 0.5]} rotation={[0, Math.PI/3, 0]} />
        </group>
    </group>
  );

  return (
    <div className="w-full h-screen relative bg-slate-200 text-gray-900 overflow-hidden font-inter">
      
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [2.5, 2, 3], fov: 40 }} shadows>
          <color attach="background" args={['#e2e8f0']} />
          <Suspense fallback={null}>
             <hemisphereLight intensity={0.6} color="#ffffff" groundColor="#f1f5f9" />
             <ambientLight intensity={0.5} />
             <spotLight position={[5, 8, 5]} angle={0.3} penumbra={1} intensity={1} castShadow shadow-bias={-0.0001} />
             <pointLight position={[-3, 3, -1]} intensity={0.5} color="#bfdbfe" /> 
             <directionalLight position={[0, 5, 12]} intensity={2} color="#fffbeb" castShadow shadow-bias={-0.0001} target-position={[0,0,0]} />

             <ClinicRoom />

             {/* SWITCHER LOGIC: Standard Mode vs SPKQ Mode */}
             {gameState === GameState.SPKQ_MODE ? (
                 <HumanAnatomyModel 
                    currentStep={spkqStep} 
                 />
             ) : (
                 <PatientModel 
                    gameState={gameState} 
                    targetZone={patient?.targetZone || ''} 
                    onPlaceElectrode={handleElectrodePlacement} 
                    electrodes={electrodes}
                    position={patientPosition}
                    setOrbitEnabled={setOrbitEnabled}
                    activePillows={activePillows}
                 />
             )}
             
             <ContactShadows position={[0, -0.89, 0]} opacity={0.6} scale={10} blur={2} far={4} />
             <OrbitControls 
                makeDefault
                enabled={orbitEnabled}
                minPolarAngle={0} 
                maxPolarAngle={Math.PI / 2.1} 
                minDistance={2} 
                maxDistance={6} 
                target={[0, 0, 0]}
             />
          </Suspense>
        </Canvas>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl border border-gray-200 shadow-sm text-gray-800">
             <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                <Activity className="text-blue-500"/> PhysioSim 3D
             </h1>
             <p className="text-xs text-gray-500 pl-8">
                 {gameState === GameState.SPKQ_MODE ? "Modo Semiopatología (SPKQ)" : "Simulación Clínica Avanzada"}
             </p>
          </div>

          {gameState !== GameState.SPKQ_MODE && patient && (
             <div className="flex flex-col items-end gap-4">
                 <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl border-l-4 border-blue-500 shadow-md max-w-sm text-gray-800 transition-all animate-in slide-in-from-right">
                    <div className="flex items-center gap-2 mb-2">
                        <User size={16} className="text-blue-500"/>
                        <span className="font-bold text-lg">{patient.name}, {patient.age} años</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2 bg-slate-50 p-2 rounded">
                        "{patient.complaint}"
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Zona: <span className="font-bold text-blue-600 uppercase">{patient.targetZone.replace('_', ' ')}</span></span>
                    </div>
                 </div>

                 {(gameState === GameState.DIAGNOSIS || gameState === GameState.ELECTRODE_PLACEMENT) && (
                    <div className="flex gap-2">
                         <div className="bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-md flex flex-col gap-2 pointer-events-auto animate-in fade-in">
                            <div className="flex gap-2">
                                <button onClick={() => { setPatientPosition('supine'); setElectrodes([]); }} className={`p-2 rounded-lg flex flex-col items-center gap-1 text-xs transition-colors ${patientPosition === 'supine' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-600'}`} title="Boca Arriba"><ArrowUp size={20} /><span>Supino</span></button>
                                <button onClick={() => { setPatientPosition('prone'); setElectrodes([]); }} className={`p-2 rounded-lg flex flex-col items-center gap-1 text-xs transition-colors ${patientPosition === 'prone' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-600'}`} title="Boca Abajo"><ArrowDown size={20} /><span>Prono</span></button>
                                <button onClick={() => { setPatientPosition('seated'); setElectrodes([]); }} className={`p-2 rounded-lg flex flex-col items-center gap-1 text-xs transition-colors ${patientPosition === 'seated' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-600'}`} title="Sentado"><Armchair size={20} /><span>Sentado</span></button>
                            </div>
                            <div className="border-t pt-2 text-center">
                                <p className="text-[10px] text-blue-600 flex items-center justify-center gap-1">
                                    <Hand size={12} /> Click en articulaciones para mover
                                </p>
                            </div>
                         </div>
                         <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-md pointer-events-auto animate-in fade-in min-w-[160px]">
                             <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1 border-b pb-1">
                                 <Layers size={14} /> Confort y Realces
                             </h4>
                             <div className="flex flex-col gap-1">
                                 {patientPosition === 'supine' && (
                                     <>
                                        <button onClick={() => togglePillow('supine_head')} className={`text-xs text-left p-1.5 rounded flex items-center justify-between ${activePillows['supine_head'] ? 'bg-green-100 text-green-700' : 'hover:bg-gray-50'}`}>Cabezal {activePillows['supine_head'] && <CheckCircle2 size={12}/>}</button>
                                        <button onClick={() => togglePillow('supine_knees')} className={`text-xs text-left p-1.5 rounded flex items-center justify-between ${activePillows['supine_knees'] ? 'bg-green-100 text-green-700' : 'hover:bg-gray-50'}`}>Bajo Rodillas {activePillows['supine_knees'] && <CheckCircle2 size={12}/>}</button>
                                        <button onClick={() => togglePillow('supine_lumbar')} className={`text-xs text-left p-1.5 rounded flex items-center justify-between ${activePillows['supine_lumbar'] ? 'bg-green-100 text-green-700' : 'hover:bg-gray-50'}`}>Lumbar {activePillows['supine_lumbar'] && <CheckCircle2 size={12}/>}</button>
                                     </>
                                 )}
                                 {patientPosition === 'prone' && (
                                     <>
                                        <button onClick={() => togglePillow('prone_ankles')} className={`text-xs text-left p-1.5 rounded flex items-center justify-between ${activePillows['prone_ankles'] ? 'bg-green-100 text-green-700' : 'hover:bg-gray-50'}`}>Bajo Tobillos {activePillows['prone_ankles'] && <CheckCircle2 size={12}/>}</button>
                                        <button onClick={() => togglePillow('prone_abdomen')} className={`text-xs text-left p-1.5 rounded flex items-center justify-between ${activePillows['prone_abdomen'] ? 'bg-green-100 text-green-700' : 'hover:bg-gray-50'}`}>Abdomen {activePillows['prone_abdomen'] && <CheckCircle2 size={12}/>}</button>
                                        <button onClick={() => togglePillow('prone_shoulders')} className={`text-xs text-left p-1.5 rounded flex items-center justify-between ${activePillows['prone_shoulders'] ? 'bg-green-100 text-green-700' : 'hover:bg-gray-50'}`}>Bajo Hombros {activePillows['prone_shoulders'] && <CheckCircle2 size={12}/>}</button>
                                        <button onClick={() => togglePillow('prone_head')} className={`text-xs text-left p-1.5 rounded flex items-center justify-between ${activePillows['prone_head'] ? 'bg-green-100 text-green-700' : 'hover:bg-gray-50'}`}>Frente {activePillows['prone_head'] && <CheckCircle2 size={12}/>}</button>
                                     </>
                                 )}
                                 {patientPosition === 'seated' && (
                                     <button onClick={() => togglePillow('seated_table')} className={`text-xs text-left p-1.5 rounded flex items-center justify-between ${activePillows['seated_table'] ? 'bg-green-100 text-green-700' : 'hover:bg-gray-50'}`}>Apoyo en Mesa {activePillows['seated_table'] && <CheckCircle2 size={12}/>}</button>
                                 )}
                             </div>
                         </div>
                    </div>
                 )}
             </div>
          )}
        </div>

        {/* Center UI - Only for Standard Mode Start/Loading */}
        {gameState !== GameState.SPKQ_MODE && (
            <div className="pointer-events-auto self-center flex flex-col items-center justify-center w-full max-w-4xl">
                {gameState === GameState.START && (
                    <div className="text-center bg-white/95 p-12 rounded-3xl border border-gray-200 shadow-2xl max-w-lg text-gray-800">
                        <div className="mb-6 flex justify-center"><div className="bg-blue-100 p-4 rounded-full"><Zap size={48} className="text-blue-600"/></div></div>
                        <h2 className="text-3xl font-bold mb-2 text-slate-800">Bienvenido, Colega</h2>
                        <p className="text-gray-500 mb-8">
                            La sala de espera tiene pacientes aguardando. Prepara tu equipo de electroterapia.
                            <br/><span className="text-xs text-blue-500">(Click en las pelotas de yoga para modo Semiopatología)</span>
                        </p>
                        {errorMsg && <p className="text-red-600 mb-4 text-sm bg-red-50 p-2 rounded">{errorMsg}</p>}
                        <button onClick={startSimulation} className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-2 mx-auto shadow-xl transform hover:scale-105">
                            Ingresar Paciente
                        </button>
                    </div>
                )}
                {gameState === GameState.LOADING_PATIENT && (
                    <div className="bg-white/90 p-8 rounded-xl flex flex-col items-center gap-4 shadow-xl text-gray-800">
                        <Loader2 className="animate-spin text-blue-500" size={48} />
                        <p className="font-medium text-slate-600">Generando caso clínico con IA...</p>
                    </div>
                )}
                {/* Other standard modes UI components (Equipment, Placement, Programming, Report) would be here */}
                {gameState === GameState.EQUIPMENT_SELECTION && (
                    <div className="flex gap-6 animate-in slide-in-from-bottom-10">
                        <button onClick={() => { setDeviceConfig(p => ({...p, type: 'TENS'})); setGameState(GameState.ELECTRODE_PLACEMENT); }} className="w-48 h-48 bg-white hover:bg-blue-50 border-2 border-transparent hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all shadow-xl hover:-translate-y-2">
                            <div className="bg-blue-100 text-blue-600 p-4 rounded-full"><Zap size={32} /></div>
                            <div className="text-center"><p className="font-bold text-lg text-slate-800">TENS</p><p className="text-xs text-gray-500 mt-1">Analgesia</p></div>
                        </button>
                        <button onClick={() => { setDeviceConfig(p => ({...p, type: 'EMS'})); setGameState(GameState.ELECTRODE_PLACEMENT); }} className="w-48 h-48 bg-white hover:bg-orange-50 border-2 border-transparent hover:border-orange-500 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all shadow-xl hover:-translate-y-2">
                            <div className="bg-orange-100 text-orange-600 p-4 rounded-full"><Activity size={32} /></div>
                            <div className="text-center"><p className="font-bold text-lg text-slate-800">EMS</p><p className="text-xs text-gray-500 mt-1">Estimulación</p></div>
                        </button>
                    </div>
                )}
                {gameState === GameState.ELECTRODE_PLACEMENT && (
                    <div className="bg-white/95 p-4 px-8 rounded-full text-center shadow-2xl border border-blue-200 flex items-center gap-6 animate-in slide-in-from-bottom">
                        <div className="text-left"><h3 className="font-bold text-slate-800">Coloca los electrodos</h3><p className="text-xs text-gray-500">Haz click en las zonas resaltadas del paciente</p></div>
                        <div className="h-8 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                             <div className={`w-3 h-3 rounded-full ${electrodes.length > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                             <div className={`w-3 h-3 rounded-full ${electrodes.length > 1 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                             <div className={`w-3 h-3 rounded-full ${electrodes.length > 2 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                             <div className={`w-3 h-3 rounded-full ${electrodes.length > 3 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        </div>
                        <button onClick={() => electrodes.length >= 2 ? setGameState(GameState.PROGRAMMING) : alert("Coloca al menos 2 electrodos")} disabled={electrodes.length < 2} className={`px-6 py-2 rounded-full font-bold transition-all ${electrodes.length >= 2 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg' : 'bg-gray-200 text-gray-400'}`}>Listo</button>
                         <button onClick={() => setElectrodes([])} className="text-xs text-red-400 hover:text-red-600 font-semibold">Reiniciar</button>
                    </div>
                )}
                {gameState === GameState.PROGRAMMING && (
                     <DeviceInterface config={deviceConfig} setConfig={setDeviceConfig} onComplete={() => setGameState(GameState.TREATING)} />
                )}
                {gameState === GameState.TREATING && (
                    <div className="bg-white/95 p-8 rounded-2xl text-center shadow-2xl border-t-4 border-green-500 max-w-md mx-auto relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-green-200"><div className="h-full bg-green-500 animate-[width_3s_ease-in-out_forwards]" style={{width: '0%'}}></div></div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">Tratando...</h3>
                        <p className="text-gray-500 mb-6 text-sm">El paciente está recibiendo la corriente {deviceConfig.type}.</p>
                        <div className="flex justify-center gap-8 text-center mb-6">
                            <div><p className="text-xs text-gray-400 uppercase font-bold">Hz</p><p className="font-mono text-xl">{deviceConfig.frequency}</p></div>
                             <div><p className="text-xs text-gray-400 uppercase font-bold">Min</p><p className="font-mono text-xl">{deviceConfig.time}</p></div>
                             <div><p className="text-xs text-gray-400 uppercase font-bold">mA</p><p className="font-mono text-xl">{deviceConfig.intensity}</p></div>
                        </div>
                        <button onClick={evaluateTreatment} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2 rounded-lg text-sm font-bold transition-colors">Terminar Sesión</button>
                    </div>
                )}
                {gameState === GameState.REPORT && (
                    <div className="bg-white text-gray-900 p-10 rounded-3xl max-w-lg shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                            <div><h2 className="text-3xl font-black text-slate-800">Resultado</h2><p className="text-gray-500 text-sm">Evaluación de desempeño</p></div>
                            <div className={`text-4xl font-black ${treatmentScore > 80 ? 'text-green-500' : 'text-orange-500'}`}>{treatmentScore}%</div>
                        </div>
                        <div className="space-y-3 mb-8">
                             {treatmentScore === 100 ? (
                                <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 flex gap-3"><CheckCircle2 className="shrink-0"/><p className="text-sm font-medium">¡Excelente! El tratamiento fue configurado perfectamente según la patología.</p></div>
                            ) : (
                                feedbackReasons.map((reason, i) => (
                                    <div key={i} className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 flex gap-3 items-start"><AlertCircle size={16} className="mt-0.5 shrink-0"/><p className="text-sm">{reason}</p></div>
                                ))
                            )}
                        </div>
                        <button onClick={startSimulation} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30">Atender Siguiente Paciente</button>
                    </div>
                )}
            </div>
        )}

        {/* SPKQ UI - RENDERED WHEN IN SPKQ MODE */}
        {gameState === GameState.SPKQ_MODE && (
            <div className="pointer-events-auto z-50">
                <SPKQInterface 
                    onExit={() => { setGameState(GameState.START); setSpkqStep(null); setPatientPosition('supine'); }} 
                    onStepChange={setSpkqStep}
                    onManeuverStart={(m) => {
                        // Reset model position/rotation logic inside AnimationManager for specific maneuvers
                        if (m.id.includes('trendelenburg')) {
                            // Logic to ensure model stands up is handled in HumanAnatomyModel animation loop
                        }
                    }}
                />
            </div>
        )}

        {/* Standard Diagnosis UI */}
        {gameState === GameState.DIAGNOSIS && patient && (
            <div className="absolute bottom-6 right-6 pointer-events-auto animate-in slide-in-from-right-20">
                 <div className="bg-white/95 backdrop-blur-md p-5 rounded-xl text-center w-72 shadow-2xl border-b-4 border-green-500">
                    <h3 className="text-lg font-bold mb-1 text-slate-800">Evaluación</h3>
                    <p className="mb-4 text-gray-600 text-xs leading-tight">Revisa la historia clínica y visualiza la zona afectada.</p>
                    <button onClick={() => setGameState(GameState.EQUIPMENT_SELECTION)} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-sm shadow-lg">Seleccionar Tratamiento</button>
                </div>
            </div>
        )}
        
         <div className="pointer-events-none text-center mb-2 opacity-50 hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-slate-500 bg-white/50 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
                Rotar: Click Izq • Zoom: Rueda • Mover: Click Der • Click en Articulación: Mover Cuerpo
            </p>
        </div>

      </div>
    </div>
  );
};

export default App;
