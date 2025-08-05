// apiService.js - Fixed version with better environment variable handling
const API_KEY = process.env.REACT_APP_REPLIERS_API_KEY;
const BASE_URL = process.env.REACT_APP_REPLIERS_BASE_URL || 'https://api.repliers.io';

// Available board IDs to search through
const BOARD_IDS = [87, 88, 90, 91];

const apiService = {
    // Updated to handle single page requests with proper pagination and Sale filtering
    async searchProperties(params = {}, page = 1, resultsPerPage = 100) {
        // Check if API key is available before making requests
        if (!API_KEY) {
          throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        try {
          console.log('Search Parameters:', params, 'Page:', page, 'Results per page:', resultsPerPage);
          
          // Check if we have a search query
          if (params.query && params.query.trim()) {
            return await this.searchPropertiesWithKeywords(params.query.trim(), params, page, resultsPerPage);
          }
          
          // Check if we have filters
          const hasFilters = params.priceRange || params.bedrooms || params.bathrooms || params.propertyType;
          
          if (hasFilters) {
            return await this.searchPropertiesWithFilters(params, page, resultsPerPage);
          } else {
            return await this.getBasicListings(page, resultsPerPage);
          }
        } catch (error) {
          console.error('API Error Details:', error);
          throw error;
        }
    },

    async getBasicListings(page = 1, resultsPerPage = 100) {
        // Check if API key is available before making requests
        if (!API_KEY) {
          throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        try {
          // Build query string for basic GET request with proper pagination and Sale filtering
          const queryParams = new URLSearchParams();
          queryParams.append('city', 'brantford');
          queryParams.append('type', 'Sale'); // Filter for Sale properties only
          queryParams.append('fields', 'boardId,mlsNumber,map,class,status,listPrice,listDate,soldPrice,soldDate,updatedOn,address,lastStatus,details.numBathrooms,details.numBathroomsPlus,details.numBedrooms,details.numBedroomsPlus,details.propertyType,details.sqft,lot,images[0]');
          queryParams.append('map', '[[[-80.12785245547646,43.220185357089036],[-80.37123410244985,43.220185357089036],[-80.37123410244985,43.04446585205372],[-80.12785245547646,43.04446585205372]]]');
          queryParams.append('pageNum', page.toString());
          queryParams.append('resultsPerPage', resultsPerPage.toString());
          
          const url = `${BASE_URL}/listings?${queryParams.toString()}`;
          
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`API Request URL (GET) - Page ${page}:`, url);
            console.log('Using API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'UNDEFINED');
          }

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'REPLIERS-API-KEY': API_KEY,
              'Accept': 'application/json'
            }
          });

          if (process.env.NODE_ENV === 'development') {
            console.log(`Response status for page ${page}:`, response.status);
          }

          if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            
            // Check if the error is due to invalid API key
            if (response.status === 401 || response.status === 403) {
              throw new Error(`Authentication failed. Please check your API key. Status: ${response.status}`);
            }
            
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          
          if (process.env.NODE_ENV === 'development') {
            console.log('API Response:', data);
          }
          
          return this.processListingsResponse(data);
        } catch (error) {
          console.error('API Error in getBasicListings:', error);
          throw error;
        }
    },

    async searchPropertiesWithFilters(params = {}, page = 1, resultsPerPage = 100) {
        // Check if API key is available before making requests
        if (!API_KEY) {
          throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        try {
          // Build query string for POST request with proper pagination and Sale filtering
          const queryParams = new URLSearchParams({
            amenities: '',
            balcony: '',
            listings: 'true',
            operator: 'AND',
            sortBy: 'updatedOnDesc',
            status: 'A',
            type: 'Sale', // Filter for Sale properties only
            pageNum: page.toString(),
            resultsPerPage: resultsPerPage.toString()
          });

          // Build the POST body with filters
          const searchBody = {
            city: 'brantford',
            type: 'Sale' // Ensure Sale filtering in POST body as well
          };

          // Add filters from params
          if (params.priceRange) {
            const [min, max] = params.priceRange.split('-');
            if (min && min !== '0') {
              searchBody.minPrice = parseInt(min);
            }
            if (max && max !== '+' && max !== '999999999') {
              searchBody.maxPrice = parseInt(max);
            }
          }

          if (params.bedrooms) {
            const bedroomValue = params.bedrooms.replace('+', '');
            searchBody.minBedrooms = parseInt(bedroomValue);
          }

          if (params.bathrooms) {
            const bathroomValue = params.bathrooms.replace('+', '');
            searchBody.minBaths = parseInt(bathroomValue);
          }

          if (params.propertyType) {
            searchBody.propertyType = params.propertyType;
          }

          const url = `${BASE_URL}/listings?${queryParams.toString()}`;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`API Request URL (POST) - Page ${page}:`, url);
            console.log('Request Body:', JSON.stringify(searchBody, null, 2));
            console.log('Using API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'UNDEFINED');
          }

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'REPLIERS-API-KEY': API_KEY,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchBody)
          });

          if (process.env.NODE_ENV === 'development') {
            console.log(`Response status for page ${page}:`, response.status);
          }

          if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            
            // Check if the error is due to invalid API key
            if (response.status === 401 || response.status === 403) {
              throw new Error(`Authentication failed. Please check your API key. Status: ${response.status}`);
            }
            
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          
          if (process.env.NODE_ENV === 'development') {
            console.log('API Response:', data);
          }
          
          return this.processListingsResponse(data);
        } catch (error) {
          console.error('API Error in searchPropertiesWithFilters:', error);
          throw error;
        }
    },

    // Updated method for search with keywords and proper pagination with Sale filtering
    async searchPropertiesWithKeywords(searchQuery, additionalParams = {}, page = 1, resultsPerPage = 100) {
        // Check if API key is available before making requests
        if (!API_KEY) {
          throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        try {
          const queryParams = new URLSearchParams();
          
          // Add search query and Sale filtering
          queryParams.append('search', searchQuery);
          queryParams.append('fuzzySearch', 'true');
          queryParams.append('city', 'brantford');
          queryParams.append('type', 'Sale'); // Filter for Sale properties only
          queryParams.append('fields', 'boardId,mlsNumber,map,class,status,listPrice,listDate,soldPrice,soldDate,updatedOn,address,lastStatus,details.numBathrooms,details.numBathroomsPlus,details.numBedrooms,details.numBedroomsPlus,details.propertyType,details.sqft,lot,images[0]');
          queryParams.append('pageNum', page.toString());
          queryParams.append('resultsPerPage', resultsPerPage.toString());
          
          // Add filters to query params if they exist
          if (additionalParams.priceRange) {
            const [min, max] = additionalParams.priceRange.split('-');
            if (min && min !== '0') {
              queryParams.append('minPrice', min);
            }
            if (max && max !== '+' && max !== '999999999') {
              queryParams.append('maxPrice', max);
            }
          }
          
          if (additionalParams.bedrooms) {
            const bedroomValue = additionalParams.bedrooms.replace('+', '');
            queryParams.append('minBedrooms', bedroomValue);
          }
          
          if (additionalParams.bathrooms) {
            const bathroomValue = additionalParams.bathrooms.replace('+', '');
            queryParams.append('minBaths', bathroomValue);
          }
          
          if (additionalParams.propertyType) {
            queryParams.append('propertyType', additionalParams.propertyType);
          }
          
          const url = `${BASE_URL}/listings?${queryParams.toString()}`;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`Search API Request URL (Page ${page}):`, url);
            console.log(`Search Query: "${searchQuery}"`);
            console.log('Using API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'UNDEFINED');
          }

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'REPLIERS-API-KEY': API_KEY,
              'Accept': 'application/json'
            }
          });

          if (process.env.NODE_ENV === 'development') {
            console.log(`Search response status for page ${page}:`, response.status);
          }

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Search API Error Response:', errorText);
            
            // Check if the error is due to invalid API key
            if (response.status === 401 || response.status === 403) {
              throw new Error(`Authentication failed. Please check your API key. Status: ${response.status}`);
            }
            
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Search API Response:', data);
          }
          
          return this.processListingsResponse(data);
        } catch (error) {
          console.error('API Error in searchPropertiesWithKeywords:', error);
          throw error;
        }
    },

    processListingsResponse(data) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Processing API Response:', data);
        }
        
        // Extract listings and pagination info from response
        let listings = [];
        let pagination = {
          page: 1,
          numPages: 1,
          pageSize: 100,
          count: 0
        };
        
        if (data) {
          // Extract pagination info directly from API response
          pagination = {
            page: data.page || 1,
            numPages: data.numPages || 1,
            pageSize: data.pageSize || data.resultsPerPage || 100,
            count: data.count || 0
          };
          
          // Extract listings from response
          if (Array.isArray(data)) {
            listings = data;
            pagination.count = data.length;
          } else if (data.listings && Array.isArray(data.listings)) {
            listings = data.listings;
          } else if (data.data && Array.isArray(data.data)) {
            listings = data.data;
          } else if (data.results && Array.isArray(data.results)) {
            listings = data.results;
          } else {
            // Try to find any array in the response
            const possibleArrays = Object.values(data).filter(Array.isArray);
            if (possibleArrays.length > 0) {
              listings = possibleArrays[0];
            }
          }
        }
        
        // Additional client-side filtering to ensure only Sale properties are included
        // This is a backup filter in case the API doesn't properly filter
        listings = listings.filter(property => {
          // Check various fields that might indicate property type
          const type = property.type || property.class || '';
          const listPrice = property.listPrice || property.price || 0;
          
          // Filter out lease properties by checking common indicators
          if (type.toLowerCase().includes('lease') || 
              type.toLowerCase().includes('rent') ||
              type.toLowerCase().includes('rental')) {
            return false;
          }
          
          // Filter out very low prices that are likely lease prices (under $30,000)
          if (listPrice > 0 && listPrice < 30000) {
            return false;
          }
          
          // If it has a reasonable sale price or no price info, include it
          return true;
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Processed listings: ${listings.length} (after filtering out lease properties)`);
          console.log('Pagination info:', pagination);
        }
        
        // Update count after filtering
        pagination.count = listings.length;
        
        return {
          listings: listings,
          pagination: pagination
        };
    },

    // UPDATED: Get a single listing by MLS number - tries all board IDs with Sale filtering
    async getSingleListing(mlsNumber) {
        // Check if API key is available before making requests
        if (!API_KEY) {
          throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        let lastError = null;
        
        // Try each board ID until we find the listing or exhaust all options
        for (const boardId of BOARD_IDS) {
          try {
            const url = `${BASE_URL}/listings/${mlsNumber}?boardId=${boardId}&type=Sale`;
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`Getting single listing from board ${boardId}: ${url}`);
              console.log('Using API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'UNDEFINED');
            }

            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'REPLIERS-API-KEY': API_KEY,
                'Accept': 'application/json'
              }
            });

            if (process.env.NODE_ENV === 'development') {
              console.log(`Single listing response status for board ${boardId}:`, response.status);
            }

            if (response.ok) {
              const data = await response.json();
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`Found listing on board ${boardId}:`, data);
              }
              
              // Additional client-side check to ensure it's a Sale property
              const type = data.type || data.class || '';
              const listPrice = data.listPrice || data.price || 0;
              
              if (type.toLowerCase().includes('lease') || 
                  type.toLowerCase().includes('rent') ||
                  (listPrice > 0 && listPrice < 30000)) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(`Listing ${mlsNumber} appears to be a lease property, skipping`);
                }
                continue;
              }
              
              return data;
            } else {
              const errorText = await response.text();
              if (process.env.NODE_ENV === 'development') {
                console.log(`Board ${boardId} failed with status ${response.status}: ${errorText}`);
              }
              
              // Check if the error is due to invalid API key
              if (response.status === 401 || response.status === 403) {
                throw new Error(`Authentication failed. Please check your API key. Status: ${response.status}`);
              }
              
              lastError = new Error(`Board ${boardId}: HTTP ${response.status} - ${errorText}`);
            }
          } catch (error) {
            console.error(`Error trying board ${boardId}:`, error);
            lastError = error;
          }
        }
        
        // If we get here, all board IDs failed
        console.error('Failed to find listing on any board:', lastError);
        throw new Error(`Failed to fetch single listing ${mlsNumber} from any board (87, 88, 90, 91): ${lastError?.message || 'Unknown error'}`);
    },

    // UPDATED: Get similar listings for a property - tries all board IDs with Sale filtering
    async getSimilarListings(mlsNumber, sortBy = 'updatedOnDesc') {
        // Check if API key is available before making requests
        if (!API_KEY) {
          throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        let lastError = null;
        
        // Try each board ID until we find similar listings or exhaust all options
        for (const boardId of BOARD_IDS) {
          try {
            const url = `${BASE_URL}/listings/${mlsNumber}/similar?boardId=${boardId}&sortBy=${sortBy}&type=Sale`;
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`Getting similar listings from board ${boardId}: ${url}`);
            }

            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'REPLIERS-API-KEY': API_KEY,
                'Accept': 'application/json'
              }
            });

            if (process.env.NODE_ENV === 'development') {
              console.log(`Similar listings response status for board ${boardId}:`, response.status);
            }

            if (response.ok) {
              const data = await response.json();
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`Found similar listings on board ${boardId}:`, data);
              }
              
              // Process similar listings the same way as regular listings (includes Sale filtering)
              return this.processListingsResponse(data);
            } else {
              const errorText = await response.text();
              if (process.env.NODE_ENV === 'development') {
                console.log(`Board ${boardId} failed with status ${response.status}: ${errorText}`);
              }
              
              // Check if the error is due to invalid API key
              if (response.status === 401 || response.status === 403) {
                throw new Error(`Authentication failed. Please check your API key. Status: ${response.status}`);
              }
              
              lastError = new Error(`Board ${boardId}: HTTP ${response.status} - ${errorText}`);
            }
          } catch (error) {
            console.error(`Error trying board ${boardId}:`, error);
            lastError = error;
          }
        }
        
        // If we get here, all board IDs failed
        console.error('Failed to find similar listings on any board:', lastError);
        throw new Error(`Failed to fetch similar listings for ${mlsNumber} from any board (87, 88, 90, 91): ${lastError?.message || 'Unknown error'}`);
    },

    // UPDATED: Legacy method - keeping for backward compatibility
    async getPropertyDetails(listingId) {
        try {
          return await this.getSingleListing(listingId);
        } catch (error) {
          console.error('API Error in getPropertyDetails:', error);
          throw new Error(`Failed to fetch property details: ${error.message}`);
        }
    },

    async getMapClusters(bounds = {}) {
        // Check if API key is available before making requests
        if (!API_KEY) {
          throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        try {
          const searchBody = {
            city: 'Brantford',
            province: 'ON',
            country: 'CA',
            type: 'Sale', // Filter for Sale properties only
            include_map_clusters: true,
            cluster_zoom: 12,
            ...bounds
          };

          const queryParams = new URLSearchParams({
            amenities: '',
            balcony: '',
            listings: 'true',
            operator: 'AND',
            sortBy: 'updatedOnDesc',
            status: 'A',
            type: 'Sale' // Filter for Sale properties only
          });

          const response = await fetch(`${BASE_URL}/listings?${queryParams.toString()}`, {
            method: 'POST',
            headers: {
              'REPLIERS-API-KEY': API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchBody)
          });

          if (!response.ok) {
            // Check if the error is due to invalid API key
            if (response.status === 401 || response.status === 403) {
              throw new Error(`Authentication failed. Please check your API key. Status: ${response.status}`);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          return data.map_clusters || [];
        } catch (error) {
          console.error('API Error in getMapClusters:', error);
          throw new Error(`Failed to fetch map clusters: ${error.message}`);
        }
    },

    // Helper function to format search parameters for API
    formatSearchParams(filters) {
        const params = {};
        
        if (filters.priceRange) {
          params.priceRange = filters.priceRange;
        }
        
        if (filters.bedrooms) {
          params.bedrooms = filters.bedrooms;
        }
        
        if (filters.bathrooms) {
          params.bathrooms = filters.bathrooms;
        }
        
        if (filters.propertyType) {
          params.propertyType = filters.propertyType;
        }
        
        if (filters.query) {
          params.query = filters.query;
        }
        
        return params;
    },

    // Helper function to try a request across all board IDs
    async tryAllBoards(requestFunction) {
        let lastError = null;
        
        for (const boardId of BOARD_IDS) {
          try {
            const result = await requestFunction(boardId);
            return result;
          } catch (error) {
            console.error(`Error trying board ${boardId}:`, error);
            lastError = error;
          }
        }
        
        throw new Error(`Failed to complete request on any board (87, 88, 90, 91): ${lastError?.message || 'Unknown error'}`);
    }
};

export default apiService;