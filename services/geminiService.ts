import { GoogleGenAI, Type } from "@google/genai";
import { Patient } from "../types";

// Initialize Gemini Client
// NOTE: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePatientScenario = async (): Promise<Patient> => {
  const modelId = "gemini-2.5-flash";
  
  const systemInstruction = `
    Actúa como un instructor senior de fisioterapia clínica.
    Tu objetivo es generar un escenario clínico breve y realista para un estudiante.
    El paciente debe tener una patología musculoesquelética común tratable con electroterapia (TENS, EMS, Interferenciales).
    
    Devuelve SOLO un objeto JSON válido sin bloques de código markdown.
    Asegúrate de que 'targetZone' sea uno de estos valores exactos: 'back', 'shoulder_left', 'shoulder_right', 'knee_left', 'knee_right'.
    El idioma debe ser Español.
  `;

  const prompt = "Genera un nuevo paciente aleatorio para simulación.";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            age: { type: Type.INTEGER },
            profession: { type: Type.STRING },
            complaint: { type: Type.STRING, description: "Motivo de consulta breve" },
            history: { type: Type.STRING, description: "Historia clínica breve (1-2 frases)" },
            targetZone: { type: Type.STRING, enum: ['back', 'shoulder_left', 'shoulder_right', 'knee_left', 'knee_right'] },
            recommendedTreatment: {
              type: Type.OBJECT,
              properties: {
                deviceType: { type: Type.STRING, enum: ['TENS', 'EMS', 'IFC'] },
                frequency: { type: Type.INTEGER, description: "Frecuencia ideal en Hz" },
                duration: { type: Type.INTEGER, description: "Duración en minutos" },
                intensityRange: { 
                  type: Type.ARRAY, 
                  items: { type: Type.INTEGER },
                  description: "Rango min y max de intensidad [min, max]"
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) {
        throw new Error("No text response from Gemini");
    }

    const data = JSON.parse(response.text) as Patient;
    return data;

  } catch (error) {
    console.error("Error generating patient:", error);
    // Fallback patient if API fails
    return {
      name: "Juan Pérez (Fallback)",
      age: 45,
      profession: "Obrero",
      complaint: "Dolor lumbar crónico",
      history: "Carga pesos elevados diariamente. Dolor presente desde hace 3 meses.",
      targetZone: "back",
      recommendedTreatment: {
        deviceType: "TENS",
        frequency: 80,
        duration: 20,
        intensityRange: [15, 30]
      }
    };
  }
};
