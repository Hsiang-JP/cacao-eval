import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';

// Lazy load pages to improve performance and isolation
const EvaluatePage = lazy(() => import('./pages/EvaluatePage'));
const SamplesPage = lazy(() => import('./pages/SamplesPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const ReferencesPage = lazy(() => import('./pages/ReferencesPage'));
const TDSComparisonPage = lazy(() => import('./pages/TDSComparisonPage'));

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-stone-50">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-800 border-t-transparent"></div>
  </div>
);

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/evaluate" replace />} />
            <Route path="/evaluate" element={<EvaluatePage />} />
            <Route path="/samples" element={<SamplesPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/references" element={<ReferencesPage />} />
            <Route path="/tds-test" element={<TDSComparisonPage />} />
          </Routes>
        </Suspense>
      </Router>
    </LanguageProvider>
  );
};

export default App;