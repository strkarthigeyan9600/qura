import React, { useState } from 'react';
import { HOSTELS } from '../../data/mockData';
import { BedDouble, Utensils, Shield, Phone, FileText, CheckCircle2 } from 'lucide-react';

export const HostelModule: React.FC = () => {
    const [selectedHostelId, setSelectedHostelId] = useState(HOSTELS[0].id);

    const activeHostel = HOSTELS.find(h => h.id === selectedHostelId) || HOSTELS[0];

    return (
        <div className="space-y-6 select-none">
            {/* Hostel Selector Tabs */}
            <div className="glass-panel border border-slate-700/80 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <BedDouble className="w-6 h-6 text-emerald-300" />
                        <span>Hostel Accommodation & Dining Mess</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Mess daily menu, warden details, and residential guidelines</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700">
                    {HOSTELS.map(h => (
                        <button
                            key={h.id}
                            onClick={() => setSelectedHostelId(h.id)}
                            aria-pressed={selectedHostelId === h.id}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedHostelId === h.id
                                    ? 'bg-[#009d80] text-white shadow-md '
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            {h.type === 'Boys' ? 'Boys residence' : 'Girls residence'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Hostel Overview Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel border border-slate-700/80 rounded-3xl p-6 space-y-4">
                    <h4 className="text-lg font-bold text-white">{activeHostel.name} Overview</h4>
                    <p className="text-xs text-slate-400">Code: {activeHostel.code} | Capacity: {activeHostel.capacity} Residents</p>

                    <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Hostel Warden</span>
                        <h5 className="text-sm font-bold text-white">{activeHostel.wardenName}</h5>
                        <p className="text-xs text-emerald-300 font-semibold">{activeHostel.wardenContact}</p>
                    </div>

                    <div>
                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Facilities</h5>
                        <div className="space-y-1.5">
                            {activeHostel.facilities.map((fac, fIdx) => (
                                <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>{fac}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mess Daily Schedule */}
                <div className="md:col-span-2 glass-panel border border-slate-700/80 rounded-3xl p-6">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <Utensils className="w-5 h-5 text-amber-400" />
                        <span>Sample weekly dining menu</span>
                    </h4>

                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                        {activeHostel.messSchedule.map((dayMenu, dIdx) => (
                            <div key={dIdx} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider block">
                                    {dayMenu.day}
                                </span>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    <div className="p-2 bg-slate-950/60 rounded-xl">
                                        <span className="text-[10px] text-slate-500 block font-bold">Breakfast</span>
                                        <span className="text-slate-200">{dayMenu.breakfast}</span>
                                    </div>
                                    <div className="p-2 bg-slate-950/60 rounded-xl">
                                        <span className="text-[10px] text-slate-500 block font-bold">Lunch</span>
                                        <span className="text-slate-200">{dayMenu.lunch}</span>
                                    </div>
                                    <div className="p-2 bg-slate-950/60 rounded-xl">
                                        <span className="text-[10px] text-slate-500 block font-bold">Snacks</span>
                                        <span className="text-slate-200">{dayMenu.snacks}</span>
                                    </div>
                                    <div className="p-2 bg-slate-950/60 rounded-xl">
                                        <span className="text-[10px] text-slate-500 block font-bold">Dinner</span>
                                        <span className="text-slate-200">{dayMenu.dinner}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
