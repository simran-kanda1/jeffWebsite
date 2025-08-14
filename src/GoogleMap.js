import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import formatAddress from './format/formatAddress';
import apiService from './apiService';

const GoogleMap = ({ 
  center = { lat: parseFloat(process.env.REACT_APP_DEFAULT_LAT) || 43.1394, lng: parseFloat(process.env.REACT_APP_DEFAULT_LNG) || -80.2644 }, 
  properties = [], 
  isFiltered = false,
  onPropertySelect,
  onBoundsChange, // NEW: Callback for when map bounds change
  enableBoundsFiltering = true // NEW: Toggle for bounds filtering
}) => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const markerClustererRef = useRef(null);
  const infoWindowRef = useRef(null);
  const boundsChangeTimeoutRef = useRef(null);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || 'https://cdn.repliers.io/';
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  // Company color palette
  const colors = {
    cobalt: '#050E3D',
    onyx: '#1D1D1D',
    slate: '#615B56',
    seaglass: '#BFDDDB',
    white: '#FFFFFF'
  };

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load all properties when component mounts (only if not filtered)
  useEffect(() => {
    const loadAllProperties = async () => {
      if (!isFiltered && properties.length === 0) {
        try {
          setLoading(true);
          const promises = [];
          for (let page = 1; page <= 12; page++) {
            promises.push(apiService.getBasicListings(page, 100));
          }
          
          const results = await Promise.all(promises);
          const allListings = results.flatMap(result => result.listings || []);
          setAllProperties(allListings);
        } catch (error) {
          console.error('Error loading all properties for map:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadAllProperties();
  }, [isFiltered, properties.length]);

  // NEW: Function to check if a point is within map bounds
  const isPropertyInBounds = (property, bounds) => {
    if (!bounds || !googleMapRef.current) return true;
    
    let lat = null;
    let lng = null;
    
    // Try different coordinate formats
    if (property.map?.latitude && property.map?.longitude) {
      lat = parseFloat(property.map.latitude);
      lng = parseFloat(property.map.longitude);
    } else if (property.latitude && property.longitude) {
      lat = parseFloat(property.latitude);
      lng = parseFloat(property.longitude);
    } else if (property.lat && property.lng) {
      lat = parseFloat(property.lat);
      lng = parseFloat(property.lng);
    } else if (property.coordinates) {
      lat = parseFloat(property.coordinates.lat || property.coordinates.latitude);
      lng = parseFloat(property.coordinates.lng || property.coordinates.longitude);
    } else if (property.location) {
      lat = parseFloat(property.location.lat || property.location.latitude);
      lng = parseFloat(property.location.lng || property.location.longitude);
    }
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      return false;
    }
    
    // Check if coordinates are within reasonable bounds for Brantford area
    if (lat < 42.5 || lat > 44.5 || lng < -81.5 || lng > -79.5) {
      return false;
    }
    
    return bounds.contains(new window.google.maps.LatLng(lat, lng));
  };

  // NEW: Handle map bounds change with debouncing
  const handleBoundsChanged = () => {
    console.log('🗺️ handleBoundsChanged called', {
      hasMap: !!googleMapRef.current,
      enableBoundsFiltering,
      hasCallback: !!onBoundsChange,
      isMapReady
    });

    if (!googleMapRef.current || !enableBoundsFiltering || !onBoundsChange || !isMapReady) {
      console.log('🗺️ Bounds change handler: conditions not met');
      return;
    }

    // Clear existing timeout
    if (boundsChangeTimeoutRef.current) {
      clearTimeout(boundsChangeTimeoutRef.current);
    }

    // Debounce the bounds change to avoid too many API calls
    boundsChangeTimeoutRef.current = setTimeout(() => {
      try {
        const bounds = googleMapRef.current.getBounds();
        const zoom = googleMapRef.current.getZoom();
        
        console.log('🗺️ Processing bounds change:', { zoom, hasBounds: !!bounds });
        
        if (!bounds) {
          console.log('🗺️ No bounds available');
          return;
        }
        
        const propertiesToShow = isFiltered ? properties : allProperties;
        console.log('🗺️ Total properties to filter:', propertiesToShow.length);
        
        if (zoom >= 10) { // Only filter when zoomed in enough
          const propertiesInBounds = propertiesToShow.filter(property => 
            isPropertyInBounds(property, bounds)
          );
          
          console.log(`🗺️ Map bounds changed: ${propertiesInBounds.length} properties in view (zoom: ${zoom})`);
          
          // Call the callback with filtered properties
          onBoundsChange({
            properties: propertiesInBounds,
            bounds: {
              north: bounds.getNorthEast().lat(),
              south: bounds.getSouthWest().lat(),
              east: bounds.getNorthEast().lng(),
              west: bounds.getSouthWest().lng()
            },
            zoom: zoom,
            totalProperties: propertiesToShow.length
          });
        } else {
          console.log(`🗺️ Zoom level ${zoom} too low, showing all properties`);
          // If zoomed out too far, show all properties
          const allPropertiesToShow = isFiltered ? properties : allProperties;
          onBoundsChange({
            properties: allPropertiesToShow,
            bounds: null,
            zoom: zoom,
            totalProperties: allPropertiesToShow.length
          });
        }
      } catch (error) {
        console.error('🗺️ Error in bounds change handler:', error);
      }
    }, 300); // Reduced debounce time for more responsive updates
  };

  // Custom marker icon for individual properties
  const createPropertyMarker = (price) => {
    const formattedPrice = formatPriceForMarker(price);
    const width = isMobile ? 80 : 90;
    const height = isMobile ? 28 : 32;
    const fontSize = isMobile ? 12 : 13;
    
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="${width-2}" height="${height-2}" rx="15" fill="${colors.cobalt}" stroke="${colors.white}" stroke-width="2"/>
          <text x="${width/2}" y="${height/2 + 4}" text-anchor="middle" fill="${colors.white}" font-size="${fontSize}" font-weight="600" font-family="Arial, sans-serif">${formattedPrice}</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(width, height),
      anchor: new window.google.maps.Point(width/2, height/2)
    };
  };

  // Better price formatting for markers
  const formatPriceForMarker = (price) => {
    if (!price || price === 0) return '$--';
    
    if (price >= 1000000) {
      const millions = price / 1000000;
      return `$${millions.toFixed(1)}M`;
    } else if (price >= 1000) {
      const thousands = price / 1000;
      return `$${Math.round(thousands)}K`;
    } else {
      return `$${Math.round(price)}`;
    }
  };

  // Format price for display in popup
  const formatPrice = (price) => {
    if (!price || price === 0) return 'Price on request';
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get image URL
  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    return `${IMAGE_BASE_URL}${imageName}`;
  };

  // Custom cluster marker
  const createClusterMarker = (count) => {
    const size = count < 10 ? (isMobile ? 35 : 40) : count < 100 ? (isMobile ? 45 : 50) : (isMobile ? 55 : 60);
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${colors.cobalt}" stroke="${colors.white}" stroke-width="2"/>
          <text x="${size/2}" y="${size/2 + 5}" text-anchor="middle" fill="${colors.white}" font-size="14" font-weight="600" font-family="Arial, sans-serif">${count}</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size/2, size/2)
    };
  };

  // Handle property click from info window
  const handlePropertyClick = (property) => {
    if (isMobile && onPropertySelect) {
      // On mobile, use the callback to show modal
      onPropertySelect(property);
    } else if (property.mlsNumber) {
      // On desktop, navigate directly
      navigate(`/property/${property.mlsNumber}`);
    }
  };

  useEffect(() => {
    // Validate Google Maps API key
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is not set. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your environment variables.');
      return;
    }

    // Load Google Maps API and MarkerClusterer
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        // Load MarkerClusterer
        const clustererScript = document.createElement('script');
        clustererScript.src = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
        clustererScript.onload = initializeMap;
        document.head.appendChild(clustererScript);
      };
    } else if (window.markerClusterer) {
      initializeMap();
    } else {
      // Load MarkerClusterer if Google Maps is already loaded
      const clustererScript = document.createElement('script');
      clustererScript.src = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
      clustererScript.onload = initializeMap;
      document.head.appendChild(clustererScript);
    }

    function initializeMap() {
      if (window.google && mapRef.current && !googleMapRef.current) {
        googleMapRef.current = new window.google.maps.Map(mapRef.current, {
          center: center,
          zoom: isMobile ? 11 : 12,
          styles: [
            {
              "featureType": "poi.park",
              "elementType": "geometry",
              "stylers": [
                {
                  "color": "#BFDDDB"
                }
              ]
            },
            {
              "featureType": "landscape.natural",
              "elementType": "geometry",
              "stylers": [
                {
                  "color": "#e8f4f8"
                }
              ]
            },
            {
              "featureType": "water",
              "elementType": "geometry",
              "stylers": [
                {
                  "color": "#81d4fa"
                }
              ]
            },
            {
              "featureType": "road",
              "elementType": "geometry.fill",
              "stylers": [
                {
                  "color": colors.white
                }
              ]
            },
            {
              "featureType": "road",
              "elementType": "geometry.stroke",
              "stylers": [
                {
                  "color": "#e0e0e0"
                },
                {
                  "weight": 1
                }
              ]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry.fill",
              "stylers": [
                {
                  "color": "#ffcc80"
                }
              ]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry.stroke",
              "stylers": [
                {
                  "color": "#ff9800"
                },
                {
                  "weight": 1
                }
              ]
            },
            {
              "elementType": "labels.text.fill",
              "stylers": [
                {
                  "color": "#424242"
                }
              ]
            },
            {
              "elementType": "labels.text.stroke",
              "stylers": [
                {
                  "color": colors.white
                },
                {
                  "weight": 2
                }
              ]
            },
            {
              "featureType": "poi",
              "elementType": "labels.icon",
              "stylers": [
                {
                  "visibility": "off"
                }
              ]
            }
          ],
          // Mobile-specific map options
          gestureHandling: isMobile ? 'cooperative' : 'auto',
          zoomControl: !isMobile,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: !isMobile
        });
        
        // Create a single info window to reuse
        infoWindowRef.current = new window.google.maps.InfoWindow();
        
        // Create a single info window to reuse
        infoWindowRef.current = new window.google.maps.InfoWindow();
        
        // Mark map as ready
        setIsMapReady(true);
        
        // Add markers after map is initialized
        addMarkersWithClustering();
        
        // NEW: Add bounds change listener for desktop only - AFTER map is fully initialized
        if (!isMobile && enableBoundsFiltering && onBoundsChange) {
          console.log('🗺️ Setting up bounds change listeners...');
          
          // Use idle event to ensure map is fully loaded before adding listeners
          const idleListener = googleMapRef.current.addListener('idle', () => {
            console.log('🗺️ Map is idle, adding bounds change listeners');
            
            // Remove the idle listener since we only need it once
            window.google.maps.event.removeListener(idleListener);
            
            // Add the actual bounds change listeners
            googleMapRef.current.addListener('bounds_changed', () => {
              console.log('🗺️ bounds_changed event fired');
              handleBoundsChanged();
            });
            
            googleMapRef.current.addListener('zoom_changed', () => {
              console.log('🗺️ zoom_changed event fired');
              handleBoundsChanged();
            });
            
            googleMapRef.current.addListener('dragend', () => {
              console.log('🗺️ dragend event fired');
              handleBoundsChanged();
            });
            
            // Call initial bounds change
            setTimeout(() => {
              console.log('🗺️ Calling initial handleBoundsChanged');
              handleBoundsChanged();
            }, 500);
          });
        }
      }
    }
  }, [GOOGLE_MAPS_API_KEY, isMobile, enableBoundsFiltering]);

  const addMarkersWithClustering = () => {
    if (googleMapRef.current) {
      // Determine which properties to show on map
      const propertiesToShow = isFiltered ? properties : (allProperties.length > 0 ? allProperties : properties);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Processing ${propertiesToShow.length} properties for markers (isFiltered: ${isFiltered})`);
      }
      
      // Clear existing markers and clusterer
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
      }
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      
      let validMarkers = 0;
      let invalidMarkers = 0;
      
      // Create markers
      propertiesToShow.forEach((property, index) => {
        let lat = null;
        let lng = null;
        
        // Try different coordinate formats
        if (property.map?.latitude && property.map?.longitude) {
          lat = parseFloat(property.map.latitude);
          lng = parseFloat(property.map.longitude);
        } else if (property.latitude && property.longitude) {
          lat = parseFloat(property.latitude);
          lng = parseFloat(property.longitude);
        } else if (property.lat && property.lng) {
          lat = parseFloat(property.lat);
          lng = parseFloat(property.lng);
        } else if (property.coordinates) {
          lat = parseFloat(property.coordinates.lat || property.coordinates.latitude);
          lng = parseFloat(property.coordinates.lng || property.coordinates.longitude);
        } else if (property.location) {
          lat = parseFloat(property.location.lat || property.location.latitude);
          lng = parseFloat(property.location.lng || property.location.longitude);
        }
        
        // Validate coordinates
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          // Further validate that coordinates are within reasonable bounds for Brantford area
          if (lat >= 42.5 && lat <= 44.5 && lng >= -81.5 && lng <= -79.5) {
            validMarkers++;
            
            const formattedAddress = formatAddress(property.address);
            const price = property.price || property.listPrice || property.askingPrice;
            
            const marker = new window.google.maps.Marker({
              position: { lat: lat, lng: lng },
              title: formattedAddress,
              icon: createPropertyMarker(price)
            });

            // Create improved info window content - mobile optimized
            const imageUrl = property.images?.[0] ? getImageUrl(property.images[0]) : null;
            const maxWidth = isMobile ? 280 : 300;
            const imageHeight = isMobile ? 140 : 160;
            
            const infoWindowContent = `
              <div style="
                padding: 0;
                max-width: ${maxWidth}px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                background: ${colors.white};
              ">
                ${imageUrl ? `
                  <div style="
                    width: 100%;
                    height: ${imageHeight}px;
                    background-image: url('${imageUrl}');
                    background-size: cover;
                    background-position: center;
                    position: relative;
                  ">
                    <div style="
                      position: absolute;
                      top: 12px;
                      left: 12px;
                      background: ${colors.cobalt};
                      color: ${colors.white};
                      padding: 4px 8px;
                      border-radius: 4px;
                      font-size: 11px;
                      font-weight: 600;
                      text-transform: uppercase;
                    ">
                      For Sale
                    </div>
                  </div>
                ` : ''}
                <div style="padding: ${isMobile ? '12px' : '16px'};">
                  <div style="
                    font-size: ${isMobile ? '16px' : '18px'};
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 4px;
                    line-height: 1.2;
                  ">
                    ${formatPrice(price)}
                  </div>
                  <div style="
                    font-size: ${isMobile ? '13px' : '14px'};
                    color: #6b7280;
                    margin-bottom: 12px;
                    line-height: 1.4;
                  ">
                    ${formattedAddress}
                  </div>
                  <div style="
                    display: flex;
                    gap: ${isMobile ? '12px' : '16px'};
                    margin-bottom: 12px;
                    font-size: ${isMobile ? '12px' : '13px'};
                    color: #374151;
                    flex-wrap: wrap;
                  ">
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9,22 9,12 15,12 15,22"></polyline>
                      </svg>
                      ${property.details?.numBedrooms || property.beds || 0} bed
                    </span>
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                        <rect x="4" y="6" width="16" height="12" rx="2" ry="2"></rect>
                        <circle cx="12" cy="12" r="2"></circle>
                      </svg>
                      ${property.details?.numBathrooms || property.baths || 0} bath
                    </span>
                  </div>
                  <button 
                    onclick="window.handlePropertyMapClick('${property.mlsNumber}')"
                    style="
                      width: 100%;
                      background: ${colors.cobalt};
                      color: ${colors.white};
                      border: none;
                      border-radius: 6px;
                      padding: ${isMobile ? '12px 14px' : '10px 16px'};
                      font-size: ${isMobile ? '15px' : '14px'};
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.2s ease;
                    "
                    onmouseover="this.style.background='${colors.onyx}'"
                    onmouseout="this.style.background='${colors.cobalt}'"
                  >
                    ${isMobile ? 'View Details' : 'View Details'}
                  </button>
                </div>
              </div>
            `;

            marker.addListener('click', () => {
              infoWindowRef.current.setContent(infoWindowContent);
              infoWindowRef.current.open(googleMapRef.current, marker);
              
              // On mobile, also trigger the property select callback after a delay
              if (isMobile && onPropertySelect) {
                setTimeout(() => {
                  onPropertySelect(property);
                }, 100);
              }
            });

            markersRef.current.push(marker);
          } else {
            invalidMarkers++;
            if (process.env.NODE_ENV === 'development') {
              console.log(`Property ${index} has coordinates outside expected range: lat=${lat}, lng=${lng}`);
            }
          }
        } else {
          invalidMarkers++;
          if (process.env.NODE_ENV === 'development') {
            console.log(`Property ${index} missing or invalid coordinates:`, {
              map: property.map,
              latitude: property.latitude,
              longitude: property.longitude,
              coordinates: property.coordinates,
              location: property.location
            });
          }
        }
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Markers created: ${validMarkers} valid, ${invalidMarkers} invalid/missing coordinates`);
      }
      
      // Initialize MarkerClusterer with mobile-optimized settings
      if (window.markerClusterer && markersRef.current.length > 0) {
        markerClustererRef.current = new window.markerClusterer.MarkerClusterer({
          map: googleMapRef.current,
          markers: markersRef.current,
          renderer: {
            render: ({ count, position }) => {
              return new window.google.maps.Marker({
                position,
                icon: createClusterMarker(count),
                label: {
                  text: String(count),
                  color: colors.white,
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '600'
                },
                title: `${count} properties`,
                zIndex: 1000 + count
              });
            }
          },
          algorithm: new window.markerClusterer.GridAlgorithm({
            gridSize: isMobile ? 50 : 60,
            maxDistance: isMobile ? 15000 : 20000
          })
        });
      }
      
      // Adjust map bounds to show all markers if we have valid markers
      if (validMarkers > 0 && markersRef.current.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        markersRef.current.forEach(marker => {
          bounds.extend(marker.getPosition());
        });
        googleMapRef.current.fitBounds(bounds);
        
        // Prevent zooming too far in if there's only one marker
        const listener = window.google.maps.event.addListener(googleMapRef.current, 'bounds_changed', () => {
          const maxZoom = isMobile ? 14 : 15;
          if (googleMapRef.current.getZoom() > maxZoom) {
            googleMapRef.current.setZoom(maxZoom);
          }
          window.google.maps.event.removeListener(listener);
        });
      }
    }
  };

  // Set up global function for handling property clicks from info windows
  useEffect(() => {
    window.handlePropertyMapClick = (mlsNumber) => {
      const property = [...properties, ...allProperties].find(p => p.mlsNumber === mlsNumber);
      if (property) {
        handlePropertyClick(property);
      }
    };

    return () => {
      delete window.handlePropertyMapClick;
    };
  }, [properties, allProperties, isMobile, onPropertySelect]);

  // Re-add markers when properties change
  useEffect(() => {
    if (googleMapRef.current) {
      addMarkersWithClustering();
    }
  }, [properties, allProperties, isFiltered, center, isMobile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (boundsChangeTimeoutRef.current) {
        clearTimeout(boundsChangeTimeoutRef.current);
      }
    };
  }, []);

  // Show error message if Google Maps API key is missing
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        color: '#6b7280',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div>
          <h3>Map Unavailable</h3>
          <p>Google Maps API key is not configured.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="google-map" 
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: isMobile ? '300px' : '400px',
        touchAction: isMobile ? 'pan-x pan-y' : 'auto'
      }}
    />
  );
};

export default GoogleMap;