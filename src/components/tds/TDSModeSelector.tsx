import React from 'react';
import { useTranslation } from 'react-i18next';
import { TDSMode } from '../../types';

interface TDSModeSelectorProps {
    onSelect: (mode: TDSMode) => void;
    onCancel: () => void;
}

const TDSModeSelector: React.FC<TDSModeSelectorProps> = ({ onSelect, onCancel }) => {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-brand-800 mb-4">
                    {t('tds.selectMode')}
                </h3>
                <div className="space-y-3">
                    <button
                        onClick={() => onSelect('normal')}
                        className="w-full bg-brand-50 hover:bg-brand-100 border-2 border-brand-200 rounded-xl p-4 text-left transition-colors"
                    >
                        <div className="font-bold text-brand-800">
                            {t('tds.normalMode')}
                        </div>
                        <div className="text-sm text-gray-600">
                            {t('tds.normalDesc')}
                        </div>
                    </button>
                    <button
                        onClick={() => onSelect('expert')}
                        className="w-full bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 rounded-xl p-4 text-left transition-colors"
                    >
                        <div className="font-bold text-amber-800">
                            {t('tds.expertMode')}
                        </div>
                        <div className="text-sm text-gray-600">
                            {t('tds.expertDesc')}
                        </div>
                    </button>
                </div>
                <button
                    onClick={onCancel}
                    className="mt-4 w-full text-gray-500 hover:text-gray-700 py-2"
                >
                    {t('tds.cancel')}
                </button>
            </div>
        </div>
    );
};

export default TDSModeSelector;
