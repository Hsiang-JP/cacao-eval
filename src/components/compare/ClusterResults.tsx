import React, { useState, useRef, useEffect } from 'react';
import { ClusterResult } from '../../services/analysisService';
import { StoredSample } from '../../services/dbService';
import { Layers, Users, Star, X } from 'lucide-react';
import FlavorRadar from '../FlavorRadar';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';

interface ClusterResultsProps {
    clusters: ClusterResult[];
    sessions: StoredSample[];
    onSampleClick?: (sampleId: string) => void;
}

export const ClusterResults: React.FC<ClusterResultsProps> = ({ clusters, sessions, onSampleClick }) => {
    const { language } = useLanguage();
    // Helper for inline translations
    const t = (en: string, es: string) => language === 'es' ? es : en;
    const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const activeItemRef = useRef<HTMLDivElement | null>(null);

    // Detect touch device
    useEffect(() => {
        setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);

    // Update tooltip position when active sample changes
    useEffect(() => {
        if (activeSampleId && activeItemRef.current) {
            const rect = activeItemRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const tooltipWidth = Math.min(384, viewportWidth - 32); // 384px max, 16px margin each side

            let x = rect.left + rect.width / 2 - tooltipWidth / 2;
            // Clamp to viewport
            x = Math.max(16, Math.min(x, viewportWidth - tooltipWidth - 16));

            // Position above the element
            const y = rect.top - 8;

            setTooltipPosition({ x, y });
        } else {
            setTooltipPosition(null);
        }
    }, [activeSampleId]);

    // Close tooltip on scroll or outside click for touch devices
    useEffect(() => {
        if (!activeSampleId) return;

        const handleClose = () => setActiveSampleId(null);

        window.addEventListener('scroll', handleClose, true);

        return () => {
            window.removeEventListener('scroll', handleClose, true);
        };
    }, [activeSampleId]);

    const handleSampleInteraction = (sampleId: string, element: HTMLDivElement | null) => {
        if (isTouchDevice) {
            // Toggle on tap
            if (activeSampleId === sampleId) {
                setActiveSampleId(null);
            } else {
                activeItemRef.current = element;
                setActiveSampleId(sampleId);
            }
        }
    };

    const handleMouseEnter = (sampleId: string, element: HTMLDivElement | null) => {
        if (!isTouchDevice) {
            activeItemRef.current = element;
            setActiveSampleId(sampleId);
        }
    };

    const handleMouseLeave = () => {
        if (!isTouchDevice) {
            setActiveSampleId(null);
        }
    };

    if (!clusters || clusters.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <Layers size={48} className="mx-auto mb-4 opacity-20" />
                <p>{t("No clusters found. Try selecting more samples.", "No se encontraron grupos. Intente seleccionar más muestras.")}</p>
            </div>
        );
    }

    const activeSession = activeSampleId ? sessions.find(s => s.id === activeSampleId) : null;

    return (
        <div className="space-y-6">
            {clusters.map((cluster) => (
                <div key={cluster.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
                    {/* Header */}
                    <div className="bg-cacao-50/50 p-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-cacao-900 text-lg flex items-center gap-2">
                                <span className="bg-cacao-100 text-cacao-800 text-xs px-2 py-1 rounded-full">#{cluster.id}</span>
                                {cluster.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {cluster.dominantTraits.length > 0 ? `${t("Characterized by", "Caracterizado por")}: ${cluster.dominantTraits.join(', ')}` : t('Mixed Profile', 'Perfil Mixto')}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-cacao-700 font-bold">
                                <Star size={16} className="fill-cacao-500 text-cacao-500" />
                                {cluster.avgQuality}
                            </div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">{t("Avg Quality", "Calidad Prom.")}</span>
                        </div>
                    </div>

                    {/* Body: Sample List */}
                    <div className="p-4">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                            <Users size={14} />
                            <span>{cluster.sampleCodes.length} {t("Samples in this group", "Muestras en este grupo")}</span>
                            {isTouchDevice && (
                                <span className="text-cacao-500 ml-2">({t("Tap to view", "Toque para ver")})</span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {cluster.sampleCodes.map((code, idx) => {
                                const sampleId = cluster.sampleIds[idx];
                                const isActive = activeSampleId === sampleId;

                                return (
                                    <div
                                        key={sampleId}
                                        ref={isActive ? activeItemRef : null}
                                        onClick={(e) => {
                                            if (isTouchDevice) {
                                                e.stopPropagation();
                                                handleSampleInteraction(sampleId, e.currentTarget);
                                            } else if (onSampleClick) {
                                                onSampleClick(sampleId);
                                            }
                                        }}
                                        onMouseEnter={(e) => handleMouseEnter(sampleId, e.currentTarget)}
                                        onMouseLeave={handleMouseLeave}
                                        className="relative"
                                    >
                                        <div className={`bg-gray-50 hover:bg-cacao-50 text-gray-700 hover:text-cacao-900 text-sm py-2 px-3 rounded border cursor-pointer transition-colors text-center truncate ${isActive ? 'bg-cacao-100 border-cacao-300 ring-2 ring-cacao-200' : 'border-gray-100'
                                            }`}>
                                            {code}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ))}

            {/* Floating Tooltip Portal - Renders outside container to avoid clipping */}
            {activeSampleId && activeSession && tooltipPosition && createPortal(
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        left: tooltipPosition.x,
                        top: tooltipPosition.y,
                        transform: 'translateY(-100%)'
                    }}
                >
                    <div className={`w-[384px] max-w-[calc(100vw-32px)] bg-white rounded-lg shadow-xl border border-gray-200 p-4 text-left ${isTouchDevice ? 'pointer-events-auto' : ''}`}>
                        <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                            <div className="flex-1 min-w-0 mr-3">
                                <span className="font-bold text-cacao-900 text-base block mb-0.5">{activeSession.sampleCode}</span>
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                        <Users size={14} className="text-cacao-500" />
                                        <span className="font-medium truncate">{activeSession.evaluator}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 ml-5">
                                        {new Date(activeSession.date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="bg-cacao-100 text-cacao-800 text-sm px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
                                    Q: {activeSession.globalQuality}
                                </span>
                                {isTouchDevice && (
                                    <button
                                        onClick={() => setActiveSampleId(null)}
                                        className="p-1 text-gray-400 hover:text-gray-600 pointer-events-auto"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Mini Radar Chart */}
                        <div className="w-full h-[250px] relative">
                            <FlavorRadar
                                attributes={activeSession.attributes}
                                height="100%"
                                hideTitle
                                className="border-0 shadow-none"
                            />
                        </div>

                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-white"></div>
                    </div>
                </div>,
                document.body
            )}

            {/* Backdrop for touch devices to close tooltip */}
            {isTouchDevice && activeSampleId && createPortal(
                <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setActiveSampleId(null)}
                />,
                document.body
            )}
        </div>
    );
};
