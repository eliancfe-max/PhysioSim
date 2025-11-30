import React, { useState } from 'react';
import { Play, SkipBack, SkipForward, Info, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Maneuver, ManeuverStep } from '../types';
import { MANEUVERS_REGISTRY } from '../data/spkqData';

interface SPKQInterfaceProps {
  onExit: () => void;
  onStepChange: (step: ManeuverStep | null) => void;
  onManeuverStart: (maneuver: Maneuver) => void;
}

export const SPKQInterface: React.FC<SPKQInterfaceProps> = ({ onExit, onStepChange, onManeuverStart }) => {
  const [activeManeuver, setActiveManeuver] = useState<Maneuver | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);

  const startManeuver = (maneuver: Maneuver) => {
    setActiveManeuver(maneuver);
    setCurrentStepIndex(0);
    onManeuverStart(maneuver);
    onStepChange(maneuver.steps[0]);
  };

  const nextStep = () => {
    if (!activeManeuver) return;
    if (currentStepIndex < activeManeuver.steps.length - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      onStepChange(activeManeuver.steps[newIndex]);
    }
  };

  const prevStep = () => {
    if (!activeManeuver) return;
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      setCurrentStepIndex(newIndex);
      onStepChange(activeManeuver.steps[newIndex]);
    }
  };

  const stopManeuver = () => {
    setActiveManeuver(null);
    setCurrentStepIndex(-1);
    onStepChange(null);
  };

  // --- MENU SELECTION VIEW ---
  if (!activeManeuver) {
    return (
      <div className="absolute top-0 right-0 h-full w-80 bg-slate-900/95 text-white p-6 shadow-2xl backdrop-blur-md overflow-y-auto border-l border-slate-700 animate-in slide-in-from-right">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-blue-400">Modo SPKQ</h2>
          <button onClick={onExit} className="text-xs bg-red-900/50 hover:bg-red-900 px-3 py-1 rounded text-red-200 border border-red-800">
            Salir
          </button>
        </div>
        
        <p className="text-sm text-gray-400 mb-6">
          Semiopatología Kinésica Quirúrgica. Seleccione una maniobra.
        </p>

        <div className="space-y-4">
          {MANEUVERS_REGISTRY.map((m) => (
            <div key={m.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{m.region}</span>
                <span className="text-[10px] bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded">Auto</span>
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-blue-300">{m.name}</h3>
              <p className="text-xs text-gray-400 mb-4 line-clamp-3">{m.description}</p>
              <button 
                onClick={() => startManeuver(m)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium flex items-center justify-center gap-2"
              >
                <Play size={16} /> Iniciar
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- ACTIVE MANEUVER VIEW (Compact) ---
  const currentStep = activeManeuver.steps[currentStepIndex];

  return (
    // Width reduced to 420px for better visibility
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[420px] bg-slate-900/90 text-white rounded-2xl shadow-2xl backdrop-blur-xl border border-slate-700 overflow-hidden animate-in slide-in-from-bottom z-50">
      
      {/* Header */}
      <div className="bg-slate-800 p-3 flex justify-between items-center border-b border-slate-700">
        <button onClick={stopManeuver} className="text-gray-400 hover:text-white flex items-center gap-1 text-xs">
           <ArrowLeft size={14}/> Volver
        </button>
        <h3 className="font-bold text-sm text-blue-400 truncate max-w-[150px]">{activeManeuver.name}</h3>
        <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded">
            {currentStepIndex + 1} / {activeManeuver.steps.length}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
          <h4 className="text-base font-bold mb-2 leading-tight">{currentStep.label}</h4>
          
          {/* Visual Indicators Badge */}
          <div className="flex flex-wrap gap-1 mb-3">
              {currentStep.showOverlay?.map(ov => (
                  <span key={ov} className="text-[9px] uppercase bg-purple-900/50 text-purple-200 px-1.5 py-0.5 rounded border border-purple-700/50">
                      👁 {ov}
                  </span>
              ))}
              {currentStep.handGhosts?.map((hg, i) => (
                  <span key={i} className="text-[9px] uppercase bg-cyan-900/50 text-cyan-200 px-1.5 py-0.5 rounded border border-cyan-700/50">
                      ✋ {hg.hand}
                  </span>
              ))}
          </div>

          {/* Clinical Notes */}
          {currentStep.notes && (
              <div className="bg-blue-900/20 border-l-2 border-blue-500 p-2 mb-3 rounded-r">
                  <div className="flex gap-2 items-start">
                      <Info size={14} className="text-blue-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-300 italic leading-snug">{currentStep.notes}</p>
                  </div>
              </div>
          )}

          {/* Controls */}
          <div className="flex justify-between items-center mt-2">
              <button 
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="p-2 rounded-full hover:bg-slate-700 disabled:opacity-30 transition-colors"
              >
                  <SkipBack size={20} />
              </button>

              <div className="h-1 bg-slate-700 flex-1 mx-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${((currentStepIndex + 1) / activeManeuver.steps.length) * 100}%` }}
                  ></div>
              </div>

              <button 
                 onClick={nextStep}
                 disabled={currentStepIndex === activeManeuver.steps.length - 1}
                 className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
              >
                  <SkipForward size={20} />
              </button>
          </div>
      </div>
    </div>
  );
};