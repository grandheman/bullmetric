import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { TradeProvider } from './context/TradeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Upload from './pages/Upload';
import Converter from './pages/Converter';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoute><TradeProvider><Layout /></TradeProvider></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/converter" element={<Converter />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
