import { BrowserRouter, Routes, Route } from 'react-router';
import { AnimatePresence } from 'framer-motion';
import { AssessmentProvider } from '@/hooks/useAssessment';
import { LandingPage } from '@/components/landing/LandingPage';
import { AssessmentFlow } from '@/components/assessment/AssessmentFlow';
import { ResultsPage } from '@/components/results/ResultsPage';

function App() {
  return (
    <BrowserRouter>
      <AssessmentProvider>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/assess" element={<AssessmentFlow />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </AnimatePresence>
      </AssessmentProvider>
    </BrowserRouter>
  );
}

export default App;
