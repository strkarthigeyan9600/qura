import React from 'react';
import { ANALYTICS_DATA } from '../../data/mockData';
import { BarChart3, TrendingUp, Users, Mic, Clock, Globe, Award } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
    return (
        <div className="space-y-6 select-none">
            {/* Header */}
            <div className="glass-panel border border-slate-700/80 rounded-3xl p-6">
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-sky-400" />
                    <span>Real-time Kiosk Analytics & Visitor Insights</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Live kiosk usage statistics, top searched destinations, and language breakdown</p>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 glass-panel border border-slate-700/80 rounded-2xl">
                    <div className="flex items-center justify-between text-sky-400 mb-2">
                        <Users className="w-5 h-5" />
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full">+14% Today</span>
                    </div>
                    <span className="text-2xl font-extrabold text-white">{ANALYTICS_DATA.totalVisitorsToday.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Total Kiosk Visitors</span>
                </div>

                <div className="p-5 glass-panel border border-slate-700/80 rounded-2xl">
                    <div className="flex items-center justify-between text-amber-400 mb-2">
                        <Clock className="w-5 h-5" />
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full">Avg Session</span>
                    </div>
                    <span className="text-2xl font-extrabold text-white">{ANALYTICS_DATA.avgSessionDurationSeconds}s</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Interaction Time</span>
                </div>

                <div className="p-5 glass-panel border border-slate-700/80 rounded-2xl">
                    <div className="flex items-center justify-between text-purple-400 mb-2">
                        <Mic className="w-5 h-5" />
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">STT Active</span>
                    </div>
                    <span className="text-2xl font-extrabold text-white">{ANALYTICS_DATA.activeVoiceQueries}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Voice Queries</span>
                </div>

                <div className="p-5 glass-panel border border-slate-700/80 rounded-2xl">
                    <div className="flex items-center justify-between text-emerald-400 mb-2">
                        <Globe className="w-5 h-5" />
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded-full">10 Languages</span>
                    </div>
                    <span className="text-2xl font-extrabold text-white">62% EN / 24% HI</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Language Spread</span>
                </div>
            </div>

            {/* Visual Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Most Searched Buildings Heatmap */}
                <div className="glass-panel border border-slate-700/80 rounded-3xl p-6">
                    <h4 className="text-base font-bold text-white mb-4">Most Searched Destinations</h4>
                    <div className="space-y-3">
                        {ANALYTICS_DATA.topSearchedBuildings.map((bldg: { name: string; count: number }, idx: number) => {
                            const max = ANALYTICS_DATA.topSearchedBuildings[0].count;
                            const pct = (bldg.count / max) * 100;
                            return (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-300">
                                        <span className="font-semibold">{bldg.name}</span>
                                        <span className="font-bold text-sky-400">{bldg.count} searches</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top FAQ Search Breakdown */}
                <div className="glass-panel border border-slate-700/80 rounded-3xl p-6">
                    <h4 className="text-base font-bold text-white mb-4">Frequent Natural Language FAQs</h4>
                    <div className="space-y-3">
                        {ANALYTICS_DATA.frequentFaqs.map((faq: { question: string; count: number }, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-200">"{faq.question}"</span>
                                <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 font-bold rounded-lg shrink-0">
                                    {faq.count} queries
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
