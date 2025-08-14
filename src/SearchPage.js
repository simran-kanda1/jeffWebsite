// FIXED SearchPage.js with proper total count calculation and map bounds filtering
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from './apiService';
import SearchFilters from './SearchFilters';
import PropertyResults from './PropertyResults';
import GoogleMap from './GoogleMap';
import ContactFormModal from './ContactFormModal';
import aboutPage from './aboutPage.avif'
import './styles.css';

const SearchPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [properties, setProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [displayedProperties, setDisplayedProperties] = useState([]); // NEW: Properties shown in results based on map bounds
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [viewMode, setViewMode] = useState('map');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  
  // NEW: Map bounds filtering state
  const [mapBounds, setMapBounds] = useState(null);
  const [isMapFiltering, setIsMapFiltering] = useState(false);
  const [mapFilterInfo, setMapFilterInfo] = useState(null);
  
  // FIXED: Simplified scroll state management
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollTimeoutRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    numPages: 1,
    pageSize: 100,
    count: 0
  });

  // NEW: Handle map bounds change
  const handleMapBoundsChange = (boundsData) => {
    const { properties: propertiesInBounds, bounds, zoom, totalProperties } = boundsData;
    
    console.log(`🗺️ SearchPage: Map bounds changed`, {
      visibleCount: propertiesInBounds.length,
      totalCount: totalProperties,
      zoom: zoom,
      bounds: bounds,
      viewMode: viewMode,
      windowWidth: window.innerWidth
    });
    
    setMapBounds(bounds);
    setIsMapFiltering(!!bounds && zoom >= 10);
    setMapFilterInfo({
      visibleCount: propertiesInBounds.length,
      totalCount: totalProperties,
      zoom: zoom
    });
    
    // Update displayed properties for desktop map view
    if (window.innerWidth > 768 && viewMode === 'map') {
      console.log(`🗺️ SearchPage: Updating displayed properties from ${displayedProperties.length} to ${propertiesInBounds.length}`);
      setDisplayedProperties(propertiesInBounds);
      
      // Update pagination for filtered results
      const itemsPerPage = 100;
      const totalPages = Math.ceil(propertiesInBounds.length / itemsPerPage);
      
      console.log(`🗺️ SearchPage: Updating pagination`, {
        totalPages: totalPages,
        currentPage: currentPage,
        itemsPerPage: itemsPerPage
      });
      
      setPagination({
        page: currentPage,
        numPages: totalPages,
        pageSize: itemsPerPage,
        count: propertiesInBounds.length
      });
    } else {
      console.log(`🗺️ SearchPage: Not updating displayed properties (mobile or grid mode)`);
    }
  };

  // FIXED: Improved scroll handling for mobile
  useEffect(() => {
    const handleScroll = () => {
      // Only apply on mobile grid view
      if (window.innerWidth <= 768 && viewMode === 'grid') {
        const currentScrollY = window.scrollY;
        const scrollDifference = Math.abs(currentScrollY - lastScrollY);
        
        // Only trigger if scroll difference is significant
        if (scrollDifference < 15) return;
        
        const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Hide filters when scrolling down past threshold
        if (scrollDirection === 'down' && currentScrollY > 100) {
          setFiltersVisible(false);
          // FIXED: Add class to main container for proper spacing
          document.querySelector('.main-container')?.classList.add('filters-hidden');
        } 
        // Show filters when scrolling up or near top
        else if (scrollDirection === 'up' || currentScrollY < 50) {
          setFiltersVisible(true);
          document.querySelector('.main-container')?.classList.remove('filters-hidden');
        }
        
        // Auto-show filters after scroll stops
        scrollTimeoutRef.current = setTimeout(() => {
          setFiltersVisible(true);
          document.querySelector('.main-container')?.classList.remove('filters-hidden');
        }, 2000);
        
        setLastScrollY(currentScrollY);
      }
    };

    // Use passive listener for better performance
    const options = { passive: true };
    window.addEventListener('scroll', handleScroll, options);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, options);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [lastScrollY, viewMode]);

  // Reset filters visibility when view mode changes
  useEffect(() => {
    setFiltersVisible(true);
    setLastScrollY(0);
    document.querySelector('.main-container')?.classList.remove('filters-hidden');
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Reset map filtering when switching to grid mode
    if (viewMode === 'grid') {
      setIsMapFiltering(false);
      setDisplayedProperties(properties);
    }
  }, [viewMode]);

  // FIXED: Enhanced property selection for mobile modal
  const handlePropertySelect = (property) => {
    if (window.innerWidth <= 768 && viewMode === 'map') {
      // Mobile map view - show enhanced bottom modal
      setSelectedProperty(property);
      setShowPropertyModal(true);
      
      // FIXED: Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Desktop or grid view - navigate to details
      if (property.mlsNumber) {
        navigate(`/property/${property.mlsNumber}`);
      }
    }
  };

  const handlePropertyModalClose = () => {
    setShowPropertyModal(false);
    // FIXED: Restore body scroll
    document.body.style.overflow = 'auto';
    setTimeout(() => {
      setSelectedProperty(null);
    }, 300);
  };

  const handlePropertyModalView = () => {
    if (selectedProperty?.mlsNumber) {
      // FIXED: Restore body scroll before navigation
      document.body.style.overflow = 'auto';
      navigate(`/property/${selectedProperty.mlsNumber}`);
    }
  };

  const handlePropertyModalContact = () => {
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
  };

  // Check if any filters are applied
  const checkIfFiltered = (currentFilters) => {
    return !!(
      currentFilters.query ||
      currentFilters.priceRange ||
      currentFilters.bedrooms ||
      currentFilters.bathrooms ||
      currentFilters.propertyType
    );
  };

  // FIXED: Enhanced loadAllPropertiesForMap to return filtered total count
  const loadAllPropertiesForMap = async (currentFilters) => {
    try {
      console.log('🗺️ Loading all properties for map with filters:', currentFilters);
      
      const searchParams = apiService.formatSearchParams(currentFilters);
      let allPropertiesForMap = [];
      
      if (checkIfFiltered(currentFilters)) {
        let page = 1;
        let hasMorePages = true;
        
        while (hasMorePages && page <= 20) {
          try {
            const result = await apiService.searchProperties(searchParams, page, 100);
            
            if (result.listings && result.listings.length > 0) {
              allPropertiesForMap.push(...result.listings);
              
              if (result.pagination && page < result.pagination.numPages) {
                page++;
              } else {
                hasMorePages = false;
              }
            } else {
              hasMorePages = false;
            }
          } catch (pageError) {
            console.warn(`Failed to load page ${page} for map:`, pageError);
            hasMorePages = false;
          }
        }
        
      } else {
        let page = 1;
        let hasMorePages = true;
        
        while (hasMorePages && page <= 20) {
          try {
            const result = await apiService.getBasicListings(page, 100);
            
            if (result.listings && result.listings.length > 0) {
              allPropertiesForMap.push(...result.listings);
              
              if (result.pagination && page < result.pagination.numPages) {
                page++;
              } else {
                hasMorePages = false;
              }
            } else {
              hasMorePages = false;
            }
          } catch (pageError) {
            console.warn(`Failed to load page ${page} for map:`, pageError);
            hasMorePages = false;
          }
        }
      }
      
      // FIXED: Apply the same filtering as processListingsResponse
      const originalCount = allPropertiesForMap.length;
      const filteredProperties = allPropertiesForMap.filter(property => {
        const propertyClass = property.class || '';
        const type = property.type || property.class || '';
        const listPrice = property.listPrice || property.price || 0;
        
        // Filter out commercial properties
        if (propertyClass === 'CommercialProperty') return false;
        if (propertyClass && !['ResidentialProperty', 'CondoProperty'].includes(propertyClass)) return false;
        
        // Filter out lease properties
        if (type.toLowerCase().includes('lease') || 
            type.toLowerCase().includes('rent') ||
            type.toLowerCase().includes('rental')) return false;
        
        // Filter out very low prices
        if (listPrice > 0 && listPrice < 30000) return false;
        
        return true;
      });
      
      console.log(`🗺️ Loaded ${originalCount} total properties, ${filteredProperties.length} after filtering`);
      console.log(`🗺️ Filtered out ${originalCount - filteredProperties.length} properties (${Math.round((originalCount - filteredProperties.length) / originalCount * 100)}%)`);
      
      setAllProperties(filteredProperties);
      
      return { 
        totalCount: filteredProperties.length,
        originalCount: originalCount
      };
      
    } catch (error) {
      console.error('Error loading all properties for map:', error);
      setAllProperties(properties);
      return { totalCount: 0, originalCount: 0 };
    }
  };

  // FIXED: Use the new searchPropertiesWithCorrectCount method
  const handleSearch = async (page = 1, loadAllForMap = true) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    const isCurrentlyFiltered = checkIfFiltered(filters);
    setIsFiltered(isCurrentlyFiltered);
    
    try {
      const searchParams = apiService.formatSearchParams(filters);
      
      console.log('🔍 ENHANCED SEARCH - Using new method with correct total count...');
      
      // FIXED: Use the new method that gets correct total count
      const result = await apiService.searchPropertiesWithCorrectCount(searchParams, page, 100);
      
      console.log('🔍 ENHANCED SEARCH RESULT:', result);
      
      setProperties(result.listings || []);
      setDisplayedProperties(result.listings || []); // Initialize displayed properties
      setPagination(result.pagination);
      setCurrentPage(page);
      
      // Reset map filtering state when new search is performed
      setIsMapFiltering(false);
      setMapBounds(null);
      setMapFilterInfo(null);
      
      // Load properties for map if needed
      if (loadAllForMap) {
        loadAllPropertiesForMap(filters);
      }
      
      console.log(`🔍 SEARCH COMPLETED: Found ${result.pagination.count} total properties (${result.pagination.originalCount} before filtering), showing page ${page}`);
      
    } catch (err) {
      console.error('Search Error:', err);
      setError(err.message);
      setProperties([]);
      setAllProperties([]);
      setDisplayedProperties([]);
      setPagination({
        page: 1,
        numPages: 1,
        pageSize: 100,
        count: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page !== currentPage) {
      setCurrentPage(page);
      
      // If map filtering is active, paginate through filtered results
      if (isMapFiltering && displayedProperties.length > 0) {
        const itemsPerPage = 100;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        // Update pagination
        setPagination(prev => ({
          ...prev,
          page: page
        }));
        
        // Show filters and scroll to top after page change
        setFiltersVisible(true);
        document.querySelector('.main-container')?.classList.remove('filters-hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      // FIXED: For normal page changes, use the regular search
      const searchParams = apiService.formatSearchParams(filters);
      
      setLoading(true);
      apiService.searchProperties(searchParams, page, 100)
        .then(result => {
          setProperties(result.listings || []);
          setDisplayedProperties(result.listings || []);
          // Keep the existing pagination but update the page
          setPagination(prev => ({
            ...prev,
            page: page
          }));
          setCurrentPage(page);
          
          // Show filters and scroll to top after page change
          setFiltersVisible(true);
          document.querySelector('.main-container')?.classList.remove('filters-hidden');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        })
        .catch(err => {
          console.error('Page change error:', err);
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  // Initial load
  useEffect(() => {
    handleSearch(1, true);
  }, []);

  // Update filtered state when filters change
  useEffect(() => {
    setIsFiltered(checkIfFiltered(filters));
  }, [filters]);

  // Auto-search when filters change
  useEffect(() => {
    if (hasSearched) {
      setCurrentPage(1);
      const timeoutId = setTimeout(() => {
        handleSearch(1, true);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [filters.query, filters.priceRange, filters.bedrooms, filters.bathrooms, filters.propertyType]);

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
    return `${price.toLocaleString()}`;
  };

  // Determine which properties to show in results
  const getPropertiesToShow = () => {
    const isDesktopMapView = viewMode === 'map' && window.innerWidth > 768;
    const shouldUseMapFiltering = isDesktopMapView && isMapFiltering;
    
    console.log(`🏠 getPropertiesToShow:`, {
      viewMode,
      windowWidth: window.innerWidth,
      isDesktopMapView,
      isMapFiltering,
      shouldUseMapFiltering,
      displayedPropertiesLength: displayedProperties.length,
      propertiesLength: properties.length,
      currentPage
    });
    
    if (shouldUseMapFiltering) {
      // Desktop map view with map filtering active
      const itemsPerPage = 100;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const result = displayedProperties.slice(startIndex, endIndex);
      
      console.log(`🏠 Using map-filtered properties: ${result.length} (slice ${startIndex}-${endIndex} of ${displayedProperties.length})`);
      return result;
    } else {
      // Grid view or mobile or no map filtering
      console.log(`🏠 Using regular properties: ${properties.length}`);
      return properties;
    }
  };

  return (
    <div className={`main-container ${viewMode === 'grid' ? 'grid-layout' : 'column-layout'}`}>
      {/* FIXED: Search filters with proper visibility control */}
      <div className={`topbar-container ${!filtersVisible && window.innerWidth <= 768 && viewMode === 'grid' ? 'hidden' : ''}`}>
        <SearchFilters
          filters={filters}
          setFilters={setFilters}
          onSearch={() => handleSearch(1, true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        
        {/* NEW: Map filtering indicator for desktop */}
        {viewMode === 'map' && window.innerWidth > 768 && isMapFiltering && mapFilterInfo && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '12px 16px',
            margin: '8px 24px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            color: '#166534'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>
                <strong>{mapFilterInfo.visibleCount.toLocaleString()}</strong> of{' '}
                <strong>{mapFilterInfo.totalCount.toLocaleString()}</strong> properties in map area
              </span>
            </div>
            <button
              onClick={() => {
                setIsMapFiltering(false);
                setDisplayedProperties(properties);
                setMapBounds(null);
                setMapFilterInfo(null);
                setPagination(prev => ({
                  ...prev,
                  count: properties.length,
                  numPages: Math.ceil(properties.length / prev.pageSize)
                }));
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#166534',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline',
                padding: '0'
              }}
            >
              Show all results
            </button>
          </div>
        )}
      </div>
      
      <div className={`search-content-wrapper ${viewMode === 'grid' ? 'grid-mode' : 'map-mode'}`}>
        {/* FIXED: Map container - always show in map mode */}
        {viewMode === 'map' && (
          <div className="map-container">
            <GoogleMap
              center={{ lat: 43.1394, lng: -80.2644 }}
              properties={allProperties}
              isFiltered={isFiltered}
              onPropertySelect={handlePropertySelect}
              onBoundsChange={handleMapBoundsChange}
              enableBoundsFiltering={window.innerWidth > 768} // Only enable on desktop
            />
          </div>
        )}
        
        {/* FIXED: Results container - show based on view mode and device */}
        {hasSearched && (
          viewMode === 'grid' ? (
            // Grid mode: always show results
            <div className="results-container">
              <PropertyResults
                properties={getPropertiesToShow()}
                loading={loading}
                error={error}
                onPropertySelect={handlePropertySelect}
                isHorizontal={false}
                viewMode={viewMode}
                pagination={pagination}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                showPagination={true}
              />
            </div>
          ) : (
            // Map mode: show results on desktop, hide on mobile
            window.innerWidth > 768 && (
              <div className="results-container">
                <PropertyResults
                  properties={getPropertiesToShow()}
                  loading={loading}
                  error={error}
                  onPropertySelect={handlePropertySelect}
                  isHorizontal={false}
                  viewMode={viewMode}
                  pagination={pagination}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  showPagination={true}
                />
              </div>
            )
          )
        )}
      </div>

      {/* FIXED: Enhanced Mobile Property Modal */}
      {showPropertyModal && selectedProperty && (
        <div className={`mobile-property-modal ${showPropertyModal ? 'show' : ''}`}>
          <div className="mobile-property-modal-backdrop" onClick={handlePropertyModalClose} />
          <div className="mobile-property-modal-content">
            <div className="mobile-property-modal-header">
              <div className="modal-drag-handle" onClick={handlePropertyModalClose} />
            </div>
            
            <div className="mobile-property-modal-body">
              {/* Property Image */}
              {selectedProperty.images && selectedProperty.images[0] && (
                <div className="modal-property-image">
                  <img 
                    src={`https://cdn.repliers.io/${selectedProperty.images[0]}`}
                    alt="Property"
                  />
                  <div className="modal-property-badge">For Sale</div>
                  <button className="modal-property-favorite">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>
              )}
              
              <div className="modal-property-info">
                {/* Price Section */}
                <div className="modal-property-price-section">
                  <div className="modal-property-price">
                    {formatPrice(selectedProperty.listPrice || selectedProperty.price)}
                  </div>
                  <div className="modal-property-price-subtext">
                    Listed Price
                  </div>
                </div>
                
                {/* Address Section */}
                <div className="modal-property-address-section">
                  <div className="modal-property-address">
                    {formatAddress(selectedProperty.address)}
                  </div>
                  <div className="modal-property-neighborhood">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {selectedProperty.address?.city}, {selectedProperty.address?.state}
                  </div>
                </div>
                
                {/* Property Stats */}
                <div className="modal-property-stats">
                  <div className="modal-stat-item">
                    <div className="modal-stat-number">{selectedProperty.details?.numBedrooms || 0}</div>
                    <div className="modal-stat-label">Beds</div>
                  </div>
                  <div className="modal-stat-item">
                    <div className="modal-stat-number">{selectedProperty.details?.numBathrooms || 0}</div>
                    <div className="modal-stat-label">Baths</div>
                  </div>
                  {selectedProperty.details?.sqft && (
                    <div className="modal-stat-item">
                      <div className="modal-stat-number">{selectedProperty.details.sqft.toLocaleString()}</div>
                      <div className="modal-stat-label">Sq Ft</div>
                    </div>
                  )}
                  <div className="modal-stat-item">
                    <div className="modal-stat-number">{selectedProperty.details?.propertyType || 'N/A'}</div>
                    <div className="modal-stat-label">Type</div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="modal-property-actions">
                  <button 
                    className="modal-contact-btn"
                    onClick={handlePropertyModalContact}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    Contact
                  </button>
                  <button 
                    className="modal-view-btn"
                    onClick={handlePropertyModalView}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    View Details
                  </button>
                </div>
              </div>
              
              {/* Agent Info */}
              <div className="modal-agent-info">
                <div className="modal-agent-content">
                  <div className="modal-agent-avatar">
                    <img src={aboutPage} alt="Jeff Thibodeau" />
                  </div>
                  <div className="modal-agent-details">
                    <h4>Jeff Thibodeau</h4>
                    <p>Licensed Real Estate Broker</p>
                  </div>
                </div>
                <div className="modal-agent-contact">
                  <a href="tel:519-861-1385" className="modal-agent-phone">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    Call
                  </a>
                  <a href="mailto:jt@jeffthibodeau.me" className="modal-agent-email">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={contactModalOpen}
        onClose={handleCloseContactModal}
        property={selectedProperty}
      />
    </div>
  );
};

export default SearchPage;