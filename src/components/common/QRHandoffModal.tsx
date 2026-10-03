import React, { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigation } from '../../context/NavigationContext';
import { X, Smartphone, CheckCircle, ArrowRight } from 'lucide-react';

export const QRHandoffModal: React.FC = () => {
    const { isQRModalOpen, setQRModalOpen, activeRoute, selectedBuilding } = useNavigation();
    const panel = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!isQRModalOpen) return;
        const previous = document.activeElement as HTMLElement;
        panel.current?.focus();
        const handler = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setQRModalOpen(false);
            if (event.key === 'Tab') {
                const items = panel.current?.querySelectorAll<HTMLElement>('button,a[href]');
                if (!items?.length) return;
                const first = items[0], last = items[items.length - 1];
                if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        };
        window.addEventListener('keydown', handler);
        return () => { window.removeEventListener('keydown', handler); previous?.focus(); };
    }, [isQRModalOpen, setQRModalOpen]);

    if (!isQRModalOpen) return null;

    const mobilePayloadUrl = activeRoute
        ? `${window.location.origin}/?from=${encodeURIComponent(activeRoute.fromNodeId)}&to=${encodeURIComponent(activeRoute.toNodeId)}`
        : `${window.location.origin}/`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="qr-title" className="relative w-full max-w-md p-6 border rounded-3xl glass-panel bg-slate-900/90 border-slate-700/80 shadow-2xl text-center max-h-[90vh] overflow-y-auto">
                <button
                    aria-label="Close QR code"
                    onClick={() => setQRModalOpen(false)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-full transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex justify-center mb-4">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300">
                        <Smartphone className="w-10 h-10" />
                    </div>
                </div>

                <h3 id="qr-title" className="text-2xl font-bold text-white tracking-tight">Take your route with you</h3>
                <p className="mt-1 text-sm text-slate-300">
                    Scan with your phone camera to take this guided walking navigation with you on the go!
                </p>

                <div className="my-6 p-5 bg-white rounded-2xl flex items-center justify-center shadow-inner mx-auto w-fit">
                    <QRCodeSVG value={mobilePayloadUrl} size={200} level="H" includeMargin={true} />
                </div>
                <p className="text-xs text-slate-400 mb-4">Your phone must be able to access this app’s address. For college-wide access, host it on your college domain.</p>

                {activeRoute && (
                    <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-left text-xs text-slate-300 space-y-1 mb-6">
                        <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            <span>Route Active: {activeRoute.fromBuilding.code} → {activeRoute.toBuilding.code}</span>
                        </div>
                        <p>Open the map on your phone to follow the walking route.</p>
                    </div>
                )}

                <button
                    onClick={() => setQRModalOpen(false)}
                    className="w-full py-3.5 px-6 font-semibold text-white bg-[#009d80] hover:bg-[#007f68] rounded-2xl transition-all shadow-lg  flex items-center justify-center gap-2"
                >
                    <span>Done</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
