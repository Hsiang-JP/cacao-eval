import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDangerous?: boolean; // For red buttons (e.g. Delete)
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel,
    cancelLabel,
    isDangerous = false
}) => {
    const { language } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 flex items-center justify-between bg-cacao-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-cacao-100 text-cacao-600">
                            <HelpCircle size={24} />
                        </div>
                        <h3 className="font-bold text-lg text-cacao-900">
                            {title || (language === 'es' ? 'Confirmar' : 'Confirm')}
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
                <div className="p-6">
                    <p className="font-medium text-gray-800 whitespace-pre-wrap">{message}</p>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        {cancelLabel || (language === 'es' ? 'Cancelar' : 'Cancel')}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-6 py-2.5 font-bold rounded-xl text-white transition-colors shadow-sm ${isDangerous
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-cacao-600 hover:bg-cacao-700'
                            }`}
                    >
                        {confirmLabel || (language === 'es' ? 'Confirmar' : 'Confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
