import './App.css'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AdvancedPage } from './pages/AdvancedPage'
import { BuildPage } from './pages/BuildPage'
import { ExportPage } from './pages/ExportPage'
import { HomePage } from './pages/HomePage'
import { ReviewPage } from './pages/ReviewPage'
import { ThemePage } from './pages/ThemePage'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/theme" element={<ThemePage />} />
        <Route path="/build" element={<BuildPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/advanced" element={<AdvancedPage />} />
      </Routes>
    </AppShell>
  )
}

export default App
