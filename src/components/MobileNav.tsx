import React, { useState } from 'react';
import { Menu, X, ArrowUpCircle } from 'lucide-react';
import { FlavorAttribute } from '../types';

interface MobileNavProps {
    attributes: FlavorAttribute[];
    language: 'en' | 'es';
    isEvaluationStarted: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ attributes, language, isEvaluationStarted }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Only show if evaluation is active
    if (!isEvaluationStarted) return null;

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        const mainContent = document.getElementById('main-content');

        if (element) {
            setIsOpen(false); // Close menu immediately

            // Calculate actual header height + some buffer for the secondary sticky header
            const header = document.querySelector('header');
            const headerHeight = header ? header.offsetHeight : 80;
            // category sticky header is top-20 (80px), so we need at least headerHeight + 80
            const headerOffset = headerHeight + 90;

            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            if (mainContent) {
                // "Fade-Jump" Effect to prevent motion sickness
                mainContent.style.transition = 'opacity 0.3s ease-out';
                mainContent.style.opacity = '0';

                setTimeout(() => {
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "auto"
                    });

                    // Fade back in after jump
                    requestAnimationFrame(() => {
                        mainContent.style.opacity = '1';
                        // Cleanup transition
                        setTimeout(() => {
                            mainContent.style.transition = '';
                        }, 200);
                    });
                }, 300); // Wait for fade out
            } else {
                // Fallback if ID is missing
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "auto"
                });
            }
        }
    };

    return (
        <div className="md:hidden fixed bottom-6 right-6 z-40 print:hidden">
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="bg-cacao-600 hover:bg-cacao-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
                aria-label="Navigation Menu"
            >
                <Menu size={24} />
            </button>

            {/* Modal / Sheet */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu Content */}
                    <div className="relative bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-cacao-50">
                            <h3 className="font-bold text-cacao-800">
                                {language === 'es' ? 'Navegación Rápida' : 'Quick Navigation'}
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-2">
                            <div className="grid grid-cols-2 gap-2 pb-safe">
                                {/* Top Button */}
                                <button
                                    onClick={() => scrollToSection('root')}
                                    className="col-span-2 p-3 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-200"
                                >
                                    <ArrowUpCircle size={16} />
                                    {language === 'es' ? 'Ir al inicio' : 'Back to Top'}
                                </button>

                                {attributes.map(attr => (
                                    <button
                                        key={attr.id}
                                        onClick={() => scrollToSection(attr.id)}
                                        className="p-3 text-left rounded-lg hover:bg-cacao-50 border border-transparent hover:border-cacao-100 transition-colors text-sm text-gray-700 font-medium truncate"
                                    >
                                        {language === 'es' ? attr.nameEs : attr.nameEn}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileNav;
