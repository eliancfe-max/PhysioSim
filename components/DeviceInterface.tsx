import React from 'react';
import { DeviceConfig } from '../types';
import { Play, Square, ChevronUp, ChevronDown, Activity } from 'lucide-react';

interface DeviceInterfaceProps {
  config: DeviceConfig;
  setConfig: React.Dispatch<React.SetStateAction<DeviceConfig>>;
  onComplete: () => void;
}

export const DeviceInterface: React.FC<DeviceInterfaceProps> = ({ config, setConfig, onComplete }) => {

  const updateConfig = (key: keyof DeviceConfig, val: any) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  };

  const adjust = (key: 'frequency' | 'time' | 'intensity', delta: number) => {
    setConfig(prev => {
      const newVal = prev[key] + delta;
      if (newVal < 0) return prev;
      return { ...prev, [key]: newVal };
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl border-4 border-gray-700 shadow-2xl w-96 text-white font-mono relative overflow-hidden">
      {/* Screen Reflection */}
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white to-transparent opacity-5 pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-6 border-b border-gray-600 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="text-green-400" />
          <span className="font-bold text-xl tracking-widest text-green-400">PHYSIO-TECH 3000</span>
        </div>
        <div className={`h-3 w-3 rounded-full ${config.running ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-600 shadow-inner">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-400 uppercase">Modo</p>
            <p className="text-xl font-bold text-blue-300">{config.type}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Tiempo</p>
            <p className="text-xl font-bold text-blue-300">{config.time} <span className="text-xs">min</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Frecuencia</p>
            <p className="text-xl font-bold text-blue-300">{config.frequency} <span className="text-xs">Hz</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Intensidad</p>
            <p className="text-3xl font-bold text-yellow-400">{config.intensity} <span className="text-sm">mA</span></p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2 mb-6">
         {/* Freq Control */}
         <div className="flex flex-col items-center">
            <button onClick={() => adjust('frequency', 10)} className="p-1 hover:bg-gray-700 rounded"><ChevronUp /></button>
            <span className="text-xs text-gray-400">FREQ</span>
            <button onClick={() => adjust('frequency', -10)} className="p-1 hover:bg-gray-700 rounded"><ChevronDown /></button>
         </div>
         {/* Time Control */}
         <div className="flex flex-col items-center">
            <button onClick={() => adjust('time', 5)} className="p-1 hover:bg-gray-700 rounded"><ChevronUp /></button>
            <span className="text-xs text-gray-400">TIME</span>
            <button onClick={() => adjust('time', -5)} className="p-1 hover:bg-gray-700 rounded"><ChevronDown /></button>
         </div>
         {/* Intensity Control */}
         <div className="flex flex-col items-center bg-gray-700 rounded">
            <button onClick={() => adjust('intensity', 1)} className="p-1 hover:bg-gray-600 rounded w-full flex justify-center"><ChevronUp /></button>
            <span className="text-xs text-yellow-400 font-bold">INT</span>
            <button onClick={() => adjust('intensity', -1)} className="p-1 hover:bg-gray-600 rounded w-full flex justify-center"><ChevronDown /></button>
         </div>
      </div>

      <div className="flex gap-2 mt-4">
        {!config.running ? (
             <button 
                onClick={() => {
                    updateConfig('running', true);
                    setTimeout(() => onComplete(), 3000); // Simulate 3s treatment for demo
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white p-3 rounded flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:translate-y-1"
            >
                <Play size={18} fill="currentColor" /> INICIAR
            </button>
        ) : (
            <button 
                onClick={() => updateConfig('running', false)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white p-3 rounded flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:translate-y-1"
            >
                <Square size={18} fill="currentColor" /> DETENER
            </button>
        )}
       
      </div>
    </div>
  );
};
