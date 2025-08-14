// apiService.js - Fixed version with correct total count calculation
const API_KEY = process.env.REACT_APP_REPLIERS_API_KEY;
const BASE_URL = process.env.REACT_APP_REPLIERS_BASE_URL || 'https://api.repliers.io';

// Available board IDs to search through
const BOARD_IDS = [87, 88, 90, 91];

const apiService = {
    // FIXED: Get correct total count by loading all pages and filtering
    async getCorrectTotalCount(params = {}) {
        if (!API_KEY) {
            throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        try {
            console.log('🔍 Getting correct total count by loading all pages...');
            
            let allProperties = [];
            let page = 1;
            let hasMorePages = true;
            const maxPages = 15; // Reasonable limit to prevent infinite loops
            
            // Check if we have a search query or filters
            const hasFilters = params.priceRange || params.bedrooms || params.bathrooms || params.propertyType;
            const hasQuery = params.query && params.query.trim();
            
            while (hasMorePages && page <= maxPages) {
                try {
                    let result;
                    
                    if (hasQuery) {
                        result = await this.searchPropertiesWithKeywords(params.query.trim(), params, page, 100);
                    } else if (hasFilters) {
                        result = await this.searchPropertiesWithFilters(params, page, 100);
                    } else {
                        result = await this.getBasicListings(page, 100);
                    }
                    
                    if (result.listings && result.listings.length > 0) {
                        allProperties.push(...result.listings);
                        
                        // Check if we have more pages based on API response
                        if (result.pagination && page < result.pagination.numPages) {
                            page++;
                        } else {
                            hasMorePages = false;
                        }
                    } else {
                        hasMorePages = false;
                    }
                } catch (pageError) {
                    console.warn(`Failed to load page ${page} for total count:`, pageError);
                    hasMorePages = false;
                }
            }
            
            console.log(`🔍 Loaded ${allProperties.length} total properties across ${page - 1} pages`);
            
            // FIXED: Apply the same filtering logic as processListingsResponse
            const filteredProperties = allProperties.filter(property => {
                const propertyClass = property.class || '';
                const type = property.type || property.class || '';
                const listPrice = property.listPrice || property.price || 0;
                
                // Filter out commercial properties
                if (propertyClass === 'CommercialProperty') {
                    return false;
                }
                
                // Only allow ResidentialProperty or CondoProperty
                if (propertyClass && !['ResidentialProperty', 'CondoProperty'].includes(propertyClass)) {
                    return false;
                }
                
                // Filter out lease properties
                if (type.toLowerCase().includes('lease') || 
                    type.toLowerCase().includes('rent') ||
                    type.toLowerCase().includes('rental')) {
                    return false;
                }
                
                // Filter out very low prices (likely lease prices)
                if (listPrice > 0 && listPrice < 30000) {
                    return false;
                }
                
                return true;
            });
            
            const filteredCount = filteredProperties.length;
            const filteredPercentage = allProperties.length > 0 ? 
                Math.round((allProperties.length - filteredCount) / allProperties.length * 100) : 0;
            
            console.log(`🔍 After filtering: ${filteredCount} properties (filtered out ${allProperties.length - filteredCount} properties - ${filteredPercentage}%)`);
            
            return {
                totalCount: filteredCount,
                totalPages: Math.ceil(filteredCount / 100),
                originalCount: allProperties.length
            };
            
        } catch (error) {
            console.error('Error getting correct total count:', error);
            return {
                totalCount: 0,
                totalPages: 1,
                originalCount: 0
            };
        }
    },

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

    // FIXED: Enhanced searchPropertiesWithCorrectCount method
    async searchPropertiesWithCorrectCount(params = {}, page = 1, resultsPerPage = 100) {
        try {
            console.log('🔍 ENHANCED SEARCH - Getting both page data and correct total count...');
            
            // Get the current page data
            const pageResult = await this.searchProperties(params, page, resultsPerPage);
            
            // Get the correct total count (this will take a moment but gives accurate count)
            const countResult = await this.getCorrectTotalCount(params);
            
            // FIXED: Return page data with corrected pagination
            return {
                listings: pageResult.listings || [],
                pagination: {
                    page: page,
                    numPages: countResult.totalPages,
                    pageSize: resultsPerPage,
                    count: countResult.totalCount, // This is the corrected count after filtering
                    originalCount: countResult.originalCount // For debugging
                }
            };
            
        } catch (error) {
            console.error('Error in searchPropertiesWithCorrectCount:', error);
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
          
          console.log(`🔍 API REQUEST - getBasicListings page ${page}:`, url);

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'REPLIERS-API-KEY': API_KEY,
              'Accept': 'application/json'
            }
          });

          console.log(`🔍 API RESPONSE STATUS for page ${page}:`, response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          
          console.log(`🔍 RAW API DATA for page ${page}:`, {
            'data keys': Object.keys(data),
            'listings count': data.listings?.length || 'no listings key',
            'data.length if array': Array.isArray(data) ? data.length : 'not array',
            'pagination': data.pagination,
            'count': data.count,
            'total': data.total,
            'totalCount': data.totalCount,
            'numPages': data.numPages,
            'pageNum': data.pageNum,
            'page': data.page
          });
          
          const processed = this.processListingsResponse(data);
          console.log(`🔍 PROCESSED RESULT for page ${page}:`, processed);
          
          return processed;
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
        console.log('🔍 Processing API Response:', data);
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
        // FIXED: Extract pagination info properly from API response
        pagination = {
          page: data.page || data.pageNum || 1,
          numPages: data.numPages || data.totalPages || 1,
          pageSize: data.pageSize || data.resultsPerPage || 100,
          count: data.count || data.totalCount || data.total || 0 // CRITICAL: This should be TOTAL across all pages
        };
        
        console.log('🔍 Initial pagination from API:', pagination);
        
        // Extract listings from response
        if (Array.isArray(data)) {
          listings = data;
          // FIXED: ONLY set count to array length if we don't have a proper total count
          if (!pagination.count) {
            pagination.count = data.length;
            console.log('🔍 Using array length as fallback count:', pagination.count);
          }
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

        // CRITICAL FIX: Don't override total count with current page listings length!
        // The API should return the total count across all pages, not just current page
        
        // FIXED: Calculate total pages if not provided but we have total count
        if (pagination.count > 0 && (!pagination.numPages || pagination.numPages === 1)) {
          pagination.numPages = Math.ceil(pagination.count / pagination.pageSize);
          console.log('🔍 Calculated numPages:', pagination.numPages);
        }
        
        console.log('🔍 After processing - pagination:', pagination);
        console.log('🔍 After processing - listings count:', listings.length);
      }
      
      // FIXED: Enhanced client-side filtering for Sale properties and property class
      const originalListingsCount = listings.length;
      listings = listings.filter(property => {
        // Check various fields that might indicate property type
        const type = property.type || property.class || '';
        const listPrice = property.listPrice || property.price || 0;
        const propertyClass = property.class || '';
        
        // FIXED: Filter out commercial properties
        if (propertyClass === 'CommercialProperty') {
          console.log('🏢 Filtered out commercial property:', property.address);
          return false;
        }
        
        // Only allow ResidentialProperty or CondoProperty
        if (propertyClass && !['ResidentialProperty', 'CondoProperty'].includes(propertyClass)) {
          console.log('🏠 Filtered out non-residential property class:', propertyClass, property.address);
          return false;
        }
        
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
      
      // CRITICAL: DO NOT change the total count based on current page filtering
      // The pagination.count should remain the total across all pages
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Processed ${listings.length} listings on current page (filtered ${originalListingsCount - listings.length} lease/commercial properties)`);
        console.log('🔍 FINAL pagination (should have total count across all pages):', pagination);
      }
      
      return {
        listings: listings,
        pagination: pagination
      };
    },

    // Rest of the methods remain the same...
    async getSingleListing(mlsNumber) {
        if (!API_KEY) {
          throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        let lastError = null;
        
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
        
        console.error('Failed to find listing on any board:', lastError);
        throw new Error(`Failed to fetch single listing ${mlsNumber} from any board (87, 88, 90, 91): ${lastError?.message || 'Unknown error'}`);
    },

    async getSimilarListings(mlsNumber, sortBy = 'updatedOnDesc') {
        if (!API_KEY) {
          throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        let lastError = null;
        
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
              
              return this.processListingsResponse(data);
            } else {
              const errorText = await response.text();
              if (process.env.NODE_ENV === 'development') {
                console.log(`Board ${boardId} failed with status ${response.status}: ${errorText}`);
              }
              
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
        
        console.error('Failed to find similar listings on any board:', lastError);
        throw new Error(`Failed to fetch similar listings for ${mlsNumber} from any board (87, 88, 90, 91): ${lastError?.message || 'Unknown error'}`);
    },

    async getPropertyDetails(listingId) {
        try {
          return await this.getSingleListing(listingId);
        } catch (error) {
          console.error('API Error in getPropertyDetails:', error);
          throw new Error(`Failed to fetch property details: ${error.message}`);
        }
    },

    async getMapClusters(bounds = {}) {
        if (!API_KEY) {
          throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        try {
          const searchBody = {
            city: 'Brantford',
            province: 'ON',
            country: 'CA',
            type: 'Sale',
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
            type: 'Sale'
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