import { Routes, Route, Navigate } from 'react-router-dom'
import { RepoProvider } from './context/RepoContext'
import { LandingPage } from './pages/LandingPage'
import { AnalysisPage } from './pages/AnalysisPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/analyze" element={<AnalysisPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppContent() {
  return (
    <RepoProvider>
      <div className="min-h-screen bg-navy-950 text-navy-100">
        <AppRoutes />
      </div>
    </RepoProvider>
  )
}

export default function App() {
  return <AppContent />
}