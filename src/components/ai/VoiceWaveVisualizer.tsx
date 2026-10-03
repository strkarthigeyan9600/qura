import React from 'react';
import { useVoice } from '../../context/VoiceContext';

export const VoiceWaveVisualizer: React.FC = () => {
    const { isListening, isSpeaking, audioLevel } = useVoice();

    if (!isListening && !isSpeaking) return null;

    return (
        <div className="flex items-center justify-center gap-1.5 py-3 px-6 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-sky-500/40 shadow-xl animate-fade-in">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider mr-2">
                {isListening ? 'Listening to Kiosk Voice...' : 'AI Speaking...'}
            </span>
            {Array.from({ length: 9 }).map((_, idx) => {
                const height = Math.max(8, Math.min(36, audioLevel * (idx % 2 === 0 ? 40 : 25) + 10));
                return (
                    <div
                        key={idx}
                        className="w-1.5 bg-gradient-to-t from-sky-500 to-emerald-400 rounded-full transition-all duration-100 ease-in-out"
                        style={{ height: `${height}px` }}
                    />
                );
            })}
        </div>
    );
};
