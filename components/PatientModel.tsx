import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Vector3, Quaternion, Euler } from 'three';
import { useGLTF, RoundedBox, TransformControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState, Electrode, PatientPosition } from '../types';

// Using "Xbot" - A reliable clean mesh via jsDelivr CDN to avoid rate limits
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r147/examples/models/gltf/Xbot.glb';

interface PatientModelProps {
  gameState: GameState;
  targetZone: string;
  onPlaceElectrode: (point: Vector3, part: string) => void;
  electrodes: Electrode[];
  position: PatientPosition;
  setOrbitEnabled: (enabled: boolean) => void;
  activePillows: Record<string, boolean>;
}

interface HitZoneProps {
    bone?: THREE.Object3D; // Target bone to sync with
    offset?: [number, number, number]; // Offset relative to bone
    args?: any[];
    rotation?: [number, number, number]; // Local rotation adjustment
    partName: string;
    shape?: 'box' | 'capsule' | 'sphere';
    isActiveTarget: boolean;
    gameState: GameState;
    onPlace: (point: Vector3, part: string) => void;
    onSelectBone?: (partName: string) => void;
    scale?: [number, number, number];
}

// Helper for interactive zones
const HitZone: React.FC<HitZoneProps> = ({ 
  bone,
  offset = [0, 0, 0], 
  args, 
  rotation = [0, 0, 0], 
  partName, 
  shape = 'box',
  isActiveTarget, 
  gameState, 
  onPlace,
  onSelectBone,
  scale = [1, 1, 1]
}) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  
  const isPlacementMode = gameState === GameState.ELECTRODE_PLACEMENT;
  const isManipulationMode = gameState === GameState.DIAGNOSIS || gameState === GameState.EQUIPMENT_SELECTION;
  
  const isVisible = (isPlacementMode && isActiveTarget) || (isManipulationMode && hovered);

  // Sync position with bone in World Space
  useFrame(() => {
    if (bone && meshRef.current) {
        const worldPos = new Vector3();
        const worldQuat = new Quaternion();
        
        bone.getWorldPosition(worldPos);
        bone.getWorldQuaternion(worldQuat);

        const offsetVec = new Vector3(...offset);
        offsetVec.applyQuaternion(worldQuat);
        
        meshRef.current.position.copy(worldPos).add(offsetVec);
        meshRef.current.quaternion.copy(worldQuat);

        const localRot = new Quaternion().setFromEuler(new Euler(...rotation));
        meshRef.current.quaternion.multiply(localRot);
    }
  });

  return (
    <mesh 
      ref={meshRef}
      scale={new Vector3(...scale)}
      onClick={(e) => {
        e.stopPropagation();
        if (isPlacementMode) {
          onPlace(e.point, partName);
        } else if (onSelectBone && isManipulationMode) {
          onSelectBone(partName);
        }
      }}
      onPointerOver={(e) => {
          e.stopPropagation();
          if (isManipulationMode || isPlacementMode) {
              setHovered(true);
              document.body.style.cursor = 'pointer';
          }
      }}
      onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
      }}
    >
      {shape === 'capsule' && <capsuleGeometry args={args as [number, number, number, number]} />}
      {shape === 'box' && <boxGeometry args={args as [number, number, number]} />}
      {shape === 'sphere' && <sphereGeometry args={args as [number, number, number]} />}
      
      <meshStandardMaterial 
        color={isPlacementMode ? "#22c55e" : "#fbbf24"}
        transparent 
        opacity={isVisible ? 0.4 : 0} 
        emissive={isVisible ? (isPlacementMode ? "#22c55e" : "#fbbf24") : "#000000"}
        emissiveIntensity={0.5}
        depthWrite={false}
        depthTest={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const Pillow: React.FC<{ position: [number, number, number], rotation?: [number, number, number], args?: [number, number, number] }> = ({ position, rotation=[0,0,0], args=[0.6, 0.1, 0.3] }) => {
    return (
        <RoundedBox args={args} radius={0.02} smoothness={4} position={position} rotation={rotation} castShadow receiveShadow>
            <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
        </RoundedBox>
    )
}

export const PatientModel: React.FC<PatientModelProps> = ({ 
  gameState, 
  targetZone, 
  onPlaceElectrode,
  electrodes,
  position = 'supine',
  setOrbitEnabled,
  activePillows
}) => {
  const { scene } = useGLTF(MODEL_URL);
  const [selectedBone, setSelectedBone] = useState<THREE.Object3D | null>(null);
  const transformRef = useRef<any>(null);
  
  const isTarget = (zonePrefix: string) => targetZone.startsWith(zonePrefix);

  useEffect(() => {
    setSelectedBone(null);
  }, [position, gameState]);

  useEffect(() => {
      if (transformRef.current) {
          const controls = transformRef.current;
          const startCallback = () => setOrbitEnabled(false);
          const endCallback = () => setOrbitEnabled(true);

          // Use 'change' event to detect dragging state indirectly if dragging-changed fails, 
          // but dragging-changed is correct for R3F Drei TransformControls.
          // We stick to the safe event listener approach.
          const handleDragChange = (event: any) => {
             if (event.value) startCallback();
             else endCallback();
          };

          controls.addEventListener('dragging-changed', handleDragChange);
          
          return () => {
              controls.removeEventListener('dragging-changed', handleDragChange);
          };
      }
  });

  const bones = useMemo(() => {
      return {
          shoulder_left: scene.getObjectByName('mixamorigLeftArm'),
          shoulder_right: scene.getObjectByName('mixamorigRightArm'),
          forearm_left: scene.getObjectByName('mixamorigLeftForeArm'),
          forearm_right: scene.getObjectByName('mixamorigRightForeArm'),
          thigh_left: scene.getObjectByName('mixamorigLeftUpLeg'),
          thigh_right: scene.getObjectByName('mixamorigRightUpLeg'),
          knee_left: scene.getObjectByName('mixamorigLeftLeg'), 
          knee_right: scene.getObjectByName('mixamorigRightLeg'),
          head: scene.getObjectByName('mixamorigHead'),
          torso: scene.getObjectByName('mixamorigSpine1')
      };
  }, [scene]);

  const handleBoneSelect = (partName: string) => {
      const bone = bones[partName as keyof typeof bones];
      if (bone) setSelectedBone(bone);
  };

  // --- Pose & Rigging Configuration Logic ---
  useEffect(() => {
    // 1. Material Override
    scene.traverse((child: any) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = new THREE.MeshStandardMaterial({
                color: "#eebb99", 
                roughness: 0.5,
                metalness: 0.1
            });
        }
    });

    // 2. Reset Bones
    const bonesToReset = [
        'mixamorigHips', 'mixamorigLeftUpLeg', 'mixamorigRightUpLeg', 'mixamorigLeftLeg', 'mixamorigRightLeg',
        'mixamorigLeftArm', 'mixamorigRightArm', 'mixamorigLeftForeArm', 'mixamorigRightForeArm',
        'mixamorigHead', 'mixamorigSpine', 'mixamorigSpine1', 'mixamorigSpine2', 'mixamorigLeftHand', 'mixamorigRightHand',
        'mixamorigNeck', 'mixamorigRightShoulder', 'mixamorigLeftShoulder', 'mixamorigLeftFoot', 'mixamorigRightFoot'
    ];
    bonesToReset.forEach(name => {
        const bone = scene.getObjectByName(name) || scene.getObjectByName(name.replace('mixamorig', ''));
        if (bone) bone.rotation.set(0,0,0);
    });

    // 3. Apply Poses & Pillow Reactions
    const getBone = (name: string) => scene.getObjectByName(`mixamorig${name}`) || scene.getObjectByName(name);

    const leftArm = getBone('LeftArm');
    const rightArm = getBone('RightArm');
    const leftForeArm = getBone('LeftForeArm');
    const rightForeArm = getBone('RightForeArm');
    const leftUpLeg = getBone('LeftUpLeg');
    const rightUpLeg = getBone('RightUpLeg');
    const leftLeg = getBone('LeftLeg');
    const rightLeg = getBone('RightLeg');
    const neck = getBone('Neck');
    const leftHand = getBone('LeftHand');
    const rightHand = getBone('RightHand');
    const spine = getBone('Spine');
    const leftFoot = getBone('LeftFoot');
    const rightFoot = getBone('RightFoot');

    if (position === 'supine') {
        // SUPINE BASE POSE
        if (leftArm) { leftArm.rotation.z = -1.2; leftArm.rotation.x = -0.1; leftArm.rotation.y = 0.5; }
        if (rightArm) { rightArm.rotation.z = 1.2; rightArm.rotation.x = -0.1; rightArm.rotation.y = -0.5; }
        if (leftUpLeg) leftUpLeg.rotation.x = -0.1;
        if (rightUpLeg) rightUpLeg.rotation.x = -0.1;
        if (leftLeg) leftLeg.rotation.x = 0.2;
        if (rightLeg) rightLeg.rotation.x = 0.2;

        // --- PILLOW REACTIONS (Supine) ---
        // Knees (Popliteal) -> Stronger flexion to rest on pillow, feet down to table
        if (activePillows['supine_knees']) {
            if (leftUpLeg) leftUpLeg.rotation.x = -0.25; // Flex hip to lift thigh
            if (rightUpLeg) rightUpLeg.rotation.x = -0.25;
            if (leftLeg) leftLeg.rotation.x = 0.65; // Flex knee significantly to drop foot
            if (rightLeg) rightLeg.rotation.x = 0.65;
            // Adjust feet to look natural
            if (leftFoot) leftFoot.rotation.x = 0.2;
            if (rightFoot) rightFoot.rotation.x = 0.2;
        }
        // Head -> Flex neck forward
        if (activePillows['supine_head']) {
             if (neck) neck.rotation.x = 0.3;
        }


    } else if (position === 'prone') {
        // PRONE BASE POSE
        if (leftArm) { leftArm.rotation.z = -1.3; leftArm.rotation.x = -0.15; leftArm.rotation.y = -0.2; }
        if (leftForeArm) leftForeArm.rotation.x = 0.4; 

        if (rightArm) { rightArm.rotation.z = 1.3; rightArm.rotation.x = -0.15; rightArm.rotation.y = 0.2; }
        if (rightForeArm) rightForeArm.rotation.x = 0.4;
        
        if (leftHand) leftHand.rotation.x = 0.2;
        if (rightHand) rightHand.rotation.x = 0.2;
        if (neck) neck.rotation.x = -0.5; 

        // --- PILLOW REACTIONS (Prone) ---
        // Ankles -> Pillow is now lower, reduce flexion so legs drop to contact it
        if (activePillows['prone_ankles']) {
             if (leftLeg) leftLeg.rotation.x = 0.15; // Reduced from 0.25 to let feet drop
             if (rightLeg) rightLeg.rotation.x = 0.15;
        }
        // Shoulders -> Lift torso/shoulders slightly
        if (activePillows['prone_shoulders']) {
             if (leftArm) leftArm.rotation.x = 0.05; 
             if (rightArm) rightArm.rotation.x = 0.05;
        }
        // Head -> Adjust neck
        if (activePillows['prone_head']) {
            if (neck) neck.rotation.x = -0.1; 
        }

    } else if (position === 'seated') {
        // SEATED BASE POSE
        if (leftUpLeg) leftUpLeg.rotation.x = -1.57;
        if (rightUpLeg) rightUpLeg.rotation.x = -1.57;
        if (leftLeg) leftLeg.rotation.x = 1.6;
        if (rightLeg) rightLeg.rotation.x = 1.6;
        
        if (leftArm) { leftArm.rotation.y = -0.5; leftArm.rotation.x = -0.4; leftArm.rotation.z = -0.2; }
        if (rightArm) { rightArm.rotation.y = 0.5; rightArm.rotation.x = -0.4; rightArm.rotation.z = 0.2; }
        if (leftForeArm) leftForeArm.rotation.y = -1.5; 
        if (rightForeArm) rightForeArm.rotation.y = 1.5;
        if (leftHand) leftHand.rotation.x = 0.5;
        if (rightHand) rightHand.rotation.x = 0.5;

        // --- PILLOW REACTIONS (Seated) ---
        // Table Support -> Flex spine forward, lift arms
        if (activePillows['seated_table']) {
             if (spine) spine.rotation.x = 0.3; // Lean forward
             if (leftArm) leftArm.rotation.x = -0.6; // Lift arm to rest on stack
             if (rightArm) rightArm.rotation.x = -0.6;
        }
    }

  }, [scene, position, activePillows]);


  const layout = useMemo(() => {
      if (position === 'seated') {
        const Z_POS = -1.5; 
        const Y_POS = -1.3;
        return {
            modelPos: [0, Y_POS, Z_POS] as [number, number, number], 
            modelRot: [0, 0, 0] as [number, number, number], 
            chairPos: [0, -0.9, Z_POS], 
        };
      } else {
          const isProne = position === 'prone';
          const Z_FEET = 0.8;
          return {
            modelPos: [0, isProne ? 0.14 : 0.15, Z_FEET] as [number, number, number],
            modelRot: isProne ? [-Math.PI/2, Math.PI, 0] : [-Math.PI/2, 0, 0] as [number, number, number],
            chairPos: [0, -10, 0],
          };
      }
  }, [position]);

  return (
    <group position={[0, 0, 0]} onClick={() => setSelectedBone(null)}>
      
      {/* --- Transform Controls --- */}
      {selectedBone && (gameState === GameState.DIAGNOSIS || gameState === GameState.EQUIPMENT_SELECTION) && (
          <TransformControls 
            ref={transformRef}
            object={selectedBone} 
            mode="rotate" 
            space="local"
            size={0.7}
            showX={true}
            showY={true}
            showZ={true}
            translationSnap={null}
          />
      )}

      {/* --- Treatment Table --- */}
      <group position={[0, -0.05, 0]}>
        <RoundedBox args={[1.3, 0.1, 2.3]} radius={0.02} smoothness={4}>
            <meshStandardMaterial color="#475569" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0.051, -0.8]} rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={[0.6, 0.8]} />
            <meshStandardMaterial color="#ffffff" opacity={0.9} transparent />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[1.25, 0.1, 2.25]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>
        {[
            [0.6, -0.75, 1.0], [-0.6, -0.75, 1.0],
            [0.6, -0.75, -1.0], [-0.6, -0.75, -1.0]
        ].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 1.4]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
        ))}
      </group>

      {/* --- Chair (Seated Mode) --- */}
      {position === 'seated' && (
        <group position={layout.chairPos as [number, number, number]}>
            <mesh position={[0, 0.5, 0]} castShadow>
                <boxGeometry args={[0.45, 0.05, 0.45]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            {[
                [0.2, 0.25, 0.2], [-0.2, 0.25, 0.2],
                [0.2, 0.25, -0.2], [-0.2, 0.25, -0.2]
            ].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]}> 
                    <cylinderGeometry args={[0.02, 0.02, 0.5]} /> 
                    <meshStandardMaterial color="#94a3b8" /> 
                </mesh>
            ))}
            <mesh position={[0, 0.8, -0.2]}>
                <boxGeometry args={[0.45, 0.6, 0.05]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
        </group>
      )}

      {/* --- ACTIVE PILLOWS RENDER --- */}
      {/* Supine Pillows */}
      {position === 'supine' && activePillows['supine_head'] && (
          <Pillow position={[0, 0.05, -0.9]} args={[0.5, 0.08, 0.3]} />
      )}
      {position === 'supine' && activePillows['supine_knees'] && (
          // Adjusted: Positioned under popliteal fossa (Z=0.28), slightly higher
          <Pillow position={[0, 0.1, 0.28]} args={[0.8, 0.12, 0.3]} rotation={[0, 0, 0]} />
      )}
      {position === 'supine' && activePillows['supine_lumbar'] && (
          // Adjusted: Moved to -0.45 (lumbar spine) instead of -0.25 (glute)
          <Pillow position={[0, 0.02, -0.45]} args={[0.4, 0.04, 0.2]} />
      )}

      {/* Prone Pillows */}
      {position === 'prone' && activePillows['prone_ankles'] && (
          // Adjusted: Thicker (0.12) to touch leg, Z=0.55 (distal shin)
          <Pillow position={[0, 0.06, 0.55]} args={[0.8, 0.12, 0.3]} />
      )}
      {position === 'prone' && activePillows['prone_abdomen'] && (
          <Pillow position={[0, 0.02, -0.15]} args={[0.4, 0.04, 0.3]} />
      )}
      {position === 'prone' && activePillows['prone_shoulders'] && (
          // Adjusted: Thicker (0.15) to ensure contact with shoulders. Y at 0.075 (half height)
          <group>
             <Pillow position={[0.25, 0.075, -0.65]} args={[0.2, 0.15, 0.2]} />
             <Pillow position={[-0.25, 0.075, -0.65]} args={[0.2, 0.15, 0.2]} />
          </group>
      )}
      {position === 'prone' && activePillows['prone_head'] && (
          // Adjusted: Much thinner (0.025) to avoid face clipping
          <Pillow position={[0, 0.02, -0.92]} args={[0.25, 0.025, 0.2]} />
      )}

      {/* Seated Pillows */}
      {position === 'seated' && activePillows['seated_table'] && (
          <group position={[0, 0.1, -1.15]}> {/* Edge of table */}
              <Pillow position={[0, 0, 0]} args={[0.5, 0.1, 0.4]} />
              <Pillow position={[0, 0.1, 0]} args={[0.5, 0.1, 0.4]} />
          </group>
      )}

      {/* --- Patient --- */}
      <primitive 
        object={scene} 
        scale={1.05} 
        position={layout.modelPos} 
        rotation={layout.modelRot} 
      />

      {/* --- INTERACTIVE BONE ZONES (World Space Sync) --- */}
      
      <HitZone 
         bone={bones.head}
         offset={[0, 0.1, 0]} 
         args={[0.11]} 
         shape="sphere"
         partName="head"
         gameState={gameState}
         onPlace={onPlaceElectrode}
         onSelectBone={handleBoneSelect}
         isActiveTarget={false}
      />

      <HitZone 
         bone={bones.torso}
         offset={[0, 0.15, 0]}
         args={[0.28, 0.45, 0.2]} 
         shape="box"
         partName="torso"
         gameState={gameState}
         onPlace={onPlaceElectrode}
         onSelectBone={handleBoneSelect}
         isActiveTarget={isTarget('back')}
      />

      <HitZone 
         bone={bones.shoulder_left}
         offset={[0.12, 0, 0]} 
         rotation={[0, 0, Math.PI / 2]} 
         args={[0.08, 0.28]} 
         shape="capsule"
         partName="shoulder_left"
         gameState={gameState}
         onPlace={onPlaceElectrode}
         onSelectBone={handleBoneSelect}
         isActiveTarget={isTarget('shoulder_left')}
      />
      <HitZone 
         bone={bones.shoulder_right}
         offset={[-0.12, 0, 0]} 
         rotation={[0, 0, Math.PI / 2]}
         args={[0.08, 0.28]} 
         shape="capsule"
         partName="shoulder_right"
         gameState={gameState}
         onPlace={onPlaceElectrode}
         onSelectBone={handleBoneSelect}
         isActiveTarget={isTarget('shoulder_right')}
      />

      <HitZone 
         bone={bones.forearm_left}
         offset={[0.12, 0, 0]} 
         rotation={[0, 0, Math.PI / 2]}
         args={[0.06, 0.24]} 
         shape="capsule"
         partName="forearm_left"
         gameState={gameState}
         onPlace={onPlaceElectrode}
         onSelectBone={handleBoneSelect}
         isActiveTarget={false}
      />
      <HitZone 
         bone={bones.forearm_right}
         offset={[-0.12, 0, 0]} 
         rotation={[0, 0, Math.PI / 2]}
         args={[0.06, 0.24]} 
         shape="capsule"
         partName="forearm_right"
         gameState={gameState}
         onPlace={onPlaceElectrode}
         onSelectBone={handleBoneSelect}
         isActiveTarget={false}
      />

      <HitZone 
         bone={bones.thigh_left}
         offset={[0, -0.25, 0]} 
         args={[0.11, 0.38]} 
         shape="capsule"
         partName="thigh_left"
         gameState={gameState}
         onPlace={onPlaceElectrode}
         onSelectBone={handleBoneSelect}
         isActiveTarget={false}
      />
      <HitZone 
         bone={bones.thigh_right}
         offset={[0, -0.25, 0]} 
         args={[0.11, 0.38]} 
         shape="capsule"
         partName="thigh_right"
         gameState={gameState}
         onPlace={onPlaceElectrode}
         onSelectBone={handleBoneSelect}
         isActiveTarget={false}
      />

      <HitZone 
         bone={bones.knee_left}
         offset={[0, -0.25, 0]} 
         args={[0.08, 0.36]} 
         shape="capsule"
         partName="knee_left" 
         gameState={gameState}
         onPlace={onPlaceElectrode}
         onSelectBone={handleBoneSelect}
         isActiveTarget={isTarget('knee_left')}
      />
       <HitZone 
         bone={bones.knee_right}
         offset={[0, -0.25, 0]} 
         args={[0.08, 0.36]} 
         shape="capsule"
         partName="knee_right" 
         gameState={gameState}
         onPlace={onPlaceElectrode}
         onSelectBone={handleBoneSelect}
         isActiveTarget={isTarget('knee_right')}
      />

      {/* Electrodes Visuals */}
      {electrodes.map((el) => (
        <group key={el.id} position={el.position}>
            <mesh rotation={[0,0,0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.005, 32]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.005, 0]}>
                 <boxGeometry args={[0.01, 0.01, 0.01]} />
                 <meshStandardMaterial color="#3b82f6" />
            </mesh>
        </group>
      ))}
      
      {/* Wires */}
      {electrodes.map((el) => (
          <line key={`line-${el.id}`}>
              <bufferGeometry>
                  <float32BufferAttribute 
                    attach="attributes-position" 
                    args={[
                        new Float32Array([
                            el.position.x, el.position.y + 0.01, el.position.z, 
                            el.position.x * 0.8, 0.5, el.position.z * 0.8 + 0.5, 
                            1.0, 0.8, 1.0 
                        ]), 
                        3
                    ]} 
                    count={3} 
                    itemSize={3} 
                  />
              </bufferGeometry>
              <lineBasicMaterial color={el.id.endsWith('0') || el.id.endsWith('2') ? "#ef4444" : "#3b82f6"} linewidth={2} />
          </line>
      ))}
    </group>
  );
};

useGLTF.preload(MODEL_URL);