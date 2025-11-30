
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
    
    // Find bone in the CLONED scene
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
  
  // 1. CLONE SCENE (Critical: Create independent instance for animations)
  // This ensures we can animate this specific model instance without affecting others
  const modelScene = useMemo(() => scene.clone(), [scene]);

  const maneuverKey = currentStep?.animation.includes('Trendelenburg') ? 'trendelenburg' : 'thomas';
  const isTrendelenburg = maneuverKey === 'trendelenburg';
  const isThomas = maneuverKey === 'thomas';

  // 2. MATERIAL SETUP (On Clone)
  useEffect(() => {
      modelScene.traverse((child: any) => {
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
  }, [modelScene]);

  // 3. HARD RESET ON MANEUVER CHANGE
  // This cleans up any "dirty" rotations from the previous maneuver immediately.
  useEffect(() => {
      // Reset all bone rotations to T-Pose
      modelScene.traverse((obj) => {
          if (obj.type === 'Bone') {
              obj.rotation.set(0, 0, 0);
          }
      });
      
      // FORCE HIPS POSITION:
      // This is crucial. If we don't set this immediately, 
      // the model might start "lying down" during Trendelenburg or "floating" in Thomas.
      const hips = modelScene.getObjectByName('mixamorigHips') || modelScene.getObjectByName('Hips');
      if (hips) {
          hips.rotation.set(0,0,0);
          if (isTrendelenburg) {
              hips.position.set(0, 0.95, 0); // Standing height relative to feet
          } else {
              hips.position.set(0, 0.05, 0); // Lying height relative to table
          }
      }
  }, [maneuverKey, modelScene, isTrendelenburg]);


  // 4. LAYOUT COORDINATES (Global Transform)
  const layout = useMemo(() => {
      if (isTrendelenburg) {
          // STANDING: Vertical rotation, Floor position (-0.9)
          return {
              position: [0, -0.9, 0] as [number, number, number], 
              rotation: [0, 0, 0] as [number, number, number] 
          };
      } else {
          // SUPINE (Thomas): -90 deg rotation on X.
          // Position Z=0.8 aligns feet to bottom of table.
          return {
              position: [0, 0.15, 0.8] as [number, number, number], 
              rotation: [-Math.PI / 2, 0, 0] as [number, number, number] 
          };
      }
  }, [isTrendelenburg]);

  // 5. ANIMATION LOOP (Targeting CLONE)
  useFrame((state, delta) => {
    if (!currentStep) return;

    // Search in modelScene (Clone)
    const getBone = (name: string) => modelScene.getObjectByName(`mixamorig${name}`) || modelScene.getObjectByName(name);
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
       
       // Force Hips to Table level
       if (hips) {
           hips.position.lerp(new THREE.Vector3(0, 0.05, 0), lerpSpeed); 
       }

       // Arms at side (Neutral)
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
        
        // Force Hips to Standing height
        if (hips) {
            hips.position.lerp(new THREE.Vector3(0, 0.95, 0), lerpSpeed); 
        }

        // Arms down
        if (leftArm) leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 1.2, lerpSpeed); 
        if (rightArm) rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -1.2, lerpSpeed);

        // Steps
        if (currentStep.animation.includes("Paso0")) {
            if (leftUpLeg) leftUpLeg.rotation.set(0,0,0);
            if (rightUpLeg) rightUpLeg.rotation.set(0,0,0);
            if (hips) hips.position.x = THREE.MathUtils.lerp(hips.position.x, 0, lerpSpeed);
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
        {/* Key prop ensures the GROUP transform is reset when maneuver changes */}
        <group key={maneuverKey} position={layout.position} rotation={layout.rotation}>
            <primitive object={modelScene} scale={1.0} />
        </group>

        {currentStep?.handGhosts?.map((ghost, i) => (
            <GhostHand key={i} config={ghost} scene={modelScene} />
        ))}
    </>
  );
};
