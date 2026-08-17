import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppDashboard } from './components/AppDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root Route directly opens Dashboard */}
        <Route path="/" element={<AppDashboard />} />

        {/* Dashboard Direct & Deep-link Routes */}
        <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/app/*" element={<AppDashboard />} />
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/news" element={<Navigate to="/app/content-desk" replace />} />
        <Route path="/content-desk" element={<Navigate to="/app/content-desk" replace />} />
        <Route path="/sources" element={<Navigate to="/app/sources" replace />} />
        <Route path="/destinations" element={<Navigate to="/app/destinations" replace />} />
        <Route path="/reports" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/d1" element={<Navigate to="/app/settings" replace />} />
        <Route path="/database" element={<Navigate to="/app/settings" replace />} />
        <Route path="/distributions" element={<Navigate to="/app/destinations" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

        {/* Fallback to Dashboard */}
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

