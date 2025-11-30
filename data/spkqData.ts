import { Maneuver } from "../types";

export const THOMAS_MANEUVER: Maneuver = {
  id: "thomas_v1",
  region: "Cadera",
  name: "Maniobra de Thomas",
  description: "Evaluar actitud real de cadera: paciente en decúbito supino. Examinador flexiona pasivamente muslo y rodilla contralateral.",
  preconditions: ["patient_on_couch", "supine_position"],
  steps: [
    {
      id: "p0",
      label: "Posición inicial",
      animation: "Thomas_Paso0_PosicionNeutra",
      duration: 1.0,
      cameraPreset: "frontal_near",
      showOverlay: ["pelvis", "femur_axis"]
    },
    {
      id: "p1",
      label: "Flexionar muslo y rodilla contralateral",
      animation: "Thomas_Paso1_FlexionarContralateral",
      duration: 2.5,
      cameraPreset: "oblique_left",
      handGhosts: [
        { hand: "left", pose: "C_hold", targetBone: "mixamorigLeftUpLeg" }, // Holds the flexed leg
        { hand: "right", pose: "LumbarSupport", targetBone: "mixamorigSpine" } // Checks lumbar
      ],
      showOverlay: ["lumbar_lordosis"],
      notes: "Flexionar hasta sentir el borramiento de la lordosis lumbar con la mano derecha."
    },
    {
      id: "p2",
      label: "Observar actitud de la cadera evaluada",
      animation: "Thomas_Paso2_ObservarAngulo",
      duration: 2.0,
      cameraPreset: "frontal_near",
      showOverlay: ["angle_femur_to_couch", "abd_add_rot_markers"],
      notes: "Si el muslo opuesto se levanta, sugiere acortamiento del Psoas Ilíaco."
    }
  ]
};

export const TRENDELENBURG_TEST: Maneuver = {
  id: "trendelenburg_v1",
  region: "Pelvis",
  name: "Test de Trendelenburg",
  description: "Evaluar acción de glúteo medio: se solicita apoyo monopodal. Caída de hemipelvis opuesta indica insuficiencia.",
  preconditions: ["patient_standing", "able_to_stand"],
  steps: [
    {
      id: "t0",
      label: "Posición inicial: paciente de pie",
      animation: "Trendelenburg_Paso0_PosicionNeutra",
      duration: 1.0,
      cameraPreset: "full_body",
      showOverlay: ["pelvis"]
    },
    {
      id: "t1",
      label: "Solicitar apoyo monopodal (lado derecho)",
      animation: "Trendelenburg_Paso1_ApoyoUnipodal",
      duration: 3.0,
      cameraPreset: "lateral_pelvis",
      handGhosts: [
        // Stabilizing hand on shoulder/hip if needed, or visual guide
        { hand: "left", pose: "Support", targetBone: "mixamorigLeftShoulder" } 
      ],
      showOverlay: ["hemipelvis_levels"],
      notes: "El paciente levanta el pie izquierdo. El glúteo medio derecho debe estabilizar la pelvis."
    },
    {
      id: "t2",
      label: "Observar caída de hemipelvis opuesta",
      animation: "Trendelenburg_Paso2_Observacion",
      duration: 2.0,
      cameraPreset: "lateral_close",
      showOverlay: ["pelvis_level_indicator"],
      notes: "Signo Positivo: La hemipelvis izquierda cae (baja) en lugar de elevarse o mantenerse."
    }
  ]
};

export const MANEUVERS_REGISTRY = [THOMAS_MANEUVER, TRENDELENBURG_TEST];