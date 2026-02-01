import { useState } from 'react';
import { TDSMode, TDSProfile, TDSScoreResult, TDSAnalysisResult } from '../types';
import { analyzeTDS } from '../utils/tdsCalculator';
import { getCurrentISODate, getCurrentTime } from '../utils/dateUtils';

interface UseTDSControlProps {
    onApply: (profile: TDSProfile, analysis: TDSAnalysisResult, applyScores?: boolean) => void;
    onStartEvaluation: () => void; // Callback to ensure session is started
}

export const useTDSControl = ({ onApply, onStartEvaluation }: UseTDSControlProps) => {
    const [showTDSModeSelect, setShowTDSModeSelect] = useState(false);
    const [showTDSProfiler, setShowTDSProfiler] = useState(false);
    const [showTDSSummary, setShowTDSSummary] = useState(false);
    const [tdsMode, setTdsMode] = useState<TDSMode>('normal');
    const [tdsProfile, setTdsProfile] = useState<TDSProfile | null>(null);

    const handleStartTDS = () => {
        onStartEvaluation(); // Ensure date/time are set
        setShowTDSModeSelect(true);
    };

    const handleTDSModeSelect = (mode: TDSMode) => {
        setTdsMode(mode);
        setShowTDSModeSelect(false);
        setShowTDSProfiler(true);
    };

    const handleTDSComplete = (profile: TDSProfile) => {
        setTdsProfile(profile);
        setShowTDSProfiler(false);
        setShowTDSSummary(true);
    };

    const handleTDSApply = (scores: Map<string, TDSScoreResult>, analysis: TDSAnalysisResult) => {
        if (tdsProfile) {
            onApply(tdsProfile, analysis, true); // True = Apply Scores
        }
        setShowTDSSummary(false);
    };

    const handleTDSDiscard = () => {
        setTdsProfile(null);
        setShowTDSSummary(false);
    };

    const handleTDSSave = () => {
        // Just save to session without applying scores to attributes
        if (tdsProfile) {
            const analysis = analyzeTDS(tdsProfile);
            onApply(tdsProfile, analysis, false); // False = Save Data Only
        }
        setShowTDSSummary(false);
    };

    return {
        state: {
            showTDSModeSelect,
            showTDSProfiler,
            showTDSSummary,
            tdsMode,
            tdsProfile
        },
        actions: {
            setShowTDSModeSelect,
            setShowTDSProfiler,
            setShowTDSSummary,
            setTdsProfile,
            handleStartTDS,
            handleTDSModeSelect,
            handleTDSComplete,
            handleTDSApply,
            handleTDSDiscard,
            handleTDSSave
        }
    };
};
