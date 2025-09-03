import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, SlidersHorizontal, Grid3X3, Map, Check } from 'lucide-react';
import './SearchFilters.css'

const SearchFilters = ({ filters, setFilters, onSearch, viewMode, onViewModeChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  
  // Refs for mobile dropdown positioning
  const priceRef = useRef(null);

  // Price range options
  const priceRanges = [
    { value: '', label: 'Any Price' },
    { value: '0-300000', label: 'Under $300K' },
    { value: '300000-500000', label: '$300K - $500K' },
    { value: '500000-700000', label: '$500K - $700K' },
    { value: '700000-1000000', label: '$700K - $1M' },
    { value: '1000000-1500000', label: '$1M - $1.5M' },
    { value: '1500000-+', label: '$1.5M+' }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container') && !event.target.closest('.advanced-filters')) {
        setShowPriceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdowns on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeAllDropdowns();
        setShowFilters(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Auto-search when filters change (with debounce) - FIXED to prevent spazzing
  useEffect(() => {
    // Only auto-search for query changes, not filter dropdowns
    if (filters.query) {
      const timeoutId = setTimeout(() => {
        onSearch();
      }, 800); // Longer debounce for query

      return () => clearTimeout(timeoutId);
    }
  }, [filters.query, onSearch]);

  // Manual search trigger for dropdown filters (no auto-search)
  const triggerSearch = () => {
    onSearch();
  };

  const closeAllDropdowns = () => {
    setShowPriceDropdown(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    closeAllDropdowns();
    
    // Trigger search immediately for dropdown filters (not query)
    if (key !== 'query') {
      setTimeout(() => {
        triggerSearch();
      }, 100);
    }
  };

  const handleDropdownToggle = (dropdown) => {
    closeAllDropdowns();
    
    switch (dropdown) {
      case 'price':
        setShowPriceDropdown(!showPriceDropdown);
        break;
    }
  };

  const handleDropdownSelection = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    closeAllDropdowns();
    
    // Trigger search immediately for dropdown selections
    setTimeout(() => {
      triggerSearch();
    }, 100);
  };

  const handleSearch = () => {
    onSearch();
    closeAllDropdowns();
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      priceRange: '',
      bedrooms: '',
      bathrooms: '',
    });
    closeAllDropdowns();
  };

  // Count active filters (excluding query)
  const activeFiltersCount = [
    filters.priceRange,
    filters.bedrooms,
    filters.bathrooms,
  ].filter(Boolean).length;

  const MobileDropdown = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    return (
      <div className="dropdown-menu" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()}>
          {title && (
            <div style={{ 
              padding: '16px 24px', 
              borderBottom: '1px solid #f3f4f6',
              fontWeight: '600',
              fontSize: '16px',
              color: '#111827'
            }}>
              {title}
            </div>
          )}
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="modern-search-container">
      <div className="search-bar-wrapper">
        {/* Main Search Input */}
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search by address or MLS"
            value={filters.query || ''}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="main-search-input"
          />
        </div>

        {/* Filter Buttons */}
        <div className="filter-buttons">
          {/* Price Range Dropdown */}
          <div className="dropdown-container" ref={priceRef}>
            <button 
              className="filter-btn"
              onClick={() => handleDropdownToggle('price')}
              aria-expanded={showPriceDropdown}
              aria-haspopup="listbox"
            >
              <span>{priceRanges.find(range => range.value === filters.priceRange)?.label || 'Any Price'}</span>
              <ChevronDown size={16} />
            </button>
            <MobileDropdown 
              isOpen={showPriceDropdown} 
              onClose={() => setShowPriceDropdown(false)}
              title="Price Range"
            >
              {priceRanges.map(range => (
                <div 
                  key={range.value}
                  className={`dropdown-item ${filters.priceRange === range.value ? 'selected' : ''}`}
                  onClick={() => handleDropdownSelection('priceRange', range.value)}
                  role="option"
                  aria-selected={filters.priceRange === range.value}
                >
                  {range.label}
                  {filters.priceRange === range.value && <Check size={16} />}
                </div>
              ))}
            </MobileDropdown>
          </div>

          {/* Filters Button */}
          <button 
            className={`filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-label="Advanced filters"
          >
            <SlidersHorizontal size={16} />
          </button>

          {/* Clear Button */}
          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="clear-btn">
              Clear
            </button>
          )}
        </div>

        {/* View Toggle */}
        <div className="view-controls">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            aria-label="Grid view"
          >
            <Grid3X3 size={16} />
            Grid
          </button>
          <button 
            className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => onViewModeChange('map')}
            aria-label="Map view"
          >
            <Map size={16} />
            Map
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel - Simplified */}
      {showFilters && (
        <div className="advanced-filters" onClick={() => setShowFilters(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div className="filters-section">
              <h3>Filters</h3>
              <button 
                className="close-filters-btn"
                onClick={() => setShowFilters(false)}
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="filters-grid">
              {/* Only Bedrooms and Bathrooms */}
              <div className="filter-row">
                <div className="filter-group">
                  <label>Bedrooms</label>
                  <div className="number-buttons">
                    {['Any', '1+', '2+', '3+', '4+', '5+', '6+'].map(bed => (
                      <button
                        key={bed}
                        className={`number-btn ${filters.bedrooms === bed || (!filters.bedrooms && bed === 'Any') ? 'active' : ''}`}
                        onClick={() => handleFilterChange('bedrooms', bed === 'Any' ? '' : bed)}
                      >
                        {bed}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-group">
                  <label>Bathrooms</label>
                  <div className="number-buttons">
                    {['Any', '1+', '2+', '3+', '4+', '5+', '6+'].map(bath => (
                      <button
                        key={bath}
                        className={`number-btn ${filters.bathrooms === bath || (!filters.bathrooms && bath === 'Any') ? 'active' : ''}`}
                        onClick={() => handleFilterChange('bathrooms', bath === 'Any' ? '' : bath)}
                      >
                        {bath}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="filter-actions">
                <button 
                  className="reset-btn"
                  onClick={() => {
                    clearFilters();
                    setShowFilters(false);
                  }}
                >
                  Reset All
                </button>
                <button 
                  className="submit-btn"
                  onClick={() => {
                    handleSearch();
                    setShowFilters(false);
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile View Toggle - Fixed at bottom center */}
      <div className="mobile-view-toggle">
        <button 
          className={`mobile-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => onViewModeChange('grid')}
          aria-label="Grid view"
        >
          <Grid3X3 size={18} />
        </button>
        <button 
          className={`mobile-view-btn ${viewMode === 'map' ? 'active' : ''}`}
          onClick={() => onViewModeChange('map')}
          aria-label="Map view"
        >
          <Map size={18} />
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;