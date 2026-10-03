import React from 'react';
import { Home, Map, Sparkles, Users, Bus, BedDouble, GraduationCap, CalendarDays, BookOpen, Building2, Settings, ArrowUpRight } from 'lucide-react';
export type TabKey = 'home' | 'navigation' | 'ai' | 'faculty' | 'bus' | 'hostel' | 'admissions' | 'events' | 'guide' | 'about' | 'analytics' | 'admin';
export const TAB_LABELS: Record<TabKey, string> = { home: 'Campus overview', navigation: 'Campus map', ai: 'Campus assistant', faculty: 'Faculty directory', bus: 'Transport', hostel: 'Hostel & dining', admissions: 'Admissions', events: 'Campus events', guide: 'Visitor guide', about: 'About the college', analytics: 'Usage insights', admin: 'Administration' };
const groups: { label: string; items: { key: TabKey; icon: React.ElementType }[] }[] = [
{ label: 'EXPLORE', items: [{ key: 'home', icon: Home }, { key: 'navigation', icon: Map }, { key: 'ai', icon: Sparkles }] },
{ label: 'CAMPUS LIFE', items: [{ key: 'faculty', icon: Users }, { key: 'bus', icon: Bus }, { key: 'hostel', icon: BedDouble }, { key: 'events', icon: CalendarDays }] },
{ label: 'INFORMATION', items: [{ key: 'admissions', icon: GraduationCap }, { key: 'guide', icon: BookOpen }, { key: 'about', icon: Building2 }] }
];
export const NavigationSidebar: React.FC<{ activeTab: TabKey; setActiveTab: (tab: TabKey) => void }> = ({ activeTab, setActiveTab }) => <aside className="product-sidebar">
<button className="brand" onClick={() => setActiveTab('home')} aria-label="RMK Campus home"><img src="/assets/rmk_logo.png" alt="RMK crest" /><span><strong>RMK <em>Campus</em></strong><small>YOUR CAMPUS, CONNECTED</small></span></button>
<nav aria-label="Main navigation">{groups.map(group => <div className="nav-group" key={group.label}><p>{group.label}</p>{group.items.map(({ key, icon: Icon }) => <button key={key} onClick={() => setActiveTab(key)} className={`nav-item ${activeTab === key ? 'active' : ''}`} aria-current={activeTab === key ? 'page' : undefined}><Icon size={18} /><span>{TAB_LABELS[key]}</span>{key === 'ai' && <small>AI</small>}</button>)}</div>)}</nav>
<div className="sidebar-bottom"><div className="visitor-note"><span className="status-dot" /><div><strong>Here to help you explore</strong><small>Start your journey at the main gate</small></div></div><button className="nav-item" onClick={() => setActiveTab('admin')}><Settings size={17} /><span>Administration</span><ArrowUpRight size={15} /></button></div></aside>;
