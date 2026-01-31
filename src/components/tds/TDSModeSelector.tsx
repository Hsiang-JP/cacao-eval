import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { TDSMode } from '../../types';

interface TDSModeSelectorProps {
    onSelect: (mode: TDSMode) => void;
    onCancel: () => void;
}

const TDSModeSelector: React.FC<TDSModeSelectorProps> = ({ onSelect, onCancel }) => {
    const { language } = useLanguage();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-cacao-800 mb-4">
                    {language === 'es' ? 'Seleccionar Modo TDS' : 'Select TDS Mode'}
                </h3>
                <div className="space-y-3">
                    <button
                        onClick={() => onSelect('normal')}
                        className="w-full bg-cacao-50 hover:bg-cacao-100 border-2 border-cacao-200 rounded-xl p-4 text-left transition-colors"
                    >
                        <div className="font-bold text-cacao-800">
                            {language === 'es' ? 'Normal (5 atributos)' : 'Normal (5 attributes)'}
                        </div>
                        <div className="text-sm text-gray-600">
                            {language === 'es' ? 'Cacao, Acidez, Amargo, Astringencia, Tostado' : 'Cacao, Acidity, Bitter, Astringency, Roast'}
                        </div>
                    </button>
                    <button
                        onClick={() => onSelect('expert')}
                        className="w-full bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 rounded-xl p-4 text-left transition-colors"
                    >
                        <div className="font-bold text-amber-800">
                            {language === 'es' ? 'Experto (15 atributos)' : 'Expert (15 attributes)'}
                        </div>
                        <div className="text-sm text-gray-600">
                            {language === 'es' ? 'Todos los atributos de sabor' : 'All flavor attributes'}
                        </div>
                    </button>
                </div>
                <button
                    onClick={onCancel}
                    className="mt-4 w-full text-gray-500 hover:text-gray-700 py-2"
                >
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
            </div>
        </div>
    );
};

export default TDSModeSelector;
