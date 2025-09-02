// FIXED PropertyResults.js with heart button removed
import React, { useState } from 'react';
import './PropertyResults.css';
import formatAddress from './format/formatAddress';
import CompactPagination from './CompactPagination';
import Pagination from './Pagination';
import ContactFormModal from './ContactFormModal';

const PropertyResults = ({ 
  properties = [], 
  loading = false, 
  error = null, 
  onPropertySelect, 
  isHorizontal = false, 
  viewMode = 'map', 
  pagination = null, 
  currentPage = 1, 
  onPageChange,
  showPagination = true
}) => {
  const IMAGE_BASE_URL = 'https://cdn.repliers.io/';
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedPropertyForContact, setSelectedPropertyForContact] = useState(null);

  console.log('PropertyResults DEBUG:', { 
    'properties.length': properties.length,
    'pagination object': pagination,
    'pagination.count': pagination?.count,
    'pagination.numPages': pagination?.numPages,
    'pagination.pageSize': pagination?.pageSize,
    'currentPage': currentPage,
    loading, 
    error, 
    viewMode,
    showPagination
  });

  // Loading state
  if (loading) {
    return (
      <div className="property-results-wrapper">
        <div className="property-loading-state">
          <div className="property-loading-spinner"></div>
          <h3>Finding Properties</h3>
          <p>Searching through thousands of listings...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="property-results-wrapper">
        <div className="property-error-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <h3>Unable to Load Properties</h3>
          <p className="property-error-message">{error}</p>
          <button className="property-retry-btn" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate pagination values
  const pageNum = currentPage || pagination?.page || 1;
  const pageSize = pagination?.pageSize || 100;
  const totalPages = pagination?.numPages || 1;
  const totalCount = pagination?.count || 0;
  
  // Calculate current page range
  const startResult = totalCount > 0 ? ((pageNum - 1) * pageSize) + 1 : 0;
  const endResult = totalCount > 0 ? Math.min(pageNum * pageSize, totalCount) : properties.length;

  // Handle contact button click
  const handleContactClick = (property, e) => {
    e.stopPropagation();
    setSelectedPropertyForContact(property);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
    setSelectedPropertyForContact(null);
  };
  
  const getImageUrl = (property) => {
    const imageFilename = property.images?.[0];
    if (imageFilename) {
      return `${IMAGE_BASE_URL}${imageFilename}`;
    }
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgNzVIMTc1VjEyNUgxMjVWNzVaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K';
  };

  const getPropertyBadge = (property) => {
    return 'For Sale';
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Price on request';
    return `${price.toLocaleString()}`;
  };

  // Check if we're on mobile
  const isMobile = window.innerWidth <= 768;

  // Main render
  return (
    <div className="property-results-wrapper">
      {/* Header with results count and pagination on right */}
      {showPagination && (
        <div className="property-results-header">
          <div className="property-results-summary">
            <h3>
              {totalCount > 0 
                ? `${totalCount.toLocaleString()} Properties Found`
                : `${properties.length} Properties Found`
              }
            </h3>
            <p>
              {totalCount > 0 
                ? `Showing ${startResult.toLocaleString()} - ${endResult.toLocaleString()} of ${totalCount.toLocaleString()} results for Brantford area`
                : `Showing ${properties.length} results for Brantford area`
              }
            </p>
          </div>
          
          {/* Pagination on the right side of header (desktop only) */}
          <div className="property-results-actions">
            {!isMobile && pagination && totalPages > 1 && onPageChange && (
              <CompactPagination
                currentPage={pageNum}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            )}
          </div>
        </div>
      )}

      {/* Top Pagination - Only for mobile */}
      {isMobile && showPagination && pagination && onPageChange && totalPages > 1 && (
        <div className="property-results-top-pagination mobile-top-pagination">
          <CompactPagination
            currentPage={pageNum}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* Results Grid */}
      <div className="property-results-grid">
        {!properties || properties.length === 0 ? (
          <div className="property-no-results-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <h3>No Properties Found</h3>
            <p>Try adjusting your search criteria or filters to see more results.</p>
          </div>
        ) : (
          properties.map((property, index) => {
            console.log(`Rendering Property ${index}:`, {
              mlsNumber: property.mlsNumber,
              type: property.type,
              class: property.class,
              address: property.address,
              listPrice: property.listPrice,
              images: property.images
            });

            const formattedAddress = formatAddress(property.address);
            const price = property.listPrice || property.price || property.askingPrice;
            
            return (
              <div
                key={property.mlsNumber || property.id || `property-${index}`}
                className="property-listing-card"
                onClick={() => onPropertySelect && onPropertySelect(property)}
              >
                {/* Image Section */}
                <div className="property-listing-image">
                  <img
                    src={getImageUrl(property)}
                    alt={formattedAddress || 'Property'}
                    onError={(e) => {
                      console.log('Image failed to load:', e.target.src);
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgNzVIMTc1VjEyNUgxMjVWNzVaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K';
                    }}
                    onLoad={() => console.log(`Image ${index} loaded successfully`)}
                  />
                  
                  <div className="property-listing-badge">
                    {getPropertyBadge(property)}
                  </div>
                  
                  {/* REMOVED: Heart/favorite button is completely removed */}
                </div>

                {/* Content Section */}
                <div className="property-listing-content">
                  <div className="property-listing-price">
                    ${formatPrice(price)}
                  </div>
                  
                  <div className="property-listing-address">
                    {formattedAddress || 'Address not available'}
                  </div>

                  <div className="property-listing-details">
                    <div className="property-detail-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9,22 9,12 15,12 15,22"></polyline>
                      </svg>
                      <span>{property.details?.numBedrooms || property.beds || 0} bed</span>
                    </div>
                    
                    <div className="property-detail-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                        <rect x="4" y="6" width="16" height="12" rx="2" ry="2"></rect>
                        <circle cx="12" cy="12" r="2"></circle>
                      </svg>
                      <span>{property.details?.numBathrooms || property.baths || 0} bath</span>
                    </div>
                    
                    {(property.details?.sqft || property.sqft || property.squareFootage) && (
                      <div className="property-detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <rect x="7" y="7" width="3" height="3"></rect>
                          <rect x="14" y="7" width="3" height="3"></rect>
                          <rect x="7" y="14" width="3" height="3"></rect>
                          <rect x="14" y="14" width="3" height="3"></rect>
                        </svg>
                        <span>{(property.details?.sqft || property.sqft || property.squareFootage).toLocaleString()} sqft</span>
                      </div>
                    )}
                  </div>

                  <div className="property-listing-footer">
                    <div className="property-listing-actions">
                      <button 
                        className="property-contact-btn"
                        onClick={(e) => handleContactClick(property, e)}
                      >
                        More Info
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Pagination - ALWAYS AT BOTTOM */}
      {showPagination && pagination && onPageChange && totalPages > 1 && (
        <div className={`property-results-bottom-pagination ${isMobile ? 'mobile-bottom-pagination' : 'desktop-bottom-pagination'}`}>
          {/* Show appropriate pagination based on device and view mode */}
          {isMobile || viewMode === 'map' ? (
            <CompactPagination
              currentPage={pageNum}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          ) : (
            <Pagination
              currentPage={pageNum}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={onPageChange}
            />
          )}
        </div>
      )}

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={contactModalOpen}
        onClose={handleCloseContactModal}
        property={selectedPropertyForContact}
      />
    </div>
  );
};

export default PropertyResults;