import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ManeuverStep, GhostHandConfig } from '../types';

// Reliable Xbot URL
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r147/examples/models/gltf/Xbot.glb';

interface HumanAnatomyModelProps {
  currentStep: ManeuverStep | null;
  onAnimationComplete?: () => void;
}

// --- GHOST HAND COMPONENT ---
const GhostHand: React.FC<{ config: GhostHandConfig; scene: THREE.Group }> = ({ config, scene }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [targetFound, setTargetFound] = useState(false);
  
  useFrame(() => {
    if (!meshRef.current || !scene) return;
    
    // Find bone in the scene
    let targetBone = scene.getObjectByName(config.targetBone);
    if (!targetBone && !config.targetBone.startsWith('mixamorig')) {
        targetBone = scene.getObjectByName(`mixamorig${config.targetBone}`);
    }

    if (targetBone) {
      if (!targetFound) setTargetFound(true);
      
      const worldPos = new THREE.Vector3();
      targetBone.getWorldPosition(worldPos);
      
      const offset = new THREE.Vector3(0, 0, 0);
      if (config.pose === "C_hold") offset.set(0.15, 0, 0.1);
      if (config.pose === "LumbarSupport") offset.set(0, 0.1, -0.15); 
      if (config.pose === "Support") offset.set(-0.3, 0, 0);

      meshRef.current.position.lerp(worldPos.add(offset), 0.2);
      meshRef.current.lookAt(worldPos);
    }
  });

  if (!targetFound) return null; 

  return (
    <mesh ref={meshRef} scale={1.0}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial 
        color="#3b82f6" 
        transparent 
        opacity={0.7} 
        emissive="#3b82f6"
        emissiveIntensity={1}
        depthTest={false} 
        depthWrite={false}
      />
      <Html position={[0, 0.15, 0]} center>
         <div className="bg-blue-600/90 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap font-bold">
            Mano {config.hand === 'left' ? 'Izq' : 'Der'}
         </div>
      </Html>
    </mesh>
  );
};

export const HumanAnatomyModel: React.FC<HumanAnatomyModelProps> = ({ currentStep, onAnimationComplete }) => {
  const { scene } = useGLTF(MODEL_URL);
  
  // Determine context
  const maneuverKey = currentStep?.animation.includes('Trendelenburg') ? 'trendelenburg' : 'thomas';
  const isTrendelenburg = maneuverKey === 'trendelenburg';
  const isThomas = maneuverKey === 'thomas';

  // 1. MATERIAL SETUP
  useEffect(() => {
      scene.traverse((child: any) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: "#eebb99", 
                roughness: 0.5,
                metalness: 0.1,
                side: THREE.DoubleSide
            });
            child.castShadow = true;
        }
      });
  }, [scene]);

  // 2. HARD RESET ON MANEUVER CHANGE
  useEffect(() => {
      scene.traverse((obj) => {
          if (obj.type === 'Bone') {
              obj.rotation.set(0, 0, 0);
          }
      });
      
      const hips = scene.getObjectByName('mixamorigHips') || scene.getObjectByName('Hips');
      if (hips) {
          hips.rotation.set(0, 0, 0);
          if (isTrendelenburg) {
              hips.position.set(0, 1.0, 0); // Standing height (Increased to 1.0)
          } else {
              hips.position.set(0, 0.05, 0); // Lying height (local)
          }
      }
  }, [maneuverKey, scene, isTrendelenburg]);


  // 3. LAYOUT COORDINATES
  const layout = useMemo(() => {
      if (isTrendelenburg) {
          // STANDING: Floor position (-0.9)
          return {
              position: [0, -0.9, 0] as [number, number, number], 
              rotation: [0, 0, 0] as [number, number, number] 
          };
      } else {
          // SUPINE (Thomas)
          return {
              position: [0, 0.15, 0.8] as [number, number, number], 
              rotation: [-Math.PI / 2, 0, 0] as [number, number, number] 
          };
      }
  }, [isTrendelenburg]);

  // 4. ANIMATION LOOP
  useFrame((state, delta) => {
    if (!currentStep) return;

    const getBone = (name: string) => scene.getObjectByName(`mixamorig${name}`) || scene.getObjectByName(name);
    const lerpSpeed = delta * 3; 

    const hips = getBone('Hips');
    const spine = getBone('Spine');
    const leftUpLeg = getBone('LeftUpLeg');
    const rightUpLeg = getBone('RightUpLeg');
    const leftLeg = getBone('LeftLeg');
    const rightLeg = getBone('RightLeg');
    const leftArm = getBone('LeftArm');
    const rightArm = getBone('RightArm');

    // --- MANEUVER SPECIFIC LOGIC ---
    if (isThomas) {
       // --- THOMAS (Supine) ---
       
       if (hips) {
           // Keep hips flat on table
           hips.position.lerp(new THREE.Vector3(0, 0.05, 0), lerpSpeed); 
       }

       if (leftArm) leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, -1.2, lerpSpeed);
       if (rightArm) rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 1.2, lerpSpeed);

       // Steps
       if (currentStep.animation.includes("Paso0")) {
          // Neutral
          if (leftUpLeg) leftUpLeg.rotation.x = THREE.MathUtils.lerp(leftUpLeg.rotation.x, 0, lerpSpeed);
          if (leftLeg) leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, lerpSpeed);
       } 
       else if (currentStep.animation.includes("Paso1")) {
          // Flexion
          if (leftUpLeg) leftUpLeg.rotation.x = THREE.MathUtils.lerp(leftUpLeg.rotation.x, -1.9, lerpSpeed); 
          if (leftLeg) leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 1.8, lerpSpeed); 
       }
       else if (currentStep.animation.includes("Paso2")) {
          // Observe contralateral lift
          if (rightUpLeg) rightUpLeg.rotation.x = THREE.MathUtils.lerp(rightUpLeg.rotation.x, -0.3, lerpSpeed);
       }
    }

    else if (isTrendelenburg) {
        // --- TRENDELENBURG (Standing) ---

        if (hips) {
            // FORCE HIPS HIGH (Direct assignment to avoid Lerp lag/sinking)
            hips.position.y = 1.0; 
            hips.position.z = THREE.MathUtils.lerp(hips.position.z, 0, lerpSpeed * 2);
        }
        
        if (leftArm) leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 1.2, lerpSpeed); 
        if (rightArm) rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -1.2, lerpSpeed);

        if (currentStep.animation.includes("Paso0")) {
            if (leftUpLeg) leftUpLeg.rotation.set(0,0,0);
            if (rightUpLeg) rightUpLeg.rotation.set(0,0,0);
        }
        else if (currentStep.animation.includes("Paso1")) {
            // Lift Leg
            if (leftUpLeg) {
                leftUpLeg.rotation.x = THREE.MathUtils.lerp(leftUpLeg.rotation.x, -0.4, lerpSpeed); 
                if (leftLeg) leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0.8, lerpSpeed); 
            }
            // Shift Weight
            if (hips) hips.position.x = THREE.MathUtils.lerp(hips.position.x, -0.15, lerpSpeed);
        }
        else if (currentStep.animation.includes("Paso2")) {
            // Hip Drop
            if (hips) hips.rotation.z = THREE.MathUtils.lerp(hips.rotation.z, -0.2, lerpSpeed);
            if (spine) spine.rotation.z = THREE.MathUtils.lerp(spine.rotation.z, 0.2, lerpSpeed);
        }
    }
  });

  // --- CAMERA CONTROLLER ---
  useFrame((state, delta) => {
    if (!currentStep || !state.controls) return;
    const targetPos = new THREE.Vector3();
    const camPos = new THREE.Vector3();
    const orbit = state.controls as any;
    
    switch (currentStep.cameraPreset) {
        case 'frontal_near': 
            targetPos.set(0, 0.5, 0); camPos.set(0, 1.5, 2.0); break;
        case 'oblique_left': 
            targetPos.set(0, 0.5, 0); camPos.set(1.5, 1.2, 1.2); break;
        case 'full_body': 
            targetPos.set(0, 0, 0); camPos.set(0, 0.2, 3.5); break;
        case 'lateral_pelvis': 
            targetPos.set(0, 0, 0); camPos.set(2, 0, 0.8); break;
        case 'lateral_close':
            targetPos.set(0, 0, 0); camPos.set(1.2, 0, 0.5); break;
        default:
            targetPos.set(0, 0, 0); camPos.set(2, 2, 4);
    }
    orbit.target.lerp(targetPos, delta);
    state.camera.position.lerp(camPos, delta);
    orbit.update();
  });

  return (
    <>
        <group key={maneuverKey} position={layout.position} rotation={layout.rotation}>
            <primitive object={scene} scale={1.05} />
        </group>

        {currentStep?.handGhosts?.map((ghost, i) => (
            <GhostHand key={i} config={ghost} scene={scene} />
        ))}
    </>
  );
};