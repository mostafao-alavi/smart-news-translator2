import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { AppDashboard } from './components/AppDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page Route at Root */}
        <Route path="/" element={<LandingPage />} />

        {/* Dashboard Routes */}
        <Route path="/app/*" element={<AppDashboard />} />
        <Route path="/dashboard" element={<AppDashboard />} />
        <Route path="/news" element={<AppDashboard />} />
        <Route path="/content-desk" element={<AppDashboard />} />
        <Route path="/sources" element={<AppDashboard />} />
        <Route path="/destinations" element={<AppDashboard />} />
        <Route path="/reports" element={<AppDashboard />} />
        <Route path="/d1" element={<AppDashboard />} />
        <Route path="/database" element={<AppDashboard />} />
        <Route path="/distributions" element={<AppDashboard />} />
        <Route path="/settings" element={<AppDashboard />} />

        {/* Fallback to Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
