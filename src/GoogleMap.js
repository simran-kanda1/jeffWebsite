import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import formatAddress from './format/formatAddress';
import apiService from './apiService';

const GoogleMap = ({ center = { lat: parseFloat(process.env.REACT_APP_DEFAULT_LAT) || 43.1394, lng: parseFloat(process.env.REACT_APP_DEFAULT_LNG) || -80.2644 }, properties = [], isFiltered = false }) => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const markerClustererRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || 'https://cdn.repliers.io/';
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  // Company color palette
  const colors = {
    cobalt: '#050E3D',      // Primary
    onyx: '#1D1D1D',        // Secondary - for hovers
    slate: '#615B56',       // Secondary
    seaglass: '#BFDDDB',    // Secondary
    white: '#FFFFFF'
  };

  // Load all properties when component mounts (only if not filtered)
  useEffect(() => {
    const loadAllProperties = async () => {
      if (!isFiltered && properties.length === 0) {
        try {
          setLoading(true);
          // Get multiple pages to show more properties on map
          const promises = [];
          for (let page = 1; page <= 12; page++) { // Load first 12 pages (1200 properties)
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

  // Custom marker icon for individual properties with better price formatting
  const createPropertyMarker = (price) => {
    const formattedPrice = formatPriceForMarker(price);
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="90" height="32" viewBox="0 0 90 32" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="88" height="30" rx="15" fill="${colors.cobalt}" stroke="${colors.white}" stroke-width="2"/>
          <text x="45" y="20" text-anchor="middle" fill="${colors.white}" font-size="13" font-weight="600" font-family="Arial, sans-serif">${formattedPrice}</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(90, 32),
      anchor: new window.google.maps.Point(45, 16)
    };
  };

  // Better price formatting for markers
  const formatPriceForMarker = (price) => {
    if (!price || price === 0) return '$--';
    
    if (price >= 1000000) {
      const millions = price / 1000000;
      return `${millions.toFixed(1)}M`;
    } else if (price >= 1000) {
      const thousands = price / 1000;
      return `${Math.round(thousands)}K`;
    } else {
      return `${Math.round(price)}`;
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
    const size = count < 10 ? 40 : count < 100 ? 50 : 60;
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
    if (property.mlsNumber) {
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
          zoom: 12,
          styles: [
            {
              "featureType": "poi.park",
              "elementType": "geometry",
              "stylers": [
                {
                  "color": "#BFDDDB" // Seaglass
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
          ]
        });
        
        // Create a single info window to reuse
        infoWindowRef.current = new window.google.maps.InfoWindow();
        
        // Add markers after map is initialized
        addMarkersWithClustering();
      }
    }
  }, [GOOGLE_MAPS_API_KEY]);

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

            // Create improved info window content
            const imageUrl = property.images?.[0] ? getImageUrl(property.images[0]) : null;
            const infoWindowContent = `
              <div style="
                padding: 0;
                max-width: 300px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                background: ${colors.white};
              ">
                ${imageUrl ? `
                  <div style="
                    width: 100%;
                    height: 160px;
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
                <div style="padding: 16px;">
                  <div style="
                    font-size: 18px;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 4px;
                    line-height: 1.2;
                  ">
                    ${formatPrice(price)}
                  </div>
                  <div style="
                    font-size: 14px;
                    color: #6b7280;
                    margin-bottom: 12px;
                    line-height: 1.4;
                  ">
                    ${formattedAddress}
                  </div>
                  <div style="
                    display: flex;
                    gap: 16px;
                    margin-bottom: 12px;
                    font-size: 13px;
                    color: #374151;
                  ">
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9,22 9,12 15,12 15,22"></polyline>
                      </svg>
                      ${property.details?.numBedrooms || property.beds || 0} bed
                    </span>
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                      padding: 10px 16px;
                      font-size: 14px;
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.2s ease;
                    "
                    onmouseover="this.style.background='${colors.onyx}'"
                    onmouseout="this.style.background='${colors.cobalt}'"
                  >
                    View Details
                  </button>
                </div>
              </div>
            `;

            marker.addListener('click', () => {
              infoWindowRef.current.setContent(infoWindowContent);
              infoWindowRef.current.open(googleMapRef.current, marker);
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
      
      // Initialize MarkerClusterer
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
                  fontSize: '14px',
                  fontWeight: '600'
                },
                title: `${count} properties`,
                zIndex: 1000 + count
              });
            }
          },
          algorithm: new window.markerClusterer.GridAlgorithm({
            gridSize: 60,
            maxDistance: 20000
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
          if (googleMapRef.current.getZoom() > 15) {
            googleMapRef.current.setZoom(15);
          }
          window.google.maps.event.removeListener(listener);
        });
      }
    }
  };

  // Set up global function for handling property clicks from info windows
  useEffect(() => {
    window.handlePropertyMapClick = (mlsNumber) => {
      if (mlsNumber) {
        navigate(`/property/${mlsNumber}`);
      }
    };

    return () => {
      delete window.handlePropertyMapClick;
    };
  }, [navigate]);

  // Re-add markers when properties change
  useEffect(() => {
    if (googleMapRef.current) {
      addMarkersWithClustering();
    }
  }, [properties, allProperties, isFiltered, center]);

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
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
    />
  );
};

export default GoogleMap;