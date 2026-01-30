import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EvaluatePage from './pages/EvaluatePage';
import SamplesPage from './pages/SamplesPage';
import ComparePage from './pages/ComparePage';

const App: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/evaluate" replace />} />
        <Route
          path="/evaluate"
          element={
            <EvaluatePage
              language={language}
              onLanguageChange={setLanguage}
            />
          }
        />
        <Route
          path="/samples"
          element={
            <SamplesPage
              language={language}
              onLanguageChange={setLanguage}
            />
          }
        />
        <Route
          path="/compare"
          element={
            <ComparePage
              language={language}
              onLanguageChange={setLanguage}
            />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;