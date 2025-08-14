import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Phone, Mail, User, Home, MapPin, Calendar, Building, Car, Bed, Bath, Square, Thermometer, Zap, Droplets, Shield, TreePine, Camera } from 'lucide-react';
import apiService from './apiService';
import ContactFormModal from './ContactFormModal';
import './PropertyDetailsPage.css';
import whiteLogo from './logo.png';
import aboutPage from './aboutPage.avif';

const PropertyDetailsPage = ({ property: initialProperty, onBack, onPropertySelect }) => {
  const { mlsNumber } = useParams();
  const navigate = useNavigate();
  
  const [property, setProperty] = useState(initialProperty);
  const [similarListings, setSimilarListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);

  const IMAGE_BASE_URL = 'https://cdn.repliers.io/';

  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setLoading(true);
        setError(null);

        // If we have an mlsNumber from the URL, fetch the property
        if (mlsNumber) {
          try {
            const fullPropertyData = await apiService.getSingleListing(mlsNumber);
            setProperty(fullPropertyData);
            
            // Fetch similar listings
            try {
              const similarData = await apiService.getSimilarListings(mlsNumber);
              setSimilarListings(similarData.listings || []);
            } catch (similarError) {
              console.warn('Could not load similar listings:', similarError);
            }
          } catch (err) {
            console.error('Could not fetch property details:', err);
            setError(`Failed to load property details: ${err.message}`);
          }
        } else if (initialProperty) {
          // Use the initially passed property
          setProperty(initialProperty);
          
          if (initialProperty.mlsNumber) {
            try {
              const similarData = await apiService.getSimilarListings(initialProperty.mlsNumber);
              setSimilarListings(similarData.listings || []);
            } catch (similarError) {
              console.warn('Could not load similar listings:', similarError);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching property details:', err);
        setError(`Failed to load property details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, [mlsNumber, initialProperty]);

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getImageUrl = (imageName) => {
    return `${IMAGE_BASE_URL}${imageName}`;
  };

  const formatAddress = (address) => {
    if (!address) return 'Address not available';
    const parts = [];
    if (address.streetNumber) parts.push(address.streetNumber);
    if (address.streetDirectionPrefix) parts.push(address.streetDirectionPrefix);
    if (address.streetName) parts.push(address.streetName);
    if (address.streetSuffix) parts.push(address.streetSuffix);
    if (address.streetDirection) parts.push(address.streetDirection);
    if (address.unitNumber) parts.push(`Unit ${address.unitNumber}`);
    return parts.join(' ');
  };

  const getFullAddress = (address) => {
    if (!address) return 'Address not available';
    const street = formatAddress(address);
    const cityParts = [];
    if (address.city) cityParts.push(address.city);
    if (address.state) cityParts.push(address.state);
    if (address.zip) cityParts.push(address.zip);
    return `${street}, ${cityParts.join(', ')}`;
  };

  const nextImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  const handleSimilarPropertyClick = (similarProperty) => {
    if (similarProperty.mlsNumber) {
      navigate(`/property/${similarProperty.mlsNumber}`);
    }
  };

  const handleContactClick = () => {
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
  };

  const openPhotoGallery = (index = 0) => {
    setGalleryImageIndex(index);
    setPhotoGalleryOpen(true);
  };

  const closePhotoGallery = () => {
    setPhotoGalleryOpen(false);
  };

  const nextGalleryImage = () => {
    if (property?.images) {
      setGalleryImageIndex((prev) => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevGalleryImage = () => {
    if (property?.images) {
      setGalleryImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  const copyLinkToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareDropdownOpen(false);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const shareViaEmail = () => {
    const propertyAddress = formatAddress(property.address);
    const subject = encodeURIComponent(`Check out this home for sale on Jeff Thibodeau's site`);
    const body = encodeURIComponent(`I found this property that might interest you:\n\n${propertyAddress}\n${formatPrice(property.listPrice)}\n\n${window.location.href}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setShareDropdownOpen(false);
  };

  const handleBackToSearch = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #f3f3f3', 
            borderTop: '3px solid #050E3D', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#666', fontSize: '16px' }}>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>
          {error ? 'Error Loading Property' : 'Property Not Found'}
        </h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          {error || 'The requested property could not be found.'}
        </p>
        <button 
          onClick={handleBackToSearch}
          style={{
            background: '#050E3D',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Go Back to Search
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid #e5e7eb',
        background: 'white',
        position: 'sticky',
        top: '80px',
        zIndex: 100
      }}>
        <button 
          onClick={handleBackToSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#050E3D',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '8px 0'
          }}
        >
          <ArrowLeft size={20} />
          Search
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShareDropdownOpen(!shareDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '12px 16px',
                cursor: 'pointer',
                color: '#6b7280',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f9fafb';
                e.target.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              <Share2 size={18} />
              Share
            </button>

            {/* Share Dropdown */}
            {shareDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '8px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 50,
                minWidth: '200px',
                overflow: 'hidden'
              }}>
                <button
                  onClick={copyLinkToClipboard}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#374151',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'none';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  Copy Link
                </button>
                
                <button
                  onClick={shareViaEmail}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#374151',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'none';
                  }}
                >
                  <Mail size={16} />
                  Email
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Pine.ca Layout */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0' }} onClick={() => setShareDropdownOpen(false)}>

        {/* Image Gallery - Full Width */}
        <div style={{ marginBottom: '40px' }} onClick={(e) => e.stopPropagation()}>
          {property.images && property.images.length > 0 && (
            <>
              {/* Main Image */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '350px',
                overflow: 'hidden',
                background: '#f3f4f6'
              }}>
                <img 
                  src={getImageUrl(property.images[currentImageIndex])} 
                  alt={`Property image ${currentImageIndex + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                
                {/* For Sale Badge */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  background: '#050E3D',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  For sale
                </div>

                {/* Navigation Arrows */}
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      style={{
                        position: 'absolute',
                        left: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '20px',
                        color: '#374151'
                      }}
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextImage}
                      style={{
                        position: 'absolute',
                        right: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '20px',
                        color: '#374151'
                      }}
                    >
                      ›
                    </button>
                  </>
                )}

                {/* View All Photos Button */}
                <button
                  onClick={() => openPhotoGallery(currentImageIndex)}
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(0, 0, 0, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(0, 0, 0, 0.7)';
                  }}
                >
                  <Camera size={16} />
                  View all {property.images.length} photos
                </button>
              </div>

              {/* Thumbnail Strip - Show All Photos */}
              {property.images.length > 1 && (
                <div style={{ 
                  padding: '20px 40px 0',
                  overflowX: 'auto'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    minWidth: 'fit-content'
                  }}>
                    {property.images.map((image, index) => (
                      <img
                        key={index}
                        src={getImageUrl(image)}
                        alt={`Thumbnail ${index + 1}`}
                        style={{
                          width: '120px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: index === currentImageIndex ? '3px solid #050E3D' : '3px solid transparent',
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                        onClick={() => {
                          setCurrentImageIndex(index);
                          openPhotoGallery(index);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Property Information - Single Column Layout */}
        <div style={{ padding: '0 40px 60px' }}>

          {/* Price and Address - Refined Professional Layout */}
          <div style={{ 
            background: 'white',
            padding: '24px 28px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            marginBottom: '24px'
          }}>
            {/* Price */}
            <div style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: '#111827',
              marginBottom: '8px',
              lineHeight: '1.1'
            }}>
              {formatPrice(property.listPrice)}
            </div>

            {/* Address */}
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '4px',
              lineHeight: '1.3'
            }}>
              {formatAddress(property.address)}
            </div>

            <div style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              marginBottom: '12px',
              lineHeight: '1.4'
            }}>
              {property.address?.city}, {property.address?.state} {property.address?.zip}
            </div>

            {/* Days on Market */}
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              background: '#f0f6fd',
              color: '#050E3D',
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '500',
              border: '1px solid rgb(187, 224, 247)',
              marginBottom: '20px'
            }}>
              {property.simpleDaysOnMarket || 0} days on market
            </div>

            {/* Property Stats Row - Refined */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>
                  {property.details?.numBedrooms || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Beds
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>
                  {property.details?.numBathrooms || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Baths
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>
                  {property.details?.sqft || 'N/A'}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Sq Ft
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>
                  {property.details?.numParkingSpaces || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Parking
                </div>
              </div>

              <div style={{ textAlign: 'center', gridColumn: property.details?.numParkingSpaces ? 'auto' : 'span 2' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#050E3D', marginBottom: '2px' }}>
                  {property.details?.propertyType || 'N/A'}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Type
                </div>
              </div>
            </div>

            {/* Professional Contact Card - NEW */}
            <div style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '32px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                Contact Your Real Estate Professional
              </h3>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '20px'
              }}>
                {/* Jeff's Photo */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #050E3D',
                  flexShrink: 0
                }}>
                  <img 
                    src={aboutPage} 
                    alt="Jeff Thibodeau"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>

                {/* Jeff's Info */}
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: '4px'
                  }}>
                    Jeff Thibodeau
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '8px'
                  }}>
                    Licensed Real Estate Broker
                  </p>
                  <p style={{
                    fontSize: '13px',
                    color: '#9ca3af',
                    marginBottom: '0'
                  }}>
                    REAL Brokerage • License #20071283
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '20px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    background: '#050E3D',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Phone size={16} color="white" />
                  </div>
                  <div>
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      margin: '0 0 2px 0',
                      fontWeight: '500'
                    }}>
                      Phone
                    </p>
                    <a 
                      href="tel:519-861-1385"
                      style={{
                        fontSize: '14px',
                        color: '#050E3D',
                        fontWeight: '600',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                      (519) 861-1385
                    </a>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    background: '#050E3D',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Mail size={16} color="white" />
                  </div>
                  <div>
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      margin: '0 0 2px 0',
                      fontWeight: '500'
                    }}>
                      Email
                    </p>
                    <a 
                      href="mailto:jt@jeffthibodeau.me"
                      style={{
                        fontSize: '14px',
                        color: '#050E3D',
                        fontWeight: '600',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                      jt@jeffthibodeau.me
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Form Button */}
              <button
                onClick={handleContactClick}
                style={{
                  width: '100%',
                  background: '#050E3D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px 24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  letterSpacing: '0.25px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#1D1D1D';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#050E3D';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <Mail size={16} />
                Contact Jeff About This Property
              </button>

              {/* Professional Note */}
              <p style={{
                fontSize: '12px',
                color: '#9ca3af',
                textAlign: 'center',
                marginTop: '12px',
                marginBottom: '0',
                lineHeight: '1.4'
              }}>
                Over 15 years of experience in Brantford real estate. Get personalized service and expert market insights.
              </p>
            </div>

            </div>

          {/* Home Details Section */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#111827',
              marginBottom: '24px'
            }}>
              Home Details
            </h2>

            {property.details?.description && (
              <div style={{
                fontSize: '16px',
                lineHeight: '1.7',
                color: '#374151',
                marginBottom: '32px',
                padding: '24px',
                background: '#fafafa',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                {property.details.description}
              </div>
            )}

            {/* Comprehensive Property Details */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '24px',
              marginBottom: '32px'
            }}>

              {/* Basic Details */}
              <div style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '24px'
              }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Property Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'MLS Number', value: property.mlsNumber },
                    { label: 'Property Type', value: property.details?.propertyType },
                    { label: 'Style', value: property.details?.style },
                    { label: 'Year Built', value: property.details?.yearBuilt },
                    { label: 'Square Footage', value: property.details?.sqft },
                    { label: 'Lot Size', value: property.lot?.size || 'N/A' },
                    { label: 'Bedrooms', value: `${property.details?.numBedrooms || 0}${property.details?.numBedroomsPlus ? ` + ${property.details.numBedroomsPlus}` : ''}` },
                    { label: 'Bathrooms', value: `${property.details?.numBathrooms || 0}${property.details?.numBathroomsPlus ? ` + ${property.details.numBathroomsPlus}` : ''}` }
                  ].filter(item => item.value && item.value !== '0' && item.value !== 'N/A').map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>{item.label}</span>
                      <span style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Systems & Features */}
              <div style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '24px'
              }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Systems & Features
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Heating', value: property.details?.heating },
                    { label: 'Air Conditioning', value: property.details?.airConditioning },
                    { label: 'Garage', value: property.details?.garage },
                    { label: 'Parking Spaces', value: property.details?.numParkingSpaces },
                    { label: 'Basement', value: property.details?.basement1 },
                    { label: 'Fireplace', value: property.details?.numFireplaces ? `${property.details.numFireplaces} fireplaces` : 'None' },
                    { label: 'Central Vacuum', value: property.details?.centralVac === 'Y' ? 'Yes' : 'No' },
                    { label: 'Swimming Pool', value: property.details?.swimmingPool || 'None' }
                  ].filter(item => item.value && item.value !== 'None' && item.value !== '0').map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>{item.label}</span>
                      <span style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Information */}
              <div style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '24px'
              }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Financial
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'List Price', value: formatPrice(property.listPrice) },
                    { label: 'Original Price', value: property.originalPrice ? formatPrice(property.originalPrice) : 'Same as list' },
                    { label: 'Annual Taxes', value: property.taxes?.annualAmount ? formatPrice(property.taxes.annualAmount) : 'N/A' },
                    { label: 'Assessment Year', value: property.taxes?.assessmentYear },
                    { label: 'HOA Fee', value: property.details?.HOAFee ? `${property.details.HOAFee}/month` : 'N/A' },
                    { label: 'Occupancy', value: property.occupancy }
                  ].filter(item => item.value && item.value !== 'N/A').map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>{item.label}</span>
                      <span style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Condo Information */}
              {property.condominium && (
                <div style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '24px'
                }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                    Condominium Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: 'Condo Corp', value: `${property.condominium.condoCorp} ${property.condominium.condoCorpNum}` },
                      { label: 'Maintenance Fee', value: property.condominium.fees?.maintenance ? `${property.condominium.fees.maintenance}/month` : 'N/A' },
                      { label: 'Exposure', value: property.condominium.exposure },
                      { label: 'Stories', value: property.condominium.stories },
                      { label: 'Pets', value: property.condominium.pets },
                      { label: 'Locker', value: property.condominium.locker },
                      { label: 'Locker Number', value: property.condominium.lockerNumber },
                      { label: 'Parking Type', value: property.condominium.parkingType },
                      { label: 'Property Manager', value: property.condominium.propertyMgr }
                    ].filter(item => item.value && item.value !== 'N/A').map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: '8px',
                        borderBottom: '1px solid #f0f0f0'
                      }}>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>{item.label}</span>
                        <span style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Construction & Materials */}
              <div style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '24px'
              }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Construction & Materials
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Exterior Material', value: property.details?.exteriorConstruction1 },
                    { label: 'Exterior Material 2', value: property.details?.exteriorConstruction2 },
                    { label: 'Roof Material', value: property.details?.roofMaterial },
                    { label: 'Foundation', value: property.details?.foundationType },
                    { label: 'Flooring', value: property.details?.flooringType },
                    { label: 'Ceiling Type', value: property.details?.ceilingType },
                    { label: 'Construction Status', value: property.details?.constructionStatus }
                  ].filter(item => item.value).map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>{item.label}</span>
                      <span style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Features */}
              <div style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '24px'
              }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Additional Features
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Balcony', value: property.details?.balcony },
                    { label: 'Patio', value: property.details?.patio },
                    { label: 'Den', value: property.details?.den },
                    { label: 'Family Room', value: property.details?.familyRoom === 'Y' ? 'Yes' : 'No' },
                    { label: 'Elevator', value: property.details?.elevator },
                    { label: 'Laundry Level', value: property.details?.laundryLevel },
                    { label: 'Fire Protection', value: property.details?.fireProtection },
                    { label: 'Water Source', value: property.details?.waterSource },
                    { label: 'Sewer', value: property.details?.sewer },
                    { label: 'Waterfront', value: property.details?.waterfront },
                    { label: 'View Type', value: property.details?.viewType }
                  ].filter(item => item.value && item.value !== 'No').map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>{item.label}</span>
                      <span style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Room Dimensions */}
          {property.rooms && property.rooms.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: '#111827',
                marginBottom: '24px'
              }}>
                Room Dimensions
              </h2>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '16px' 
              }}>
                {property.rooms.map((room, index) => (
                  <div key={index} style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                          {room.description}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                          Level: {room.level}
                        </div>
                        {room.features && (
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {room.features}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#050E3D', textAlign: 'right' }}>
                        {room.length && room.width && parseFloat(room.length) > 0 && parseFloat(room.width) > 0 ? (
                          `${room.length}m × ${room.width}m`
                        ) : (
                          'Dimensions N/A'
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Property History */}
          {property.history && property.history.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: '#111827',
                marginBottom: '24px'
              }}>
                Property History
              </h2>
              
              <div style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {property.history.map((entry, index) => (
                  <div key={index} style={{
                    padding: '20px',
                    borderBottom: index < property.history.length - 1 ? '1px solid #e5e7eb' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#050E3D', marginBottom: '4px' }}>
                        {entry.type === 'Sale' ? 'Listed for Sale' : 'Listed for Lease'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {formatDate(entry.listDate)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Status: {entry.lastStatus}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#050E3D' }}>
                        {formatPrice(entry.listPrice)}
                      </div>
                      {entry.soldPrice && (
                        <div style={{ fontSize: '14px', color: '#050E3D' }}>
                          Sold: {formatPrice(entry.soldPrice)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearby Amenities */}
          {property.nearby?.amenities && property.nearby.amenities.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: '#111827',
                marginBottom: '24px'
              }}>
                Nearby Amenities
              </h2>
              
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px' 
              }}>
                {property.nearby.amenities.map((amenity, index) => (
                  <div key={index} style={{
                    background: '#f0f8fd',
                    color: '#050E3D',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid rgb(187, 215, 247)'
                  }}>
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Homes */}
          {similarListings.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: '#111827',
                marginBottom: '8px'
              }}>
                Similar homes for sale
              </h2>
              <p style={{ 
                fontSize: '16px', 
                color: '#6b7280', 
                marginBottom: '32px',
                lineHeight: '1.5'
              }}>
                These homes have similar price range, details and proximity to{' '}
                {formatAddress(property.address)}
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '24px' 
              }}>
                {similarListings.slice(0, 6).map((listing) => (
                  <div 
                    key={listing.mlsNumber} 
                    onClick={() => handleSimilarPropertyClick(listing)}
                    style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {listing.images && listing.images[0] && (
                      <img 
                        src={getImageUrl(listing.images[0])} 
                        alt="Property"
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                    <div style={{ padding: '20px' }}>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: '700', 
                        color: '#111827',
                        marginBottom: '8px'
                      }}>
                        {formatPrice(listing.listPrice)}
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px',
                        fontSize: '14px',
                        color: '#6b7280',
                        marginBottom: '8px'
                      }}>
                        <span>{listing.details?.numBedrooms || 0} bd</span>
                        <span>•</span>
                        <span>{listing.details?.numBathrooms || 0} ba</span>
                        <span>•</span>
                        <span>{listing.details?.propertyType || 'N/A'}</span>
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#6b7280',
                        lineHeight: '1.4'
                      }}>
                        {formatAddress(listing.address)}, {listing.address?.city}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listing Brokerage */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#111827',
              marginBottom: '24px'
            }}>
              Listing Brokerage
            </h2>
            
            <div style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>MLS® Listing</span>
                  <span style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{property.mlsNumber}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Brokerage</span>
                  <span style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                    {property.office?.brokerageName || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Clean Professional Design */}
      <footer style={{
        background: '#050E3D',
        color: 'white',
        padding: '60px 40px 40px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '2fr 1fr 1fr',
            gap: window.innerWidth <= 768 ? '24px' : '60px',
            marginBottom: window.innerWidth <= 768 ? '30px' : '40px'
          }}>
            {/* Company Info with Logo */}
            <div>
              <div style={{ marginBottom: '5px' }}>
                <img 
                  src={whiteLogo} 
                  alt="REAL Brokerage Logos" 
                  style={{ 
                    height: '40px',
                    marginBottom: '5px'
                  }} 
                />
              </div>
              <p style={{ 
                fontSize: '16px', 
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0 0 24px 0',
                maxWidth: '400px'
              }}>
                Your trusted real estate professional in Brantford and surrounding areas. With over 15 years of experience, Jeff is committed to making your home buying or selling journey as smooth and successful as possible.
              </p>
              
              {/* Contact Info */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px'
              }}>
                <a 
                  href="mailto:jt@jeffthibodeau.me" 
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.9)', 
                    textDecoration: 'none',
                    fontSize: '15px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'white'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.9)'}
                >
                  jt@jeffthibodeau.me
                </a>
                <a 
                  href="tel:519-861-1385" 
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.9)', 
                    textDecoration: 'none',
                    fontSize: '15px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'white'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.9)'}
                >
                  (519) 861-1385
                </a>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h4 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '20px',
                color: 'white'
              }}>
                Navigation
              </h4>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px'
              }}>
                <Link 
                  to="/"
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    textDecoration: 'none',
                    fontSize: '15px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'white'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
                >
                  Browse Properties
                </Link>
                <Link 
                  to="/about"
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    textDecoration: 'none',
                    fontSize: '15px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'white'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
                >
                  About Jeff
                </Link>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '20px',
                color: 'white'
              }}>
                Follow Jeff
              </h4>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                {/* Instagram */}
                <a 
                  href="https://www.instagram.com/jeffthibodeau" 
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a 
                  href="https://www.facebook.com/thibodeau.jeff" 
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* TikTok */}
                <a 
                  href="https://www.tiktok.com/@jeff.thibodeau" 
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>

                {/* YouTube */}
                <a 
                  href="https://www.youtube.com/jeffthibodeau" 
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>

                {/* LinkedIn */}
                <a 
                  href="https://www.linkedin.com/in/jeff-thibodeau/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            paddingTop: '32px',
            textAlign: 'left',
          }}>
            <div style={{ 
              fontSize: '14px', 
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '16px'
            }}>
              © 2025 Jeff Thibodeau Real Estate | REAL Brokerage. All rights reserved.
            </div>
            
            {/* License Information */}
            <div style={{
              marginTop: '24px',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.5)',
              lineHeight: '1.5'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>
                License Number: 20071283 | REAL Brokerage, Brantford
              </p>
              <p style={{ margin: 0 }}>
                The trademarks REALTOR®, REALTORS® and the REALTOR® logo are controlled by The Canadian Real Estate Association (CREA) and identify real estate professionals who are members of CREA. The trademarks MLS®, Multiple Listing Service® and the associated logos are owned by CREA and identify the quality of services provided by real estate professionals who are members of CREA. Used under license.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={contactModalOpen}
        onClose={handleCloseContactModal}
        property={property}
      />

      {/* Photo Gallery Modal */}
      {photoGalleryOpen && property.images && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={closePhotoGallery}>
          
          {/* Close Button */}
          <button
            onClick={closePhotoGallery}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '24px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ×
          </button>

          {/* Image Counter */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '500',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '8px 16px',
            borderRadius: '20px'
          }}>
            {galleryImageIndex + 1} of {property.images.length}
          </div>

          {/* Main Gallery Image */}
          <div style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden' // ADDED: Prevent arrows from going off-screen
          }} onClick={(e) => e.stopPropagation()}>
            
            <img
              src={getImageUrl(property.images[galleryImageIndex])}
              alt={`Gallery image ${galleryImageIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />

            {/* Navigation Arrows */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevGalleryImage}
                  className="photo-gallery-nav-arrow-left" // Added class for CSS targeting
                  style={{
                    position: 'absolute',
                    // FIXED: Mobile-responsive positioning
                    left: window.innerWidth <= 768 ? '10px' : '-60px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    // FIXED: Mobile-responsive sizing
                    width: window.innerWidth <= 480 ? '36px' : window.innerWidth <= 768 ? '40px' : '48px',
                    height: window.innerWidth <= 480 ? '36px' : window.innerWidth <= 768 ? '40px' : '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    // FIXED: Mobile-responsive font size
                    fontSize: window.innerWidth <= 480 ? '18px' : window.innerWidth <= 768 ? '20px' : '24px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  ‹
                </button>
                
                <button
                  onClick={nextGalleryImage}
                  className="photo-gallery-nav-arrow-right" // Added class for CSS targeting
                  style={{
                    position: 'absolute',
                    // FIXED: Mobile-responsive positioning
                    right: window.innerWidth <= 768 ? '10px' : '-60px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    // FIXED: Mobile-responsive sizing
                    width: window.innerWidth <= 480 ? '36px' : window.innerWidth <= 768 ? '40px' : '48px',
                    height: window.innerWidth <= 480 ? '36px' : window.innerWidth <= 768 ? '40px' : '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    // FIXED: Mobile-responsive font size
                    fontSize: window.innerWidth <= 480 ? '18px' : window.innerWidth <= 768 ? '20px' : '24px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Strip at Bottom */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            maxWidth: '90vw',
            overflowX: 'auto',
            padding: '10px',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '12px'
          }}>
            {property.images.map((image, index) => (
              <img
                key={index}
                src={getImageUrl(image)}
                alt={`Thumbnail ${index + 1}`}
                style={{
                  width: '60px',
                  height: '40px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: index === galleryImageIndex ? '2px solid #050E3D' : '2px solid transparent',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  opacity: index === galleryImageIndex ? 1 : 0.7
                }}
                onClick={() => setGalleryImageIndex(index)}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = index === galleryImageIndex ? '1' : '0.7';
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* CSS Animation for loading spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 1024px) {
          .property-stats {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          
          .footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 32px !important;
          }
          
          .details-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 768px) {
          .header-container {
            padding: 16px 20px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          
          .main-content {
            padding: 0 20px 40px !important;
          }
          
          .price-large {
            font-size: 36px !important;
          }
          
          .property-title-large {
            font-size: 20px !important;
          }
          
          .thumbnail-strip {
            padding: 20px 20px 0 !important;
          }
          
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          
          .footer-bottom {
            flex-direction: column !important;
            align-items: flex-start !important;
            text-align: left !important;
          }
        }
        
        @media (max-width: 480px) {
          .price-large {
            font-size: 32px !important;
          }
          
          .property-title-large {
            font-size: 18px !important;
          }
          
          .section-title {
            font-size: 24px !important;
          }
          
          .main-image {
            height: 300px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PropertyDetailsPage;