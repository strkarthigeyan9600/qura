import React, { useState } from 'react';
import { TabKey } from './NavigationSidebar';
import { X, Plus, Minus, Home, MapPin, Bot, BookOpen, GraduationCap, Users, Bus, BedDouble, ShieldAlert, Sparkles, PhoneCall } from 'lucide-react';

interface RMKSideMenuDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: TabKey;
    setActiveTab: (tab: TabKey) => void;
}

export const RMKSideMenuDrawer: React.FC<RMKSideMenuDrawerProps> = ({
    isOpen,
    onClose,
    activeTab,
    setActiveTab
}) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        campus: true,
        academics: false,
        administration: false,
        studentServices: false
    });

    if (!isOpen) return null;

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleSelect = (tab: TabKey) => {
        setActiveTab(tab);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end select-none animate-fadeIn">
            {/* Backdrop Overlay */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            />

            {/* Slide-out White Drawer */}
            <div className="relative w-80 max-w-full h-full bg-white text-[#005C4C] shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-slideLeft">
                <div>
                    {/* Header bar matching official RMK website */}
                    <div className="px-6 py-4 bg-[#009677] text-white flex items-center justify-between shadow-md">
                        <span className="font-extrabold text-sm tracking-wider uppercase flex items-center gap-2">
                            <span>MENU</span>
                        </span>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-[#008066] rounded-lg transition-colors flex items-center gap-1 text-xs font-extrabold"
                        >
                            <span>✕</span>
                        </button>
                    </div>

                    {/* Menu Items List */}
                    <div className="py-2 text-xs font-bold divide-y divide-slate-100">
                        {/* HOME */}
                        <button
                            onClick={() => handleSelect('home')}
                            className={`w-full px-6 py-3.5 text-left flex items-center gap-3 transition-colors ${activeTab === 'home' ? 'bg-[#009677] text-white font-extrabold' : 'text-[#005C4C] hover:bg-emerald-50'
                                }`}
                        >
                            <Home className="w-4 h-4" />
                            <span>Home</span>
                        </button>

                        {/* CAMPUS GROUP */}
                        <div>
                            <button
                                onClick={() => toggleSection('campus')}
                                className="w-full px-6 py-3.5 text-left flex items-center justify-between text-[#005C4C] hover:bg-emerald-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-[#009677]" />
                                    <span>Campus</span>
                                </div>
                                {expandedSections.campus ? <Minus className="w-3.5 h-3.5 text-[#009677]" /> : <Plus className="w-3.5 h-3.5 text-[#009677]" />}
                            </button>

                            {expandedSections.campus && (
                                <div className="bg-slate-50 pl-10 pr-6 py-1.5 space-y-1 font-semibold text-slate-700 text-[11px]">
                                    <button onClick={() => handleSelect('navigation')} className="w-full py-2 text-left hover:text-[#009677] flex items-center gap-2">
                                        <span>+ Campus Map</span>
                                    </button>
                                    <button onClick={() => handleSelect('navigation')} className="w-full py-2 text-left hover:text-[#009677] flex items-center gap-2">
                                        <span>+ Buildings & Blocks</span>
                                    </button>
                                    <button onClick={() => handleSelect('navigation')} className="w-full py-2 text-left hover:text-[#009677] flex items-center gap-2">
                                        <span>+ Facilities & Library</span>
                                    </button>
                                    <button onClick={() => handleSelect('hostel')} className="w-full py-2 text-left hover:text-[#009677] flex items-center gap-2">
                                        <span>+ Hostels & Dining</span>
                                    </button>
                                    <button onClick={() => handleSelect('navigation')} className="w-full py-2 text-left hover:text-[#009677] flex items-center gap-2">
                                        <span>+ Sports Complex</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ACADEMICS GROUP */}
                        <div>
                            <button
                                onClick={() => toggleSection('academics')}
                                className="w-full px-6 py-3.5 text-left flex items-center justify-between text-[#005C4C] hover:bg-emerald-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <GraduationCap className="w-4 h-4 text-[#009677]" />
                                    <span>Academics</span>
                                </div>
                                {expandedSections.academics ? <Minus className="w-3.5 h-3.5 text-[#009677]" /> : <Plus className="w-3.5 h-3.5 text-[#009677]" />}
                            </button>

                            {expandedSections.academics && (
                                <div className="bg-slate-50 pl-10 pr-6 py-1.5 space-y-1 font-semibold text-slate-700 text-[11px]">
                                    <button onClick={() => handleSelect('faculty')} className="w-full py-2 text-left hover:text-[#009677] flex items-center gap-2">
                                        <span>+ Departments (CSE, ECE, EEE, IT)</span>
                                    </button>
                                    <button onClick={() => handleSelect('navigation')} className="w-full py-2 text-left hover:text-[#009677] flex items-center gap-2">
                                        <span>+ Laboratories & CoE</span>
                                    </button>
                                    <button onClick={() => handleSelect('navigation')} className="w-full py-2 text-left hover:text-[#009677] flex items-center gap-2">
                                        <span>+ Central Library</span>
                                    </button>
                                    <button onClick={() => handleSelect('navigation')} className="w-full py-2 text-left hover:text-[#009677] flex items-center gap-2">
                                        <span>+ Computer Centre</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ADMINISTRATION GROUP */}
                        <div>
                            <button
                                onClick={() => toggleSection('administration')}
                                className="w-full px-6 py-3.5 text-left flex items-center justify-between text-[#005C4C] hover:bg-emerald-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Users className="w-4 h-4 text-[#009677]" />
                                    <span>Administration</span>
                                </div>
                                {expandedSections.administration ? <Minus className="w-3.5 h-3.5 text-[#009677]" /> : <Plus className="w-3.5 h-3.5 text-[#009677]" />}
                            </button>

                            {expandedSections.administration && (
                                <div className="bg-slate-50 pl-10 pr-6 py-1.5 space-y-1 font-semibold text-slate-700 text-[11px]">
                                    <button onClick={() => handleSelect('faculty')} className="w-full py-2 text-left hover:text-[#009677]">
                                        <span>+ Principal Office</span>
                                    </button>
                                    <button onClick={() => handleSelect('admin')} className="w-full py-2 text-left hover:text-[#009677]">
                                        <span>+ Administration & Placement</span>
                                    </button>
                                    <button onClick={() => handleSelect('admissions')} className="w-full py-2 text-left hover:text-[#009677]">
                                        <span>+ Examination Cell</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* STUDENT SERVICES GROUP */}
                        <div>
                            <button
                                onClick={() => toggleSection('studentServices')}
                                className="w-full px-6 py-3.5 text-left flex items-center justify-between text-[#005C4C] hover:bg-emerald-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Bus className="w-4 h-4 text-[#009677]" />
                                    <span>Student Services</span>
                                </div>
                                {expandedSections.studentServices ? <Minus className="w-3.5 h-3.5 text-[#009677]" /> : <Plus className="w-3.5 h-3.5 text-[#009677]" />}
                            </button>

                            {expandedSections.studentServices && (
                                <div className="bg-slate-50 pl-10 pr-6 py-1.5 space-y-1 font-semibold text-slate-700 text-[11px]">
                                    <button onClick={() => handleSelect('hostel')} className="w-full py-2 text-left hover:text-[#009677]">
                                        <span>+ Hostels & Dining Mess</span>
                                    </button>
                                    <button onClick={() => handleSelect('bus')} className="w-full py-2 text-left hover:text-[#009677]">
                                        <span>+ Campus Bus Transport</span>
                                    </button>
                                    <button onClick={() => handleSelect('guide')} className="w-full py-2 text-left hover:text-[#009677]">
                                        <span>+ Health & Medical Centre</span>
                                    </button>
                                    <button onClick={() => handleSelect('navigation')} className="w-full py-2 text-left hover:text-[#009677]">
                                        <span>+ Gymnasium & Sports</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* AICTE IDEA LAB */}
                        <button
                            onClick={() => handleSelect('navigation')}
                            className="w-full px-6 py-3.5 text-left flex items-center gap-3 text-[#005C4C] hover:bg-emerald-50 transition-colors"
                        >
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>AICTE IDEA Lab</span>
                        </button>

                        {/* AI CONCIERGE */}
                        <button
                            onClick={() => handleSelect('ai')}
                            className={`w-full px-6 py-3.5 text-left flex items-center gap-3 transition-colors ${activeTab === 'ai' ? 'bg-[#009677] text-white font-extrabold' : 'text-[#005C4C] hover:bg-emerald-50'
                                }`}
                        >
                            <Bot className="w-4 h-4" />
                            <span>Ask RMK AI Concierge</span>
                        </button>

                        {/* CONTACT / HELP */}
                        <button
                            onClick={() => handleSelect('guide')}
                            className="w-full px-6 py-3.5 text-left flex items-center gap-3 text-[#005C4C] hover:bg-emerald-50 transition-colors"
                        >
                            <PhoneCall className="w-4 h-4 text-rose-600" />
                            <span>Contact / Help Desk</span>
                        </button>
                    </div>
                </div>

                {/* Footer branding matching RMK website */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500 font-medium space-y-1">
                    <p className="font-extrabold text-[#005C4C]">R.M.K. Engineering College</p>
                    <p className="text-[10px]">RSM Nagar, Kavaraipettai 601206</p>
                    <span className="text-[9px] text-[#009677] font-bold block pt-1">Autonomous Institution</span>
                </div>
            </div>
        </div>
    );
};
