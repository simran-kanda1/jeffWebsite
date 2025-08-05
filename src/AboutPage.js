// AboutPage.js
import React from 'react';
import './AboutPage.css';
import aboutPage from './aboutPage.avif'

const AboutPage = () => {
  const socialLinks = [
    { 
      name: 'TikTok', 
      url: 'https://www.tiktok.com/@jeff.thibodeau', 
      className: 'tiktok',
      icon: (
        <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.43z"/>
        </svg>
      )
    },
    { 
      name: 'Instagram', 
      url: 'https://www.instagram.com/jeffthibodeau', 
      className: 'instagram',
      icon: (
        <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    },
    { 
      name: 'Facebook', 
      url: 'https://www.facebook.com/thibodeau.jeff', 
      className: 'facebook',
      icon: (
        <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    { 
      name: 'LinkedIn', 
      url: 'https://www.linkedin.com/in/jeff-thibodeau/', 
      className: 'linkedin',
      icon: (
        <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    },
    { 
      name: 'YouTube', 
      url: 'https://www.youtube.com/jeffthibodeau', 
      className: 'youtube',
      icon: (
        <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-container">
          <div className="hero-grid">
            
            {/* Profile Image */}
            <div className="profile-image-container">
              <div className="profile-image-wrapper">
                <div className="profile-image">
                  {/* Replace this div with an img tag when you have Jeff's photo */}
                  <img src={aboutPage} alt="Jeff Thibodeau" className="logo-image" />
                </div>

                
                {/* Decorative elements */}
                <div className="decorative-element-1"></div>
                <div className="decorative-element-2"></div>
              </div>
            </div>

            {/* Content */}
            <div className="hero-content">
              <div className="content-header">
                <div className="broker-badge">
                  <svg className="broker-badge-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Licensed Real Estate Broker
                </div>
                <h1 className="main-title">Jeff Thibodeau</h1>
                <p className="main-subtitle">Real Estate Broker | Brantford, Ontario</p>
              </div>

              {/* Social Media Buttons */}
              <div className="social-buttons">
                {socialLinks.map((social, index) => (
                  <a
                    key={social.name}
                    href={social.url}
                    className={`social-button ${social.className}`}
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        
        {/* About Section */}
        <div className="about-section">
          <div className="about-content">
            <p className="about-paragraph">
              With over <span className="highlight-text">15 years of experience</span> in the real estate industry, Jeff
              Thibodeau is a licensed broker who combines local expertise, business
              acumen, and a client-centred approach to deliver exceptional results.
            </p>
            
            <p className="about-paragraph">
              Born and raised in Brantford, he understands the nuances of the local
              market and brings the invaluable experience of owning and operating a
              brokerage. A keen focus on analytics, process optimization, and innovative
              digital media strategies parallels his commitment to client success.
            </p>
            
            <p className="about-paragraph">
              In addition to his work in real estate, Jeff is a <span className="highlight-text">certified Business
              Performance Coach</span> and an accomplished speaker, trainer, and
              consultant. A personal passion for outdoor activities and family and a
              background in property renovations and investments complement his
              diverse skill set.
            </p>
            
            <p className="about-paragraph">
              Honest, reliable, and communication-focused, Jeff Thibodeau offers a
              comprehensive suite of services that sets him apart as a trusted advisor
              in real estate transactions.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="contact-section">
          <div className="contact-header">
            <h2 className="contact-title">Get In Touch</h2>
            <p className="contact-subtitle">Ready to start your real estate journey?</p>
          </div>
          
          <div className="contact-grid">
            <div className="contact-info-list">
              <div className="contact-item">
                <div className="contact-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div className="contact-details">
                  <h4>Email</h4>
                  <p>jt@jeffthibodeau.me</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <div className="contact-details">
                  <h4>Phone</h4>
                  <p>(519) 861-1385</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div className="contact-details">
                  <h4>Office</h4>
                  <p>REAL Brokerage, Brantford</p>
                </div>
              </div>
            </div>

            <div className="contact-sidebar">
              <div className="info-box">
                <h3>Service Area</h3>
                <p>Brantford, Ontario and surrounding areas</p>
              </div>

              <div className="info-box">
                <h3>License Information</h3>
                <p>License Number: 20071283</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;