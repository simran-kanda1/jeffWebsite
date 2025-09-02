// apiService.js - Complete file with correct Repliers API parameters
const API_KEY = process.env.REACT_APP_REPLIERS_API_KEY;
const BASE_URL = process.env.REACT_APP_REPLIERS_BASE_URL || 'https://api.repliers.io';

// Available board IDs to search through
const BOARD_IDS = [87, 88, 90, 91];

const apiService = {
    // Get correct total count by loading all pages and filtering
    async getCorrectTotalCount(params = {}) {
        if (!API_KEY) {
            throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        try {
            console.log('🔍 Getting correct total count by loading all pages...');
            
            let allProperties = [];
            let page = 1;
            let hasMorePages = true;
            const maxPages = 15;
            
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
            
            // Apply the same filtering logic as processListingsResponse
            const filteredProperties = allProperties.filter(property => {
                const propertyClass = property.class || '';
                const type = property.type || property.class || '';
                const listPrice = property.listPrice || property.price || 0;
                
                if (propertyClass === 'CommercialProperty') {
                    return false;
                }
                
                if (propertyClass && !['ResidentialProperty', 'CondoProperty'].includes(propertyClass)) {
                    return false;
                }
                
                if (type.toLowerCase().includes('lease') || 
                    type.toLowerCase().includes('rent') ||
                    type.toLowerCase().includes('rental')) {
                    return false;
                }
                
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

    // Main search method - updated to handle simplified filters
    async searchProperties(params = {}, page = 1, resultsPerPage = 100) {
        if (!API_KEY) {
            throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        try {
            console.log('Search Parameters:', params, 'Page:', page, 'Results per page:', resultsPerPage);
            
            if (params.query && params.query.trim()) {
                return await this.searchPropertiesWithKeywords(params.query.trim(), params, page, resultsPerPage);
            }
            
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

    // Enhanced search with correct count
    async searchPropertiesWithCorrectCount(params = {}, page = 1, resultsPerPage = 100) {
        try {
            console.log('🔍 ENHANCED SEARCH - Getting both page data and correct total count...');
            
            const pageResult = await this.searchProperties(params, page, resultsPerPage);
            const countResult = await this.getCorrectTotalCount(params);
            
            return {
                listings: pageResult.listings || [],
                pagination: {
                    page: page,
                    numPages: countResult.totalPages,
                    pageSize: resultsPerPage,
                    count: countResult.totalCount,
                    originalCount: countResult.originalCount
                }
            };
            
        } catch (error) {
            console.error('Error in searchPropertiesWithCorrectCount:', error);
            throw error;
        }
    },

    // Get basic listings using correct Repliers API parameters
    async getBasicListings(page = 1, resultsPerPage = 100) {
        if (!API_KEY) {
            throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        try {
            const queryParams = new URLSearchParams();
            
            // Core parameters from Repliers API docs
            queryParams.append('city', 'brantford');
            queryParams.append('type', 'Sale');
            queryParams.append('status', 'A');
            queryParams.append('class', 'residential');
            queryParams.append('operator', 'AND');
            queryParams.append('sortBy', 'updatedOnDesc');
            queryParams.append('listings', 'true');
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
                'pagination': data.pagination,
                'count': data.count
            });
            
            const processed = this.processListingsResponse(data);
            console.log(`🔍 PROCESSED RESULT for page ${page}:`, processed);
            
            return processed;
        } catch (error) {
            console.error('API Error in getBasicListings:', error);
            throw error;
        }
    },

    // Search with filters using correct Repliers API parameters
    async searchPropertiesWithFilters(params = {}, page = 1, resultsPerPage = 100) {
        if (!API_KEY) {
            throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        try {
            const queryParams = new URLSearchParams();
            
            // Core parameters from Repliers API docs
            queryParams.append('city', 'brantford');
            queryParams.append('type', 'Sale');
            queryParams.append('status', 'A');
            queryParams.append('class', 'residential');
            queryParams.append('operator', 'AND');
            queryParams.append('sortBy', 'updatedOnDesc');
            queryParams.append('listings', 'true');
            queryParams.append('pageNum', page.toString());
            queryParams.append('resultsPerPage', resultsPerPage.toString());

            // Add price range filter using correct API parameters
            if (params.priceRange) {
                const [min, max] = params.priceRange.split('-');
                if (min && min !== '0') {
                    queryParams.append('minPrice', min);
                }
                if (max && max !== '+' && max !== '999999999') {
                    queryParams.append('maxPrice', max);
                }
            }

            // Add bedroom filter using correct API parameter
            if (params.bedrooms) {
                const bedroomValue = params.bedrooms.replace('+', '');
                queryParams.append('minBedrooms', bedroomValue);
            }

            // Add bathroom filter using correct API parameter
            if (params.bathrooms) {
                const bathroomValue = params.bathrooms.replace('+', '');
                queryParams.append('minBaths', bathroomValue);
            }

            // Add property type filter using correct API parameter
            if (params.propertyType && params.propertyType !== '') {
                queryParams.append('propertyType', params.propertyType);
            }

            const url = `${BASE_URL}/listings?${queryParams.toString()}`;
            
            console.log(`🔍 Filter API Request URL (Page ${page}):`, url);
            console.log('🔍 Filter Parameters:', params);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'REPLIERS-API-KEY': API_KEY,
                    'Accept': 'application/json'
                }
            });

            console.log(`🔍 Filter response status for page ${page}:`, response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Filter API Error Response:', errorText);
                
                if (response.status === 401 || response.status === 403) {
                    throw new Error(`Authentication failed. Please check your API key. Status: ${response.status}`);
                }
                
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log(`🔍 Filter API Response:`, data);
            
            return this.processListingsResponse(data);
        } catch (error) {
            console.error('API Error in searchPropertiesWithFilters:', error);
            throw error;
        }
    },

    // Search with keywords using correct Repliers API parameters
    async searchPropertiesWithKeywords(searchQuery, additionalParams = {}, page = 1, resultsPerPage = 100) {
        if (!API_KEY) {
            throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        try {
            const queryParams = new URLSearchParams();
            
            // Core search parameters from Repliers API docs
            queryParams.append('search', searchQuery);
            queryParams.append('city', 'brantford');
            queryParams.append('type', 'Sale');
            queryParams.append('status', 'A');
            queryParams.append('class', 'residential');
            queryParams.append('operator', 'AND');
            queryParams.append('sortBy', 'updatedOnDesc');
            queryParams.append('listings', 'true');
            queryParams.append('pageNum', page.toString());
            queryParams.append('resultsPerPage', resultsPerPage.toString());
            
            // Add price filter using correct API parameters
            if (additionalParams.priceRange) {
                const [min, max] = additionalParams.priceRange.split('-');
                if (min && min !== '0') {
                    queryParams.append('minPrice', min);
                }
                if (max && max !== '+' && max !== '999999999') {
                    queryParams.append('maxPrice', max);
                }
            }
            
            // Add bedroom filter using correct API parameter
            if (additionalParams.bedrooms) {
                const bedroomValue = additionalParams.bedrooms.replace('+', '');
                queryParams.append('minBedrooms', bedroomValue);
            }
            
            // Add bathroom filter using correct API parameter  
            if (additionalParams.bathrooms) {
                const bathroomValue = additionalParams.bathrooms.replace('+', '');
                queryParams.append('minBaths', bathroomValue);
            }
            
            // Add property type filter using correct API parameter
            if (additionalParams.propertyType) {
                queryParams.append('propertyType', additionalParams.propertyType);
            }
            
            const url = `${BASE_URL}/listings?${queryParams.toString()}`;
            
            console.log(`🔍 Search API Request URL (Page ${page}):`, url);
            console.log(`🔍 Search Query: "${searchQuery}"`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'REPLIERS-API-KEY': API_KEY,
                    'Accept': 'application/json'
                }
            });

            console.log(`🔍 Search response status for page ${page}:`, response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Search API Error Response:', errorText);
                
                if (response.status === 401 || response.status === 403) {
                    throw new Error(`Authentication failed. Please check your API key. Status: ${response.status}`);
                }
                
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log(`🔍 Search API Response:`, data);
            
            return this.processListingsResponse(data);
        } catch (error) {
            console.error('API Error in searchPropertiesWithKeywords:', error);
            throw error;
        }
    },

    // Process API response and filter results
    processListingsResponse(data) {
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Processing API Response:', data);
        }
        
        let listings = [];
        let pagination = {
            page: 1,
            numPages: 1,
            pageSize: 100,
            count: 0
        };
        
        if (data) {
            // Extract pagination info properly from API response
            pagination = {
                page: data.page || data.pageNum || 1,
                numPages: data.numPages || data.totalPages || 1,
                pageSize: data.pageSize || data.resultsPerPage || 100,
                count: data.count || data.totalCount || data.total || 0
            };
            
            console.log('🔍 Initial pagination from API:', pagination);
            
            // Extract listings from response
            if (Array.isArray(data)) {
                listings = data;
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
                const possibleArrays = Object.values(data).filter(Array.isArray);
                if (possibleArrays.length > 0) {
                    listings = possibleArrays[0];
                }
            }

            // Calculate total pages if not provided but we have total count
            if (pagination.count > 0 && (!pagination.numPages || pagination.numPages === 1)) {
                pagination.numPages = Math.ceil(pagination.count / pagination.pageSize);
                console.log('🔍 Calculated numPages:', pagination.numPages);
            }
            
            console.log('🔍 After processing - pagination:', pagination);
            console.log('🔍 After processing - listings count:', listings.length);
        }
        
        // Enhanced client-side filtering for Sale properties and property class
        const originalListingsCount = listings.length;
        listings = listings.filter(property => {
            const type = property.type || property.class || '';
            const listPrice = property.listPrice || property.price || 0;
            const propertyClass = property.class || '';
            
            // Filter out commercial properties
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
            
            return true;
        });
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 Processed ${listings.length} listings on current page (filtered ${originalListingsCount - listings.length} lease/commercial properties)`);
            console.log('🔍 FINAL pagination (should have total count across all pages):', pagination);
        }
        
        return {
            listings: listings,
            pagination: pagination
        };
    },

    // Get a single listing by MLS number using correct API parameters
    async getSingleListing(mlsNumber) {
        if (!API_KEY) {
            throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        const boardIds = [87, 88, 90, 91];
        let lastError = null;
        
        for (const boardId of boardIds) {
            try {
                const queryParams = new URLSearchParams();
                queryParams.append('mlsNumber', mlsNumber);
                queryParams.append('boardId', boardId.toString());
                queryParams.append('type', 'Sale');
                queryParams.append('status', 'A');
                queryParams.append('class', 'residential');
                
                const url = `${BASE_URL}/listings?${queryParams.toString()}`;
                
                console.log(`🔍 Single listing request for board ${boardId}:`, url);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'REPLIERS-API-KEY': API_KEY,
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // Check if we got results
                    let listing = null;
                    if (Array.isArray(data) && data.length > 0) {
                        listing = data[0];
                    } else if (data.listings && data.listings.length > 0) {
                        listing = data.listings[0];
                    }
                    
                    if (listing) {
                        // Check if it's a valid sale property
                        const type = listing.type || listing.class || '';
                        const listPrice = listing.listPrice || listing.price || 0;
                        
                        if (type.toLowerCase().includes('lease') || 
                            type.toLowerCase().includes('rent') ||
                            (listPrice > 0 && listPrice < 30000)) {
                            continue;
                        }
                        
                        console.log(`🔍 Found listing on board ${boardId}:`, listing);
                        return listing;
                    }
                } else {
                    lastError = new Error(`Board ${boardId}: HTTP ${response.status}`);
                }
            } catch (error) {
                console.error(`Error trying board ${boardId}:`, error);
                lastError = error;
            }
        }
        
        throw new Error(`Failed to fetch listing ${mlsNumber}: ${lastError?.message || 'Unknown error'}`);
    },

    // Get similar listings
    async getSimilarListings(mlsNumber, sortBy = 'updatedOnDesc') {
        if (!API_KEY) {
            throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        let lastError = null;
        
        for (const boardId of BOARD_IDS) {
            try {
                const queryParams = new URLSearchParams();
                queryParams.append('city', 'brantford');
                queryParams.append('type', 'Sale');
                queryParams.append('status', 'A');
                queryParams.append('class', 'residential');
                queryParams.append('sortBy', sortBy);
                queryParams.append('resultsPerPage', '12');
                queryParams.append('pageNum', '1');
                queryParams.append('listings', 'true');
                
                const url = `${BASE_URL}/listings?${queryParams.toString()}`;
                
                console.log(`🔍 Similar listings request for board ${boardId}:`, url);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'REPLIERS-API-KEY': API_KEY,
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    if (process.env.NODE_ENV === 'development') {
                        console.log(`Found similar listings on board ${boardId}:`, data);
                    }
                    
                    return this.processListingsResponse(data);
                } else {
                    const errorText = await response.text();
                    console.log(`Board ${boardId} failed with status ${response.status}: ${errorText}`);
                    
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
        return { listings: [], pagination: { page: 1, numPages: 1, pageSize: 12, count: 0 } };
    },

    // Get map clusters using correct API parameters
    async getMapClusters(bounds = {}) {
        if (!API_KEY) {
            throw new Error('Repliers API key is not configured. Please check your environment variables.');
        }

        try {
            const queryParams = new URLSearchParams();
            queryParams.append('city', 'brantford');
            queryParams.append('type', 'Sale');
            queryParams.append('status', 'A');
            queryParams.append('class', 'residential');
            queryParams.append('cluster', 'true');
            queryParams.append('clusterPrecision', '12');
            queryParams.append('operator', 'AND');
            queryParams.append('sortBy', 'updatedOnDesc');
            queryParams.append('listings', 'true');
            
            // Add map bounds if provided
            if (bounds && Object.keys(bounds).length > 0) {
                queryParams.append('map', JSON.stringify(bounds));
            }

            const url = `${BASE_URL}/listings?${queryParams.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'REPLIERS-API-KEY': API_KEY,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error(`Authentication failed. Please check your API key. Status: ${response.status}`);
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.map_clusters || data.clusters || [];
        } catch (error) {
            console.error('API Error in getMapClusters:', error);
            throw new Error(`Failed to fetch map clusters: ${error.message}`);
        }
    },

    // Format search parameters for API calls
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

    // Try all board IDs utility function
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