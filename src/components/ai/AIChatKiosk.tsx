import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useVoice } from '../../context/VoiceContext';
import { useNavigation } from '../../context/NavigationContext';
import { RAGEngine } from '../../services/ragEngine';
import { ChatMessage } from '../../types';
import { VoiceWaveVisualizer } from './VoiceWaveVisualizer';
import { Bot, User, Mic, MicOff, Send, Sparkles, Navigation, Bookmark, Volume2, VolumeX, Lightbulb, MapPin } from 'lucide-react';

const QUICK_PROMPTS = [
    "Where is the CSE department?",
    "Take me to the Central Library",
    "Where is the Auditorium?",
    "Find the nearest restroom",
    "Where is the AICTE IDEA Lab?",
    "How do I reach the hostel?",
    "Where is the Computer Centre?",
    "Show me the nearest parking",
    "Where is the Principal's office?"
];

export const AIChatKiosk: React.FC<{ onNavigateToMap?: () => void }> = ({ onNavigateToMap }) => {
    const { currentLanguage, t } = useLanguage();
    const { isListening, isSpeaking, voiceError, startListening, stopListening, speak, stopSpeaking } = useVoice();
    const { setTargetDestination } = useNavigation();

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome-msg',
            sender: 'assistant',
            text: 'Welcome to R.M.K. Engineering College! I am your RMK AI Campus Concierge. Ask me about departments, faculty cabins, Central Library, AICTE IDEA Lab, bus routes, hostel mess menus, or request turn-by-turn walking directions.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: [
                { title: 'RMK Campus Guide', category: 'Campus records', snippet: 'Information from the supplied campus guide. Confirm current details with the college office.' }
            ]
        }
    ]);

    const [inputQuery, setInputQuery] = useState(() => sessionStorage.getItem('campus-prompt') || '');
    const messageBody = useRef<HTMLDivElement>(null);
    const pendingReplies = useRef<ReturnType<typeof setTimeout>[]>([]);
    const voiceCleanup = useRef({ stopListening, stopSpeaking });
    voiceCleanup.current = { stopListening, stopSpeaking };
    useEffect(() => () => {
        pendingReplies.current.forEach(clearTimeout);
        voiceCleanup.current.stopListening();
        voiceCleanup.current.stopSpeaking();
    }, []);
    useEffect(() => {
        messageBody.current?.scrollTo({ top: messageBody.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);
    useEffect(() => { sessionStorage.removeItem('campus-prompt'); }, []);

    const handleSendMessage = (textToSend?: string) => {
        const query = textToSend || inputQuery;
        if (!query.trim()) return;

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: query,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        if (!textToSend) setInputQuery('');

        const reply = setTimeout(() => {
            const aiResponse = RAGEngine.query(query, currentLanguage);
            setMessages(prev => [...prev, aiResponse]);
            speak(aiResponse.text.slice(0, 150));
        }, 300);
        pendingReplies.current.push(reply);
    };

    const handleVoiceToggle = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening(spokenText => {
                handleSendMessage(spokenText);
            });
        }
    };

    const handleTriggerNavigation = (buildingId: string, nodeId?: string) => {
        setTargetDestination(buildingId, nodeId);
        if (onNavigateToMap) onNavigateToMap();
    };

    return (
        <div className="w-full h-[650px] glass-panel bg-[#03140e]/95 border border-emerald-900/80 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden select-none shadow-2xl">
            {/* AI Header */}
            <div className="flex items-center justify-between pb-4 border-b border-emerald-900/60">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-600 to-amber-500 rounded-2xl shadow-lg shadow-emerald-950 text-white">
                        <Bot className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-extrabold text-white tracking-tight">Ask RMK AI Concierge</h3>
                            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/40 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" /> Campus guide
                            </span>
                        </div>
                        <p className="text-xs text-emerald-200/70 font-medium">Smart Voice & Natural Language Campus Assistant • R.M.K. Engineering College</p>
                    </div>
                </div>

                {/* Voice Visualizer Indicator */}
                <div className="flex items-center gap-2">
                    <VoiceWaveVisualizer />
                    {isSpeaking && (
                        <button
                            onClick={stopSpeaking}
                            className="p-2 bg-rose-950/80 text-rose-300 border border-rose-800 rounded-xl hover:bg-rose-900 transition-colors"
                            title="Stop AI Speech"
                        >
                            <VolumeX className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Messages Body */}
            {voiceError && <p role="status" className="text-xs text-amber-200 mt-3">{voiceError}</p>}
            <div ref={messageBody} role="log" aria-label="Campus assistant conversation" aria-live="polite" className="flex-1 overflow-y-auto my-4 pr-2 space-y-4 scrollbar-thin">
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.sender === 'assistant' && (
                            <div className="p-2 bg-emerald-950/80 border border-emerald-800 text-amber-400 rounded-xl shrink-0 mt-1">
                                <Bot className="w-4 h-4" />
                            </div>
                        )}

                        <div className={`max-w-[82%] space-y-2`}>
                            <div
                                className={`p-4 rounded-3xl border shadow-lg text-sm leading-relaxed ${msg.sender === 'user'
                                        ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 text-white border-emerald-500 rounded-br-none'
                                        : 'bg-[#052419]/90 text-slate-100 border-emerald-800/80 rounded-bl-none'
                                    }`}
                            >
                                <p className="whitespace-pre-line font-medium">{msg.text}</p>

                                {/* Grounded Source Citations */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-emerald-900/60 space-y-1.5">
                                        <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                            <Bookmark className="w-3 h-3" /> Grounded Knowledge Sources:
                                        </span>
                                        {msg.sources.map((src, sIdx) => (
                                            <div
                                                key={sIdx}
                                                className="p-2 bg-[#02130c] rounded-xl border border-emerald-900/60 text-xs flex items-center justify-between"
                                            >
                                                <span className="font-bold text-emerald-200">{src.title}</span>
                                                <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-amber-300 rounded border border-emerald-800">
                                                    {src.category}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Interactive Navigation Action Buttons */}
                                {msg.navigationAction && (
                                    <div className="mt-3 pt-2 grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() =>
                                                handleTriggerNavigation(
                                                    msg.navigationAction!.toBuildingId,
                                                    msg.navigationAction!.toNodeId
                                                )
                                            }
                                            className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 border border-emerald-300/30 transition-all active:scale-95"
                                        >
                                            <Navigation className="w-3.5 h-3.5 fill-white" />
                                            <span>{msg.navigationAction.label}</span>
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleTriggerNavigation(
                                                    msg.navigationAction!.toBuildingId
                                                )
                                            }
                                            className="w-full py-2.5 px-3 bg-[#021810] hover:bg-[#063323] text-amber-300 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-amber-500/40 transition-all"
                                        >
                                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                            <span>VIEW ON MAP</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <span className={`text-[10px] text-emerald-400/60 block px-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                {msg.timestamp}
                            </span>
                        </div>

                        {msg.sender === 'user' && (
                            <div className="p-2 bg-emerald-900/60 border border-emerald-700 text-emerald-200 rounded-xl shrink-0 mt-1">
                                <User className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Suggested Question Pills */}
            <div className="py-2.5 overflow-x-auto flex items-center gap-2 border-t border-emerald-900/60 scrollbar-none">
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 shrink-0">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Suggested Questions:</span>
                </div>
                {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="px-3 py-1.5 bg-[#052419] hover:bg-emerald-900/80 text-emerald-200 hover:text-white rounded-xl text-xs font-semibold border border-emerald-800/80 whitespace-nowrap transition-all shadow-sm active:scale-95"
                    >
                        {prompt}
                    </button>
                ))}
            </div>

            {/* Input Control Box */}
            <div className="pt-3 border-t border-emerald-900/60 flex items-center gap-3">
                <button
                    onClick={handleVoiceToggle}
                    className={`p-3.5 rounded-2xl border transition-all ${isListening
                            ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-950'
                            : 'bg-[#052419] text-amber-400 border-emerald-800 hover:bg-emerald-900'
                        }`}
                    title={isListening ? 'Stop Listening' : 'Speak to AI'}
                >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <input
                    aria-label="Ask the campus assistant"
                    type="text"
                    value={inputQuery}
                    onChange={e => setInputQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Search buildings, departments, labs, facilities, hostels, bus routes..."
                    className="flex-1 px-5 py-3.5 bg-[#052419] border border-emerald-800/80 rounded-2xl text-sm text-white placeholder-emerald-400/50 focus:outline-none focus:border-amber-500 transition-colors font-medium"
                />

                <button
                    onClick={() => handleSendMessage()}
                    aria-label="Send question"
                    className="p-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-2xl border border-emerald-400/40 shadow-lg shadow-emerald-950 transition-all active:scale-95"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
