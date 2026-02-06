import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ValidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: 'error' | 'warning' | 'info';
}

const ValidationModal: React.FC<ValidationModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'error'
}) => {
    const { language } = useLanguage();

    if (!isOpen) return null;

    // Split message by newlines for list formatting if needed
    const lines = message.split('\n');
    const header = lines[0];
    const items = lines.slice(1);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`p-4 flex items-center justify-between ${type === 'error' ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${type === 'error' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                            <AlertCircle size={24} />
                        </div>
                        <h3 className={`font-bold text-lg ${type === 'error' ? 'text-red-900' : 'text-amber-900'}`}>
                            {title || (language === 'es' ? 'Atención' : 'Attention')}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="font-medium text-gray-800">{header}</p>

                    {items.length > 0 && (
                        <ul className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            {items.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-cacao-500 rounded-full flex-shrink-0" />
                                    <span>{item.replace(/^- /, '')}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        {language === 'es' ? 'Entendido' : 'Got it'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ValidationModal;
