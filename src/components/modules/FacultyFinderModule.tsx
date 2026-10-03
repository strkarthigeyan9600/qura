import React, { useState } from 'react';
import { FACULTY_MEMBERS } from '../../data/mockData';
import { useNavigation } from '../../context/NavigationContext';
import { Faculty } from '../../types';
import { Search, MapPin, Mail, Phone, Clock, GraduationCap, Navigation } from 'lucide-react';
import { TabKey } from '../common/NavigationSidebar';

export const FacultyFinderModule: React.FC<{ onNavigateToMap: () => void }> = ({ onNavigateToMap }) => {
    const { setTargetDestination } = useNavigation();
    const [search, setSearch] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');

    const departments = ['All', ...Array.from(new Set(FACULTY_MEMBERS.map(f => f.department)))];

    const filteredFaculty = FACULTY_MEMBERS.filter((fac: Faculty) => {
        const matchesDept = selectedDept === 'All' || fac.department === selectedDept;
        const matchesSearch =
            fac.name.toLowerCase().includes(search.toLowerCase()) ||
            fac.researchArea.toLowerCase().includes(search.toLowerCase()) ||
            fac.cabinNumber.toLowerCase().includes(search.toLowerCase());
        return matchesDept && matchesSearch;
    });

    const handleNavigateToFaculty = (fac: Faculty) => {
        setTargetDestination(fac.buildingId);
        onNavigateToMap();
    };

    return (
        <div className="space-y-6 select-none">
            {/* Search & Filter Header */}
            <div className="glass-panel border border-slate-700/80 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-emerald-300" />
                        <span>Faculty & Department Directory</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Find professor cabins, office hours, and research specializations</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Department Filter */}
                    <select
                        aria-label="Filter by department"
                        value={selectedDept}
                        onChange={e => setSelectedDept(e.target.value)}
                        className="px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                        {departments.map(d => (
                            <option key={d} value={d} className="bg-slate-900 text-slate-200">
                                {d}
                            </option>
                        ))}
                    </select>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            aria-label="Search faculty"
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search faculty name, cabin, area..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>
            </div>

            {/* Faculty Cards Grid */}
            {filteredFaculty.length === 0 && <p role="status" className="glass-panel p-6 rounded-xl text-sm text-slate-400">No faculty match your search. Try another name or select All departments.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredFaculty.map((fac: Faculty) => (
                    <div
                        key={fac.id}
                        className="glass-panel border border-slate-700/80 rounded-3xl p-6 flex flex-col justify-between glass-card-hover"
                    >
                        <div>
                            <div className="flex items-start gap-4">
                                <div aria-hidden="true" className="w-16 h-16 rounded-2xl bg-emerald-900/50 border border-emerald-800 flex items-center justify-center text-xl text-emerald-200 shrink-0">{fac.name.replace(/^Dr\.\s*/, '').split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('')}</div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">{fac.name}</h4>
                                    <span className="text-xs font-semibold text-emerald-300 block">{fac.title} • {fac.designation}</span>
                                    <span className="text-xs text-slate-400">{fac.department}</span>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2 text-xs text-slate-300">
                                <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                                    <MapPin className="w-4 h-4 text-emerald-300 shrink-0" />
                                    <span>
                                        <strong>Cabin:</strong> {fac.cabinNumber} ({fac.buildingName})
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                                    <Clock className="w-4 h-4 text-emerald-300 shrink-0" />
                                    <span>
                                        <strong>Office Hours:</strong> {fac.officeHours}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                                    <Mail className="w-4 h-4 text-emerald-300 shrink-0" />
                                    <span>{fac.email}</span>
                                </div>
                            </div>

                            <p className="mt-3 text-xs text-slate-400 italic">
                                Research: {fac.researchArea}
                            </p>
                        </div>

                        <button
                            onClick={() => handleNavigateToFaculty(fac)}
                            className="mt-6 w-full py-3 bg-[#009d80] hover:bg-[#007f68] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                        >
                            <Navigation className="w-4 h-4" />
                            <span>Navigate to Cabin</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
