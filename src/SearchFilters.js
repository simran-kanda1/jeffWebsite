import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, SlidersHorizontal, Grid3X3, Map, Check } from 'lucide-react';
import './SearchFilters.css'

const SearchFilters = ({ filters, setFilters, onSearch, viewMode, onViewModeChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showForSaleDropdown, setShowForSaleDropdown] = useState(false);
  const [showActiveDropdown, setShowActiveDropdown] = useState(false);
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  
  // Refs for mobile dropdown positioning
  const forSaleRef = useRef(null);
  const propertyTypeRef = useRef(null);
  const priceRef = useRef(null);
  const activeRef = useRef(null);

  // FIXED: Remove body scroll management - let natural scroll work
  // Only close dropdowns on outside click, don't prevent body scroll
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close all dropdowns if clicking outside
      if (!event.target.closest('.dropdown-container') && !event.target.closest('.advanced-filters')) {
        setShowForSaleDropdown(false);
        setShowActiveDropdown(false);
        setShowPropertyTypeDropdown(false);
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

  // Auto-search when filters change (with debounce)
  useEffect(() => {
    const hasActiveFilters = filters.priceRange || filters.bedrooms || filters.bathrooms || filters.propertyType;
    if (hasActiveFilters) {
      const timeoutId = setTimeout(() => {
        if (onSearch) {
          onSearch();
        }
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [filters.priceRange, filters.bedrooms, filters.bathrooms, filters.propertyType]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch();
    }
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      priceRange: '',
      bedrooms: '',
      bathrooms: '',
      propertyType: '',
      forSale: 'For Sale',
      activeStatus: 'Active'
    });
  };

  // Close all dropdowns when opening a new one
  const closeAllDropdowns = () => {
    setShowForSaleDropdown(false);
    setShowActiveDropdown(false);
    setShowPropertyTypeDropdown(false);
    setShowPriceDropdown(false);
  };

  const handleDropdownToggle = (dropdownType) => {
    closeAllDropdowns();
    
    switch (dropdownType) {
      case 'forSale':
        setShowForSaleDropdown(true);
        break;
      case 'active':
        setShowActiveDropdown(true);
        break;
      case 'propertyType':
        setShowPropertyTypeDropdown(true);
        break;
      case 'price':
        setShowPriceDropdown(true);
        break;
      default:
        break;
    }
  };

  // Handle dropdown item selection with proper mobile behavior
  const handleDropdownSelection = (dropdownType, value) => {
    switch (dropdownType) {
      case 'forSale':
        handleFilterChange('forSale', value);
        setShowForSaleDropdown(false);
        break;
      case 'active':
        handleFilterChange('activeStatus', value);
        setShowActiveDropdown(false);
        break;
      case 'propertyType':
        handleFilterChange('propertyType', value);
        setShowPropertyTypeDropdown(false);
        break;
      case 'price':
        handleFilterChange('priceRange', value);
        setShowPriceDropdown(false);
        break;
      default:
        break;
    }
  };

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
    value && value !== '' && key !== 'forSale' && key !== 'activeStatus'
  ).length;

  const forSaleOptions = [
    { value: 'For Sale', label: 'For Sale' },
    { value: 'For Rent', label: 'For Rent' },
    { value: 'Sold', label: 'Sold' }
  ];

  const activeOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'All', label: 'All' },
    { value: 'Last day', label: 'Last day' },
    { value: 'Last 3 days', label: 'Last 3 days' },
    { value: 'Last 7 days', label: 'Last 7 days' },
    { value: 'Last 14 days', label: 'Last 14 days' },
    { value: 'Last 30 days', label: 'Last 30 days' },
    { value: 'Last 90 days', label: 'Last 90 days' },
    { value: 'Last 180 days', label: 'Last 180 days' },
    { value: 'Last 360 days', label: 'Last 360 days' }
  ];

  const propertyTypes = [
    { value: 'detached', label: 'Detached', icon: '🏠' },
    { value: 'semi-detached', label: 'Semi-detached', icon: '🏘️' },
    { value: 'townhouse', label: 'Townhouse', icon: '🏬' },
    { value: 'low-rise-condo', label: 'Low rise condo', icon: '🏢' },
    { value: 'high-rise-condo', label: 'High rise condo', icon: '🏗️' }
  ];

  const priceRanges = [
    { value: '0-300000', label: 'Under $300K' },
    { value: '300000-500000', label: '$300K - $500K' },
    { value: '500000-700000', label: '$500K - $700K' },
    { value: '700000-1000000', label: '$700K - $1M' },
    { value: '1000000-1500000', label: '$1M - $1.5M' },
    { value: '1500000-2000000', label: '$1.5M - $2M' },
    { value: '2000000-999999999', label: '$2M+' }
  ];

  // FIXED: Mobile dropdown component without body scroll prevention
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
          {/* For Sale Dropdown */}
          <div className="dropdown-container" ref={forSaleRef}>
            <button 
              className="filter-btn"
              onClick={() => handleDropdownToggle('forSale')}
              aria-expanded={showForSaleDropdown}
              aria-haspopup="listbox"
            >
              <span>{filters.forSale || 'For Sale'}</span>
              <ChevronDown size={16} />
            </button>
            <MobileDropdown 
              isOpen={showForSaleDropdown} 
              onClose={() => setShowForSaleDropdown(false)}
              title="Listing Type"
            >
              {forSaleOptions.map(option => (
                <div 
                  key={option.value}
                  className={`dropdown-item ${(filters.forSale || 'For Sale') === option.value ? 'selected' : ''}`}
                  onClick={() => handleDropdownSelection('forSale', option.value)}
                  role="option"
                  aria-selected={(filters.forSale || 'For Sale') === option.value}
                >
                  {option.label}
                  {(filters.forSale || 'For Sale') === option.value && <Check size={16} />}
                </div>
              ))}
            </MobileDropdown>
          </div>

          {/* Active Status Buttons */}
          <div className="status-buttons">
            <button 
              className={`status-btn ${(filters.activeStatus || 'Active') === 'Active' ? 'active' : ''}`}
              onClick={() => handleFilterChange('activeStatus', 'Active')}
            >
              Active
            </button>
            <div className="dropdown-container" ref={activeRef}>
              <button 
                className={`status-btn dropdown-btn ${(filters.activeStatus || 'Active') === 'All' ? 'active' : ''}`}
                onClick={() => handleDropdownToggle('active')}
                aria-expanded={showActiveDropdown}
                aria-haspopup="listbox"
              >
                All
                <ChevronDown size={14} />
              </button>
              <MobileDropdown 
                isOpen={showActiveDropdown} 
                onClose={() => setShowActiveDropdown(false)}
                title="Listing Status"
              >
                {activeOptions.map(option => (
                  <div 
                    key={option.value}
                    className={`dropdown-item ${(filters.activeStatus || 'Active') === option.value ? 'selected' : ''}`}
                    onClick={() => handleDropdownSelection('active', option.value)}
                    role="option"
                    aria-selected={(filters.activeStatus || 'Active') === option.value}
                  >
                    {option.label}
                    {(filters.activeStatus || 'Active') === option.value && <Check size={16} />}
                  </div>
                ))}
              </MobileDropdown>
            </div>
          </div>

          {/* Sold Button */}
          <button 
            className={`filter-btn ${filters.forSale === 'Sold' ? 'active' : ''}`}
            onClick={() => handleFilterChange('forSale', 'Sold')}
          >
            <span>Sold</span>
          </button>

          {/* Property Type Dropdown */}
          <div className="dropdown-container" ref={propertyTypeRef}>
            <button 
              className="filter-btn"
              onClick={() => handleDropdownToggle('propertyType')}
              aria-expanded={showPropertyTypeDropdown}
              aria-haspopup="listbox"
            >
              <span>{filters.propertyType ? propertyTypes.find(p => p.value === filters.propertyType)?.label : 'Property type'}</span>
              <ChevronDown size={16} />
            </button>
            <MobileDropdown 
              isOpen={showPropertyTypeDropdown} 
              onClose={() => setShowPropertyTypeDropdown(false)}
              title="Property Type"
            >
              {propertyTypes.map(type => (
                <div 
                  key={type.value}
                  className={`dropdown-item property-type-item ${filters.propertyType === type.value ? 'selected' : ''}`}
                  onClick={() => handleDropdownSelection('propertyType', type.value)}
                  role="option"
                  aria-selected={filters.propertyType === type.value}
                >
                  <span className="property-icon">{type.icon}</span>
                  <span>{type.label}</span>
                  {filters.propertyType === type.value && <Check size={16} />}
                </div>
              ))}
            </MobileDropdown>
          </div>

          {/* Price Range Dropdown */}
          <div className="dropdown-container" ref={priceRef}>
            <button 
              className="filter-btn"
              onClick={() => handleDropdownToggle('price')}
              aria-expanded={showPriceDropdown}
              aria-haspopup="listbox"
            >
              <span>{filters.priceRange ? priceRanges.find(p => p.value === filters.priceRange)?.label : 'Any price range'}</span>
              <ChevronDown size={16} />
            </button>
            <MobileDropdown 
              isOpen={showPriceDropdown} 
              onClose={() => setShowPriceDropdown(false)}
              title="Price Range"
            >
              <div 
                className={`dropdown-item ${!filters.priceRange ? 'selected' : ''}`}
                onClick={() => handleDropdownSelection('price', '')}
                role="option"
                aria-selected={!filters.priceRange}
              >
                Any price range
                {!filters.priceRange && <Check size={16} />}
              </div>
              {priceRanges.map(range => (
                <div 
                  key={range.value}
                  className={`dropdown-item ${filters.priceRange === range.value ? 'selected' : ''}`}
                  onClick={() => handleDropdownSelection('price', range.value)}
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

      {/* FIXED: Advanced Filters Panel without body scroll prevention */}
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
              <div className="filter-row">
                <div className="filter-group">
                  <label>Internal sqft</label>
                  <div className="range-inputs">
                    <input
                      type="number"
                      placeholder="no min"
                      value={filters.sqftMin || ''}
                      onChange={(e) => handleFilterChange('sqftMin', e.target.value)}
                      className="range-input"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="no max"
                      value={filters.sqftMax || ''}
                      onChange={(e) => handleFilterChange('sqftMax', e.target.value)}
                      className="range-input"
                    />
                  </div>
                </div>
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
              </div>

              <div className="filter-row">
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
                <div className="filter-group">
                  <label>Garage/Covered parking</label>
                  <div className="number-buttons">
                    {['Any', '1+', '2+', '3+', '4+', '5+', '6+'].map(parking => (
                      <button
                        key={parking}
                        className={`number-btn ${filters.parking === parking || (!filters.parking && parking === 'Any') ? 'active' : ''}`}
                        onClick={() => handleFilterChange('parking', parking === 'Any' ? '' : parking)}
                      >
                        {parking}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="filter-row">
                <div className="filter-group">
                  <label>Basement</label>
                  <div className="checkbox-buttons">
                    {['Finished', 'Partly Finished', 'Sep Entrance'].map(basement => (
                      <button
                        key={basement}
                        className={`checkbox-btn ${filters.basement === basement ? 'active' : ''}`}
                        onClick={() => handleFilterChange('basement', filters.basement === basement ? '' : basement)}
                      >
                        {basement}
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
                  Submit
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