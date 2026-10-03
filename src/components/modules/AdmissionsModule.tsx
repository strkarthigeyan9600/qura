import React, { useState } from 'react';
import { ADMISSION_COURSES } from '../../data/mockData';
import { GraduationCap, CheckSquare, Award, BookOpen, Layers, Users, Sparkles } from 'lucide-react';

export const AdmissionsModule: React.FC = () => {
    const [selectedCourseId, setSelectedCourseId] = useState(ADMISSION_COURSES[0].id);

    const course = ADMISSION_COURSES.find(c => c.id === selectedCourseId) || ADMISSION_COURSES[0];

    return (
        <div className="space-y-6 select-none font-sans">
            {/* Header */}
            <div className="glass-panel bg-[#03140e]/95 border border-emerald-900/80 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
                <div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-amber-400" />
                        <span>Admissions & Academic Program Guide 2026</span>
                    </h3>
                    <p className="text-xs text-emerald-300/80 mt-0.5 font-medium">
                        Explore degree programs, eligibility criteria, scholarships, and document requirements for R.M.K. Engineering College
                    </p>
                </div>

                {/* Course Selector */}
                <select
                    aria-label="Choose a degree programme"
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                    className="px-4 py-2.5 bg-[#02130c] border border-emerald-800 rounded-2xl text-xs text-white focus:outline-none focus:border-amber-400 font-bold cursor-pointer"
                >
                    {ADMISSION_COURSES.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#03140e] text-slate-200">
                            {c.degree} - {c.branch}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Course Overview & Eligibility */}
                <div className="md:col-span-2 glass-panel bg-[#03140e]/95 border border-emerald-900/80 rounded-3xl p-6 space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-xl text-xs font-black border border-amber-500/40 uppercase tracking-wider">
                            {course.degree} Program
                        </span>
                        <span className="text-xs font-bold text-emerald-300/80">
                            Duration: {course.durationYears} Years | Approved Intake: {course.intakeCapacity} Seats
                        </span>
                    </div>

                    <h4 className="text-2xl font-black text-white">{course.branch}</h4>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        <strong className="text-amber-400 font-extrabold">Eligibility Criteria:</strong> {course.eligibility}
                    </p>

                    {/* Document Checklist */}
                    <div className="pt-4 border-t border-emerald-900/60 space-y-3">
                        <h5 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                            <span>Required Documents Checklist for Admission</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-200 font-medium">
                            <div className="p-3 bg-[#02130c] rounded-xl border border-emerald-900/80 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                                <span>1. 10th & 12th Official Mark Sheets</span>
                            </div>
                            <div className="p-3 bg-[#02130c] rounded-xl border border-emerald-900/80 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                                <span>2. Entrance Exam Rank Card / TNEA Allotment</span>
                            </div>
                            <div className="p-3 bg-[#02130c] rounded-xl border border-emerald-900/80 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                                <span>3. Transfer & Community Certificate</span>
                            </div>
                            <div className="p-3 bg-[#02130c] rounded-xl border border-emerald-900/80 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                                <span>4. Government Photo ID (Aadhaar / Passport)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admission Procedure & Scholarship Overview (No Prices/Fees) */}
                <div className="glass-panel bg-[#03140e]/95 border border-emerald-900/80 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-2xl">
                    <div className="space-y-4">
                        <h4 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-emerald-900/60 pb-3">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            <span>Admission Process</span>
                        </h4>

                        <div className="space-y-2 text-xs">
                            <div className="p-3 bg-[#02130c] rounded-xl border border-emerald-900/80 space-y-1">
                                <span className="font-extrabold text-amber-300 block">Step 1: Counseling Registration</span>
                                <p className="text-[11px] text-slate-300">Apply through TNEA Single Window Counseling or RMK Management Quota.</p>
                            </div>

                            <div className="p-3 bg-[#02130c] rounded-xl border border-emerald-900/80 space-y-1">
                                <span className="font-extrabold text-amber-300 block">Step 2: Certificate Verification</span>
                                <p className="text-[11px] text-slate-300">Submit original certificates at Rajendra Naidu Block (RJ Block).</p>
                            </div>

                            <div className="p-3 bg-[#02130c] rounded-xl border border-emerald-900/80 space-y-1">
                                <span className="font-extrabold text-amber-300 block">Step 3: Hostel & Transport Allotment</span>
                                <p className="text-[11px] text-slate-300">Register for bus routes and hostel room preferences at the desk.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 font-medium">
                        <Award className="w-4 h-4 text-amber-400 mb-1" />
                        <span>Merit Scholarships and First Graduate waivers available. For details, visit Administrative Tower Room RJ-102.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
