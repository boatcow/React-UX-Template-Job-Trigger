import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MonitoringSystem from './components/MonitoringSystem';
import HistoricalView from './components/HistoricalView';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="content">
          <Routes>
            <Route path="/" element={<MonitoringSystem />} />
            <Route path="/historical-view" element={<HistoricalView />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App; 