import React, { useState } from 'react';
import { X, Phone, Mail, User, MapPin, Home } from 'lucide-react';

const ContactFormModal = ({ 
  isOpen, 
  onClose, 
  property = null 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get backend URL from environment variables
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
  const CONTACT_EMAIL = process.env.REACT_APP_CONTACT_EMAIL;
  const CONTACT_PHONE = process.env.REACT_APP_CONTACT_PHONE;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Prepare data for backend
      const submitData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        property: property ? {
          address: formatAddress(property.address),
          price: property.listPrice || property.price,
          mlsNumber: property.mlsNumber,
          badge: getPropertyBadge(property)
        } : null
      };

      // Send to backend API
      const response = await fetch(`${BACKEND_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      console.log('Email sent successfully:', result);
      setIsSubmitted(true);
      
      // Auto close after 3 seconds on success
      setTimeout(() => {
        handleClose();
      }, 3000);
      
    } catch (error) {
      console.error('Failed to send email:', error);
      
      // User-friendly error message with fallback contact info
      alert(`Sorry, there was an error sending your message: ${error.message}. Please try again or contact Jeff directly at ${CONTACT_EMAIL} or ${CONTACT_PHONE}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', phone: '', message: '' });
    setIsSubmitted(false);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '16px',
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      transform: isOpen ? 'scale(1)' : 'scale(0.95)',
      transition: 'all 0.3s ease',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    },
    modalContent: {
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '90vh',
      overflow: 'hidden'
    },
    scrollableContent: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden'
    },
    header: {
      padding: '24px 24px 0',
      borderBottom: 'none'
    },
    closeButton: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: '#f3f4f6',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      color: '#6b7280'
    },
    closeButtonHover: {
      background: '#e5e7eb',
      color: '#374151'
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#111827',
      margin: '0 0 8px 0',
      lineHeight: '1.2'
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
      margin: '0 0 24px 0',
      lineHeight: '1.5'
    },
    propertyInfo: {
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      padding: '16px',
      margin: '0 24px 24px',
      border: '1px solid #e2e8f0'
    },
    propertyHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px'
    },
    propertyTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1e293b',
      margin: 0
    },
    propertyAddress: {
      fontSize: '14px',
      color: '#050E3D',
      margin: 0,
      lineHeight: '1.4'
    },
    propertyPrice: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#050E3D',
      margin: '8px 0 0 0'
    },
    form: {
      padding: '0 24px 24px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '16px',
      backgroundColor: 'white',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit'
    },
    inputFocus: {
      outline: 'none',
      borderColor: '#050E3D',
      boxShadow: '0 0 0 3px rgba(5, 80, 150, 0.1)'
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '16px',
      backgroundColor: 'white',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
      resize: 'vertical',
      minHeight: '100px'
    },
    submitButton: {
      width: '100%',
      padding: '14px 24px',
      backgroundColor: '#050E3D',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    submitButtonHover: {
      backgroundColor: '#1D1D1D',
      transform: 'translateY(-1px)'
    },
    submitButtonDisabled: {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed',
      transform: 'none'
    },
    successState: {
      padding: '40px 24px',
      textAlign: 'center'
    },
    successIcon: {
      width: '64px',
      height: '64px',
      backgroundColor: '#10b981',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      color: 'white'
    },
    successTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#111827',
      margin: '0 0 8px 0'
    },
    successMessage: {
      fontSize: '16px',
      color: '#6b7280',
      lineHeight: '1.5',
      margin: 0
    }
  };

  const formatAddress = (address) => {
    if (typeof address === 'string') return address;
    if (!address) return 'Property inquiry';
    
    const parts = [];
    if (address.streetNumber) parts.push(address.streetNumber);
    if (address.streetName) parts.push(address.streetName);
    if (address.streetSuffix) parts.push(address.streetSuffix);
    
    return parts.join(' ') || 'Property inquiry';
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Price on request';
    return `$${price.toLocaleString()}`;
  };

  const getPropertyBadge = (property) => {
    // Since we're filtering for Sale only, always return "For Sale"
    return 'For Sale';
  };

  return (
    <div style={modalStyles.overlay} onClick={handleClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.modalContent}>
          <button 
            style={modalStyles.closeButton}
            onClick={handleClose}
            onMouseEnter={(e) => Object.assign(e.target.style, modalStyles.closeButtonHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, modalStyles.closeButton)}
          >
            <X size={20} />
          </button>

          <div style={modalStyles.scrollableContent}>
            {isSubmitted ? (
              // Success State
              <div style={modalStyles.successState}>
                <div style={modalStyles.successIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
                <h2 style={modalStyles.successTitle}>Thank You!</h2>
                <p style={modalStyles.successMessage}>
                  Jeff will be in contact with you soon regarding your inquiry. Your message has been sent successfully.
                </p>
              </div>
            ) : (
              // Form State
              <>
                <div style={modalStyles.header}>
                  <h2 style={modalStyles.title}>Contact {process.env.REACT_APP_AGENT_NAME || 'Jeff Thibodeau'}</h2>
                  <p style={modalStyles.subtitle}>
                    Get more information about this property or schedule a viewing
                  </p>
                </div>

                {/* Property Info */}
                {property && (
                  <div style={modalStyles.propertyInfo}>
                    <div style={modalStyles.propertyHeader}>
                      <Home size={18} color="#050E3D" />
                      <h3 style={modalStyles.propertyTitle}>Property Inquiry</h3>
                    </div>
                    <p style={modalStyles.propertyAddress}>
                      {formatAddress(property.address)}
                    </p>
                    <p style={modalStyles.propertyPrice}>
                      {formatPrice(property.listPrice || property.price)}
                    </p>
                  </div>
                )}

                <form style={modalStyles.form} onSubmit={handleSubmit}>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.label}>
                      <User size={16} style={{ display: 'inline', marginRight: '8px' }} />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      style={modalStyles.input}
                      onFocus={(e) => Object.assign(e.target.style, modalStyles.inputFocus)}
                      onBlur={(e) => Object.assign(e.target.style, modalStyles.input)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.label}>
                      <Mail size={16} style={{ display: 'inline', marginRight: '8px' }} />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      style={modalStyles.input}
                      onFocus={(e) => Object.assign(e.target.style, modalStyles.inputFocus)}
                      onBlur={(e) => Object.assign(e.target.style, modalStyles.input)}
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.label}>
                      <Phone size={16} style={{ display: 'inline', marginRight: '8px' }} />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      style={modalStyles.input}
                      onFocus={(e) => Object.assign(e.target.style, modalStyles.inputFocus)}
                      onBlur={(e) => Object.assign(e.target.style, modalStyles.input)}
                      placeholder={CONTACT_PHONE}
                    />
                  </div>

                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.label}>
                      Message (Optional)
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      style={modalStyles.textarea}
                      onFocus={(e) => Object.assign(e.target.style, modalStyles.inputFocus)}
                      onBlur={(e) => Object.assign(e.target.style, modalStyles.textarea)}
                      placeholder="I'm interested in this property and would like more information..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.name || !formData.email || !formData.phone}
                    style={{
                      ...modalStyles.submitButton,
                      ...(isSubmitting || !formData.name || !formData.email || !formData.phone 
                        ? modalStyles.submitButtonDisabled 
                        : {}
                      )
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting && formData.name && formData.email && formData.phone) {
                        Object.assign(e.target.style, modalStyles.submitButtonHover);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting && formData.name && formData.email && formData.phone) {
                        Object.assign(e.target.style, modalStyles.submitButton);
                      }
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid transparent',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail size={18} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ContactFormModal;