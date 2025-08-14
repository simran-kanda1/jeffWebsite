import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Mail } from 'lucide-react';
import './header.css';
import logo from './logo.png';
import cobaltlogo from './cobaltLogo.png';

const Header = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // NO useEffect that modifies body overflow - this was breaking scroll

  return (
    <>
      <div className="pine-header">
        {/* Your existing header content */}
        <div className="header-left desktop-only">
          <nav className="nav">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              Browse Properties
            </Link>
            <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
              About Jeff
            </Link>
          </nav>
        </div>

        <div className="mobile-logo mobile-only">
          <Link to="/" onClick={closeMenu}>
            <img src={cobaltlogo} alt="REAL Brokerage Logo" className="mobile-logo-image" />
          </Link>
        </div>

        <div className="logo-container desktop-only">
          <Link to="/">
            <img src={cobaltlogo} alt="REAL Brokerage Logo" className="logo-image" />
          </Link>
        </div>

        <div className="mobile-menu-toggle mobile-only">
          <button onClick={toggleMenu} className="hamburger-btn">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className={`mobile-menu-overlay ${isMenuOpen ? 'show' : ''}`}>
          <div className="mobile-menu-content">
            <div className="mobile-menu-header">
              <img src={cobaltlogo} alt="REAL Brokerage Logo" className="mobile-menu-logo" />
            </div>
            <nav className="mobile-nav">
              <Link to="/" onClick={closeMenu} className={`mobile-nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                Browse homes
              </Link>
              <Link to="/about" onClick={closeMenu} className={`mobile-nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
                About Us
              </Link>
            </nav>
            <div className="mobile-contact">
              <a href="mailto:jt@jeffthibodeau.me" onClick={closeMenu} className="mobile-contact-item">
                <Mail size={20} />
                jt@jeffthibodeau.me
              </a>
              <a href="tel:519-861-1385" onClick={closeMenu} className="mobile-contact-item">
                <Phone size={20} />
                (519) 861-1385
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;