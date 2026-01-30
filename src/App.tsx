import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EvaluatePage from './pages/EvaluatePage';
import SamplesPage from './pages/SamplesPage';
import ComparePage from './pages/ComparePage';
import ReferencesPage from './pages/ReferencesPage';
import { LanguageProvider } from './context/LanguageContext';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/evaluate" replace />} />
          <Route path="/evaluate" element={<EvaluatePage />} />
          <Route path="/samples" element={<SamplesPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/references" element={<ReferencesPage />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
};

export default App;