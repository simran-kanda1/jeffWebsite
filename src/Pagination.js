import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, totalCount, pageSize, onPageChange }) => {
  // Don't show pagination if there's only one page or no results
  if (totalPages <= 1 || totalCount === 0) {
    return null;
  }

  // Calculate which page numbers to show
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];
    
    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return [...new Set(rangeWithDots)]; // Remove duplicates
  };

  const visiblePages = getVisiblePages();

  // Calculate result range
  const startResult = ((currentPage - 1) * pageSize) + 1;
  const endResult = Math.min(currentPage * pageSize, totalCount);

  const styles = {
    paginationContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 24px',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: 'white',
      position: 'relative',
      zIndex: '100'
    },
    resultInfo: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '500'
    },
    paginationControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    paginationButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '40px',
      height: '40px',
      padding: '0 8px',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      transition: 'all 0.2s ease',
      userSelect: 'none'
    },
    paginationButtonHover: {
      backgroundColor: '#f9fafb',
      borderColor: '#9ca3af'
    },
    paginationButtonActive: {
      backgroundColor: '#050E3D', // FIXED: Changed from green to dark blue
      borderColor: '#050E3D',
      color: 'white'
    },
    paginationButtonDisabled: {
      opacity: '0.5',
      cursor: 'not-allowed',
      backgroundColor: '#f9fafb'
    },
    navigationButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '10px 16px',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      transition: 'all 0.2s ease'
    },
    navigationButtonDisabled: {
      opacity: '0.5',
      cursor: 'not-allowed',
      backgroundColor: '#f9fafb'
    },
    dots: {
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px',
      color: '#9ca3af',
      fontSize: '14px',
      fontWeight: '500'
    }
  };

  const handlePageClick = (pageNumber) => {
    if (pageNumber !== '...' && pageNumber !== currentPage && onPageChange) {
      onPageChange(pageNumber);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div style={styles.paginationContainer}>
      <div style={styles.resultInfo}>
        Showing {startResult.toLocaleString()} to {endResult.toLocaleString()} of {totalCount.toLocaleString()} results
      </div>
      
      <div style={styles.paginationControls}>
        {/* Previous Button */}
        <button
          style={{
            ...styles.navigationButton,
            ...(currentPage <= 1 ? styles.navigationButtonDisabled : {})
          }}
          onClick={handlePrevious}
          disabled={currentPage <= 1}
          onMouseEnter={(e) => {
            if (currentPage > 1) {
              e.target.style.backgroundColor = '#f9fafb';
              e.target.style.borderColor = '#9ca3af';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage > 1) {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#d1d5db';
            }
          }}
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {/* Page Numbers */}
        {visiblePages.map((pageNum, index) => {
          if (pageNum === '...') {
            return (
              <div key={`dots-${index}`} style={styles.dots}>
                ...
              </div>
            );
          }

          const isActive = pageNum === currentPage;
          
          return (
            <button
              key={pageNum}
              style={{
                ...styles.paginationButton,
                ...(isActive ? styles.paginationButtonActive : {})
              }}
              onClick={() => handlePageClick(pageNum)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#d1d5db';
                }
              }}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          style={{
            ...styles.navigationButton,
            ...(currentPage >= totalPages ? styles.navigationButtonDisabled : {})
          }}
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          onMouseEnter={(e) => {
            if (currentPage < totalPages) {
              e.target.style.backgroundColor = '#f9fafb';
              e.target.style.borderColor = '#9ca3af';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage < totalPages) {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#d1d5db';
            }
          }}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;