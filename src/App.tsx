import { Routes, Route, Navigate } from 'react-router-dom'
import Shell from './components/Shell'
import Landing from './pages/Landing'
import LiveDemo from './pages/LiveDemo'
import PostCall from './pages/PostCall'
import Missed from './pages/Missed'
import Dashboard from './pages/Dashboard'
import { Calls, CallDetail } from './pages/Calls'
import Leads from './pages/Leads'
import KB from './pages/KB'
import Settings from './pages/Settings'
import ROI from './pages/ROI'
export default function App() {
  return <Routes><Route element={<Shell />}><Route path="/" element={<Landing />} /><Route path="/call" element={<LiveDemo />} /><Route path="/call/summary/:id" element={<PostCall />} /><Route path="/missed" element={<Missed />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/calls" element={<Calls />} /><Route path="/calls/:id" element={<CallDetail />} /><Route path="/leads" element={<Leads />} /><Route path="/kb" element={<KB />} /><Route path="/settings" element={<Settings />} /><Route path="/roi" element={<ROI />} /><Route path="*" element={<Navigate to="/" />} /></Route></Routes>
}
