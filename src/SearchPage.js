// Search Page Component - Updated to load all properties for map while paginating results
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from './apiService';
import SearchFilters from './SearchFilters';
import PropertyResults from './PropertyResults';
import GoogleMap from './GoogleMap';
import Pagination from './Pagination';
import './styles.css';

const SearchPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [properties, setProperties] = useState([]); // Current page properties
  const [allProperties, setAllProperties] = useState([]); // All properties for map
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [viewMode, setViewMode] = useState('map');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    numPages: 1,
    pageSize: 100,
    count: 0
  });

  // Handle property selection - navigate to property details
  const handlePropertySelect = (property) => {
    if (property.mlsNumber) {
      navigate(`/property/${property.mlsNumber}`);
    }
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

  // Load all properties for map display
  const loadAllPropertiesForMap = async (currentFilters) => {
    try {
      console.log('Loading all properties for map with filters:', currentFilters);
      
      // Convert filters to the correct format for the API
      const searchParams = apiService.formatSearchParams(currentFilters);
      
      // If we have filters, we need to load all pages with those filters
      if (checkIfFiltered(currentFilters)) {
        const allPropertiesForMap = [];
        let page = 1;
        let hasMorePages = true;
        
        // Load up to 20 pages (2000 properties) to avoid infinite loops
        while (hasMorePages && page <= 20) {
          try {
            const result = await apiService.searchProperties(searchParams, page, 100);
            
            if (result.listings && result.listings.length > 0) {
              allPropertiesForMap.push(...result.listings);
              
              // Check if there are more pages
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
        
        console.log(`Loaded ${allPropertiesForMap.length} total properties for map`);
        setAllProperties(allPropertiesForMap);
        
      } else {
        // No filters - load basic listings for map (multiple pages)
        const allPropertiesForMap = [];
        let page = 1;
        let hasMorePages = true;
        
        // Load up to 20 pages (2000 properties) to avoid infinite loops
        while (hasMorePages && page <= 20) {
          try {
            const result = await apiService.getBasicListings(page, 100);
            
            if (result.listings && result.listings.length > 0) {
              allPropertiesForMap.push(...result.listings);
              
              // Check if there are more pages
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
        
        console.log(`Loaded ${allPropertiesForMap.length} total basic properties for map`);
        setAllProperties(allPropertiesForMap);
      }
      
    } catch (error) {
      console.error('Error loading all properties for map:', error);
      // If we can't load all properties, use current page properties as fallback
      setAllProperties(properties);
    }
  };

  const handleSearch = async (page = 1, loadAllForMap = true) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    // Update filtered state based on current filters
    const isCurrentlyFiltered = checkIfFiltered(filters);
    setIsFiltered(isCurrentlyFiltered);
    
    try {
      // Convert filters to the correct format for the API
      const searchParams = apiService.formatSearchParams(filters);
      
      // Log the search parameters for debugging
      console.log('Search Parameters:', searchParams, 'Page:', page);
      console.log('Original Filters:', filters);
      console.log('Is Filtered:', isCurrentlyFiltered);
      
      // Call API with pagination parameters for current page
      const result = await apiService.searchProperties(searchParams, page, 100);
      
      // Log the API response for debugging
      console.log('API Response:', result);
      
      // Set properties for current page and pagination info
      setProperties(result.listings || []);
      
      // Calculate total pagination info
      let totalPagination = result.pagination || {
        page: page,
        numPages: 1,
        pageSize: 100,
        count: result.listings ? result.listings.length : 0
      };
      
      // If this is the first page or filters changed, load all properties for map
      if (loadAllForMap) {
        // Load all properties for map in background
        loadAllPropertiesForMap(filters);
        
        // For pagination display, we need to know the total count
        // If we have pagination info from API, use it; otherwise estimate
        if (!totalPagination.count && result.listings) {
          totalPagination.count = result.listings.length;
        }
      }
      
      setPagination(totalPagination);
      setCurrentPage(page);
      
      // Log success message
      console.log(`Search completed: Found ${totalPagination.count || 0} total properties, showing page ${page}`);
      
    } catch (err) {
      console.error('Search Error:', err);
      setError(err.message);
      setProperties([]);
      setAllProperties([]);
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
      // Don't reload all properties for map when just changing pages
      handleSearch(page, false);
      
      // Scroll to top of results
      const resultsContainer = document.querySelector('.results-container');
      if (resultsContainer) {
        resultsContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Initial load - get first page and all properties for map
  useEffect(() => {
    handleSearch(1, true);
  }, []);

  // Update filtered state when filters change
  useEffect(() => {
    setIsFiltered(checkIfFiltered(filters));
  }, [filters]);

  // Auto-search when filters change (reset to page 1 and reload all for map)
  useEffect(() => {
    if (hasSearched) {
      // Reset to page 1 when filters change
      setCurrentPage(1);
      // Add a small delay to prevent too many API calls
      const timeoutId = setTimeout(() => {
        handleSearch(1, true); // Reload all properties for map when filters change
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [filters.query, filters.priceRange, filters.bedrooms, filters.bathrooms, filters.propertyType]);

  return (
    <div className={`main-container ${viewMode === 'grid' ? 'grid-layout' : 'column-layout'}`}>
      <div className="topbar-container">
        <SearchFilters
          filters={filters}
          setFilters={setFilters}
          onSearch={() => handleSearch(1, true)} // Always search from page 1 and reload all for map when using search button
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>
      
      <div className={`search-content-wrapper ${viewMode === 'grid' ? 'grid-mode' : 'map-mode'}`}>
        {viewMode === 'map' && (
          <div className="map-container">
            <GoogleMap
              center={{ lat: 43.1394, lng: -80.2644 }}
              properties={allProperties} // Use all properties for map, not just current page
              isFiltered={isFiltered}
            />
          </div>
        )}
        
        {hasSearched && (
          <div className="results-container">
            <PropertyResults
              properties={properties} // Use current page properties for results
              loading={loading}
              error={error}
              onPropertySelect={handlePropertySelect}
              isHorizontal={false}
              viewMode={viewMode}
              pagination={{
                ...pagination,
                count: allProperties.length > 0 ? allProperties.length : pagination.count // Show total count from all properties
              }}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;