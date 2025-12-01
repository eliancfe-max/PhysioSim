import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLoader, useFrame, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ManeuverStep, GhostHandConfig } from '../types';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r147/examples/models/gltf/Xbot.glb';

interface HumanAnatomyModelProps {
  currentStep: ManeuverStep | null;
  onAnimationComplete?: () => void;
}

// --- GHOST HAND COMPONENT ---
const GhostHand: React.FC<{ config: GhostHandConfig; scene: THREE.Object3D }> = ({ config, scene }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [targetFound, setTargetFound] = useState(false);
  
  useFrame(() => {
    if (!meshRef.current || !scene) return;
    
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
  const gltf = useLoader(GLTFLoader, MODEL_URL);
  const { controls, camera } = useThree(); 
  
  const modelScene = useMemo(() => {
    return SkeletonUtils.clone(gltf.scene);
  }, [gltf]);

  const maneuverKey = currentStep?.animation.includes('Trendelenburg') ? 'trendelenburg' : 'thomas';
  const isTrendelenburg = maneuverKey === 'trendelenburg';
  const isThomas = maneuverKey === 'thomas';

  // CAMERA SETUP - Only on maneuver change
  useEffect(() => {
    if (!controls || !camera) return;
    
    const orbit = controls as any;
    
    if (isTrendelenburg) {
        camera.position.set(0, 1.0, 4.5);
        orbit.target.set(0, 0.6, 0);
    } else {
        camera.position.set(0, 1.2, 2.5);
        orbit.target.set(0, 0.3, 0);
    }
    
    orbit.update();
  }, [maneuverKey, controls, camera, isTrendelenburg]);

  // MATERIAL SETUP
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

  // RESET BONES ON MANEUVER CHANGE
  useEffect(() => {
      modelScene.traverse((obj) => {
          if (obj.type === 'Bone') {
              obj.rotation.set(0, 0, 0);
          }
      });
  }, [maneuverKey, modelScene]);

  // LAYOUT COORDINATES
  const layout = useMemo(() => {
      if (isTrendelenburg) {
          return {
              position: [0, 0.2, 0] as [number, number, number],
              rotation: [0, 0, 0] as [number, number, number] 
          };
      } else {
          return {
              position: [0, 0.15, 0.8] as [number, number, number], 
              rotation: [-Math.PI / 2, 0, 0] as [number, number, number] 
          };
      }
  }, [isTrendelenburg]);

  // ANIMATION LOOP
  useFrame((state, delta) => {
    if (!currentStep) return;

    const getBone = (name: string) => {
      return modelScene.getObjectByName(`mixamorig${name}`) || modelScene.getObjectByName(name);
    };
    
    const lerpSpeed = delta * 3; 

    const hips = getBone('Hips');
    const spine = getBone('Spine');
    const leftUpLeg = getBone('LeftUpLeg');
    const rightUpLeg = getBone('RightUpLeg');
    const leftLeg = getBone('LeftLeg');
    const rightLeg = getBone('RightLeg');
    const leftArm = getBone('LeftArm');
    const rightArm = getBone('RightArm');

    if (isThomas) {
       if (hips) {
           hips.position.y = THREE.MathUtils.lerp(hips.position.y, 0.05, lerpSpeed * 2);
           hips.position.z = THREE.MathUtils.lerp(hips.position.z, 0, lerpSpeed);
       }
       
       if (leftArm) leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, -1.2, lerpSpeed);
       if (rightArm) rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 1.2, lerpSpeed);

       if (currentStep.animation.includes("Paso0")) {
          if (leftUpLeg) leftUpLeg.rotation.x = THREE.MathUtils.lerp(leftUpLeg.rotation.x, 0, lerpSpeed);
          if (leftLeg) leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, lerpSpeed);
       } 
       else if (currentStep.animation.includes("Paso1")) {
          if (leftUpLeg) leftUpLeg.rotation.x = THREE.MathUtils.lerp(leftUpLeg.rotation.x, -1.9, lerpSpeed); 
          if (leftLeg) leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 1.8, lerpSpeed); 
       }
       else if (currentStep.animation.includes("Paso2")) {
          if (rightUpLeg) rightUpLeg.rotation.x = THREE.MathUtils.lerp(rightUpLeg.rotation.x, -0.3, lerpSpeed);
       }
    }

    else if (isTrendelenburg) {
        if (hips) {
            hips.position.y = THREE.MathUtils.lerp(hips.position.y, 0.95, lerpSpeed * 2);
            hips.position.z = THREE.MathUtils.lerp(hips.position.z, 0, lerpSpeed);
        }

        if (leftArm) leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 1.2, lerpSpeed); 
        if (rightArm) rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -1.2, lerpSpeed);

        if (currentStep.animation.includes("Paso0")) {
            if (leftUpLeg) leftUpLeg.rotation.set(0, 0, 0);
            if (rightUpLeg) rightUpLeg.rotation.set(0, 0, 0);
            if (hips) hips.position.x = THREE.MathUtils.lerp(hips.position.x, 0, lerpSpeed);
        }
        else if (currentStep.animation.includes("Paso1")) {
            if (leftUpLeg) leftUpLeg.rotation.x = THREE.MathUtils.lerp(leftUpLeg.rotation.x, -0.4, lerpSpeed); 
            if (leftLeg) leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0.8, lerpSpeed); 
            if (hips) hips.position.x = THREE.MathUtils.lerp(hips.position.x, -0.15, lerpSpeed);
        }
        else if (currentStep.animation.includes("Paso2")) {
            // PELVIS DROP with vertical alignment
            if (leftUpLeg) {
                leftUpLeg.rotation.x = THREE.MathUtils.lerp(leftUpLeg.rotation.x, -0.4, lerpSpeed); // Hip flexion
                leftUpLeg.rotation.z = THREE.MathUtils.lerp(leftUpLeg.rotation.z, 0.3, lerpSpeed); // ABduction (positive = open outward)
            }
            if (leftLeg) {
                leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0.8, lerpSpeed);
            }
            
            if (rightUpLeg) {
                rightUpLeg.rotation.z = THREE.MathUtils.lerp(rightUpLeg.rotation.z, 0.25, lerpSpeed); // ADduction
                rightUpLeg.rotation.x = THREE.MathUtils.lerp(rightUpLeg.rotation.x, 0, lerpSpeed);
            }
            
            if (hips) {
                hips.rotation.z = THREE.MathUtils.lerp(hips.rotation.z, -0.2, lerpSpeed);
                hips.position.x = THREE.MathUtils.lerp(hips.position.x, 0.08, lerpSpeed);
            }
            
            if (spine) {
                spine.rotation.z = THREE.MathUtils.lerp(spine.rotation.z, 0.25, lerpSpeed);
            }
        }
    }
  });

  return (
    <>
        <group key={maneuverKey} position={layout.position} rotation={layout.rotation}>
            <primitive object={modelScene} scale={1.05} />
        </group>

        {currentStep?.handGhosts?.map((ghost, i) => (
            <GhostHand key={i} config={ghost} scene={modelScene} />
        ))}
    </>
  );
};