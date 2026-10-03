import React from 'react';
import { BookOpen, Building, ShieldCheck, HeartHandshake, FileText, Phone } from 'lucide-react';

export const StudentParentGuideModule: React.FC = () => {
    return (
        <div className="space-y-6 select-none">
            <div className="glass-panel border border-slate-700/80 rounded-3xl p-6">
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-emerald-300" />
                    <span>Student & Parent Information Guide</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Key offices, principal cell, accounts, exam branch, and counseling services</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel border border-slate-700/80 rounded-3xl p-6 space-y-3">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <Building className="w-5 h-5 text-emerald-300" />
                        <span>Administrative Offices & Help Desks</span>
                    </h4>
                    <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-300">
                        <h5 className="font-bold text-white">Principal / Director Office</h5>
                        <p>Rajendra Naidu Block • Room RJ-101, 1st Floor. Confirm visiting hours at reception.</p>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-300">
                        <h5 className="font-bold text-white">Accounts & Fee Counter</h5>
                        <p>Rajendra Naidu Block • Ask the reception desk for the current accounts counter.</p>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-300">
                        <h5 className="font-bold text-white">Examination Cell</h5>
                        <p>For hall tickets and transcripts, ask at the administrative reception for the Examination Cell.</p>
                    </div>
                </div>

                <div className="glass-panel border border-slate-700/80 rounded-3xl p-6 space-y-3">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <span>Campus Safety & Parent Visitor Info</span>
                    </h4>
                    <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-300">
                        <h5 className="font-bold text-white">Parent Guest Pass</h5>
                        <p>Parents must present valid government photo ID at Main Gate Security Kiosk.</p>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-300">
                        <h5 className="font-bold text-white">Student Welfare & Counseling</h5>
                        <p>Health Center, Room 104 • Mental health & academic guidance</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
