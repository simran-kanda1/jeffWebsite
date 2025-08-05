import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CompactPagination = ({ currentPage, totalPages, onPageChange }) => {
  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  // Calculate which page numbers to show (compact version)
  const getVisiblePages = () => {
    const delta = 1; // Show fewer pages in compact mode
    const range = [];
    const rangeWithDots = [];
    
    // Always show first page
    if (currentPage > 3) {
      rangeWithDots.push(1);
      if (currentPage > 4) {
        rangeWithDots.push('...');
      }
    }

    // Show pages around current page
    for (let i = Math.max(1, currentPage - delta); 
         i <= Math.min(totalPages, currentPage + delta); 
         i++) {
      if (!rangeWithDots.includes(i)) {
        rangeWithDots.push(i);
      }
    }

    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  const styles = {
    paginationContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    paginationButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '32px',
      height: '32px',
      padding: '0 6px',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      color: '#374151',
      transition: 'all 0.2s ease',
      userSelect: 'none'
    },
    paginationButtonActive: {
      backgroundColor: '#050E3D',
      borderColor: '#050E3D',
      color: 'white'
    },
    navigationButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      cursor: 'pointer',
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
      fontSize: '13px',
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
        <ChevronLeft size={14} />
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
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

export default CompactPagination;