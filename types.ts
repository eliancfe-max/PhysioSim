import { Vector3 } from 'three';

export enum GameState {
  START = 'START',
  LOADING_PATIENT = 'LOADING_PATIENT',
  DIAGNOSIS = 'DIAGNOSIS',
  EQUIPMENT_SELECTION = 'EQUIPMENT_SELECTION',
  ELECTRODE_PLACEMENT = 'ELECTRODE_PLACEMENT',
  PROGRAMMING = 'PROGRAMMING',
  TREATING = 'TREATING',
  REPORT = 'REPORT',
  SPKQ_MODE = 'SPKQ_MODE' // New Mode
}

export type PatientPosition = 'supine' | 'prone' | 'seated' | 'standing'; // Added standing for Trendelenburg

export interface Patient {
  name: string;
  age: number;
  profession: string;
  complaint: string; 
  history: string;
  targetZone: 'back' | 'shoulder_left' | 'shoulder_right' | 'knee_left' | 'knee_right';
  recommendedTreatment: {
    deviceType: 'TENS' | 'EMS' | 'IFC';
    frequency: number; 
    duration: number; 
    intensityRange: [number, number]; 
  };
}

export interface Electrode {
  id: string;
  position: Vector3;
  targetBodyPart: string;
}

export interface DeviceConfig {
  type: 'TENS' | 'EMS' | 'IFC';
  frequency: number;
  width: number; 
  time: number; 
  intensity: number; 
  running: boolean;
}

export type BodyPartName = 'torso' | 'armL' | 'armR' | 'legL' | 'legR' | 'head';

// --- SPKQ Data Types (Based on PDF JSON Schema) ---

export interface GhostHandConfig {
  hand: 'left' | 'right';
  pose: string; // e.g., "C_hold", "Support"
  targetBone: string; // e.g., "LeftProximalFemur"
}

export interface ManeuverStep {
  id: string;
  label: string;
  animation: string;
  duration: number;
  cameraPreset: 'frontal_near' | 'oblique_left' | 'full_body' | 'lateral_pelvis' | 'lateral_close';
  handGhosts?: GhostHandConfig[];
  showOverlay?: string[];
  notes?: string;
}

export interface Maneuver {
  id: string;
  region: string;
  name: string;
  description: string;
  preconditions: string[];
  steps: ManeuverStep[];
}
