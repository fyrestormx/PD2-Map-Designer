import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ComposerPage } from './pages/ComposerPage'
import { ExportPage } from './pages/ExportPage'
import { GeneratorPage } from './pages/GeneratorPage'
import { ImportPage } from './pages/ImportPage'
import { LibraryPage } from './pages/LibraryPage'
import { ValidationPage } from './pages/ValidationPage'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/import" replace />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/composer" element={<ComposerPage />} />
        <Route path="/generator" element={<GeneratorPage />} />
        <Route path="/validation" element={<ValidationPage />} />
        <Route path="/export" element={<ExportPage />} />
      </Routes>
    </AppShell>
  )
}

export default App
