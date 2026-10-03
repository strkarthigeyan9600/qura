import React from 'react';
import { BUS_ROUTES } from '../../data/mockData';
import { Bus, Clock, MapPin, Phone, CheckCircle, Navigation } from 'lucide-react';

export const BusManagementModule: React.FC = () => {
    return (
        <div className="space-y-6 select-none">
            <div className="glass-panel border border-slate-700/80 rounded-3xl p-6">
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Bus className="w-6 h-6 text-amber-400" />
                    <span>Campus Bus Shuttle Service</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Sample route schedules. Confirm current stops and timings with the college transport office.</p>
            </div>

            <div className="space-y-6">
                {BUS_ROUTES.map(bus => (
                    <div key={bus.id} className="glass-panel border border-slate-700/80 rounded-3xl p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-extrabold rounded-xl border border-amber-500/30 text-xs">
                                        {bus.routeNumber}
                                    </span>
                                    <h4 className="text-lg font-bold text-white">{bus.routeName}</h4>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Bus Vehicle #: {bus.busNumber} • Driver Contact: {bus.driverContact}</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <span className="text-xs text-slate-400 block">Campus arrival</span>
                                    <span className="text-lg font-extrabold text-amber-400">{bus.stops[bus.stops.length - 1].time}</span>
                                </div>
                                <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30">
                                    Sample schedule
                                </span>
                            </div>
                        </div>

                        {/* Timeline Stops */}
                        <div className="mt-6">
                            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Route Stops Schedule</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                {bus.stops.map((stop, sIdx) => (
                                    <div
                                        key={sIdx}
                                        className={`p-3 rounded-2xl border flex items-center gap-3 ${stop.isPassed
                                                ? 'bg-slate-900/60 border-slate-800 opacity-60'
                                                : 'bg-slate-900/90 border-sky-500/40 text-sky-200'
                                            }`}
                                    >
                                        <CheckCircle className={`w-4 h-4 shrink-0 ${stop.isPassed ? 'text-slate-500' : 'text-emerald-400'}`} />
                                        <div>
                                            <span className="text-xs font-bold text-white block leading-snug">{stop.name}</span>
                                            <span className="text-[10px] text-slate-400">{stop.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
