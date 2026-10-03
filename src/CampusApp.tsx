import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { VoiceProvider } from './context/VoiceContext';
import { NavigationProvider } from './context/NavigationContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/common/Header';
import { NavigationSidebar, TabKey, TAB_LABELS } from './components/common/NavigationSidebar';
import { AboutModule } from './components/modules/AboutModule';
import { QRHandoffModal } from './components/common/QRHandoffModal';
import { EmergencySOSModal } from './components/modules/EmergencySOSModal';
import { HomeModule } from './components/modules/HomeModule';
import { CampusMap2D } from './components/navigation/CampusMap2D';
import { AIChatKiosk } from './components/ai/AIChatKiosk';
import { FacultyFinderModule } from './components/modules/FacultyFinderModule';
import { BusManagementModule } from './components/modules/BusManagementModule';
import { HostelModule } from './components/modules/HostelModule';
import { AdmissionsModule } from './components/modules/AdmissionsModule';
import { EventsModule } from './components/modules/EventsModule';
import { StudentParentGuideModule } from './components/modules/StudentParentGuideModule';
import { AnalyticsDashboard } from './components/modules/AnalyticsDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';

const AppContent: React.FC = () => {
    const [activeTab, updateActiveTab] = useState<TabKey>(new URLSearchParams(window.location.search).has('to') ? 'navigation' : 'home');
    const [menuOpen, setMenuOpen] = useState(false);
    useEffect(() => {
        if (!menuOpen) return;
        const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [menuOpen]);
    const setActiveTab = (tab: TabKey) => { updateActiveTab(tab); setMenuOpen(false); window.scrollTo(0, 0); };
    const [isEmergencyModalOpen, setEmergencyModalOpen] = useState(false);

    return (
        <div className={`product-app ${menuOpen ? 'menu-open' : ''}`}>
            {/* PHYSICAL KIOSK DISPLAY MONITOR BEZEL FRAME */}
            <div className="product-layout">
                <NavigationSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                {menuOpen && <button className="menu-overlay" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
                <div className="product-workspace">
                {/* Official RMK Kiosk Header */}
                <Header
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onEmergencyClick={() => setEmergencyModalOpen(true)}
                    onMenuClick={() => setMenuOpen(prev => !prev)}
                />

                {/* Main Kiosk Body */}
                <div className="product-body">
                    {/* Left Touch Kiosk Navigation Sidebar */}

                    {/* Main Content View Area */}
                    <main id="main-content" className="product-content">
                        {activeTab !== 'home' && <div className="module-intro"><p className="eyebrow">YOUR CAMPUS COMPANION</p><h1>{TAB_LABELS[activeTab]}</h1><p>Explore the information and services that make your campus visit easier.</p></div>}
                        {activeTab === 'about' && <AboutModule onSelectTab={setActiveTab} />}
                        {activeTab === 'home' && <HomeModule onSelectTab={setActiveTab} />}

                        {activeTab === 'navigation' && (
                            <div className="space-y-6 max-w-7xl mx-auto">
                                <CampusMap2D />
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="max-w-6xl mx-auto">
                                <AIChatKiosk onNavigateToMap={() => setActiveTab('navigation')} />
                            </div>
                        )}

                        {activeTab === 'faculty' && (
                            <div className="max-w-6xl mx-auto">
                                <FacultyFinderModule onNavigateToMap={() => setActiveTab('navigation')} />
                            </div>
                        )}

                        {activeTab === 'bus' && (
                            <div className="max-w-6xl mx-auto">
                                <BusManagementModule />
                            </div>
                        )}

                        {activeTab === 'hostel' && (
                            <div className="max-w-6xl mx-auto">
                                <HostelModule />
                            </div>
                        )}

                        {activeTab === 'admissions' && (
                            <div className="max-w-6xl mx-auto">
                                <AdmissionsModule />
                            </div>
                        )}

                        {activeTab === 'events' && (
                            <div className="max-w-6xl mx-auto">
                                <EventsModule onNavigateToMap={() => setActiveTab('navigation')} />
                            </div>
                        )}

                        {activeTab === 'guide' && (
                            <div className="max-w-6xl mx-auto">
                                <StudentParentGuideModule />
                            </div>
                        )}

                        {activeTab === 'analytics' && (
                            <div className="max-w-6xl mx-auto">
                                <AnalyticsDashboard />
                            </div>
                        )}

                        {activeTab === 'admin' && (
                            <div className="max-w-6xl mx-auto">
                                <AdminDashboard />
                            </div>
                        )}
                    </main>
                </div>
                </div>

                {/* Global Modals */}
                <QRHandoffModal />
                <EmergencySOSModal
                    isOpen={isEmergencyModalOpen}
                    onClose={() => setEmergencyModalOpen(false)}
                    onNavigateToMap={() => setActiveTab('navigation')}
                />
            </div>
        </div>
    );
};

export const App: React.FC = () => {
    return (
        <LanguageProvider>
            <VoiceProvider>
                <NavigationProvider>
                    <AuthProvider>
                        <AppContent />
                    </AuthProvider>
                </NavigationProvider>
            </VoiceProvider>
        </LanguageProvider>
    );
};

export default App;
