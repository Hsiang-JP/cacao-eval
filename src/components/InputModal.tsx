import React, { useState, useEffect } from 'react';
import { PenTool, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title?: string;
    message?: string;
    defaultValue?: string;
    placeholder?: string;
    confirmLabel?: string;
}

const InputModal: React.FC<InputModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    defaultValue = '',
    placeholder = '',
    confirmLabel
}) => {
    const { language } = useLanguage();
    const [value, setValue] = useState(defaultValue);

    // Reset value when modal opens
    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        onConfirm(value);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 flex items-center justify-between bg-cacao-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-cacao-100 text-cacao-600">
                            <PenTool size={20} />
                        </div>
                        <h3 className="font-bold text-lg text-cacao-900">
                            {title || (language === 'es' ? 'Ingresar Dato' : 'Enter Data')}
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
                    {message && <p className="font-medium text-gray-800 mb-4">{message}</p>}

                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cacao-500 focus:bg-white transition-all font-medium"
                            autoFocus
                        />
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        {language === 'es' ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!value.trim()}
                        className="px-6 py-2.5 bg-cacao-600 hover:bg-cacao-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        {confirmLabel || (language === 'es' ? 'Aceptar' : 'OK')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InputModal;
