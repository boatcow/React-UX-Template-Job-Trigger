import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <button 
          className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          Current Monitor
        </button>
        <button 
          className={`nav-btn ${location.pathname === '/historical-view' ? 'active' : ''}`}
          onClick={() => navigate('/historical-view')}
        >
          Historical Data
        </button>
      </div>
    </nav>
  );
};

export default Navbar; 