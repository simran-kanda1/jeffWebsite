import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './header.css';
import logo from './logo.png';
import cobaltlogo from './cobaltLogo.png';

const Header = () => {
  const location = useLocation();
  
  return (
    <>
      <div className="pine-header">
        <div className="header-left">
          <nav className="nav">
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Browse Properties
            </Link>
            <Link
              to="/about"
              className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
            >
              About Jeff
            </Link>
          </nav>
        </div>

        <div className="logo-container">
          <Link to="/">
            <img src={cobaltlogo} alt="REAL Brokerage Logo" className="logo-image" />
            <div className="logo-subtitle">Jeff Thibodeau</div>
          </Link>
        </div>
        
      </div>
    </>
  );
};

export default Header;