import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CompactPagination = ({ currentPage, totalPages, onPageChange }) => {
  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  // FIXED: Mobile-first pagination logic - show fewer pages on mobile
  const getVisiblePages = () => {
    const isMobile = window.innerWidth <= 768;
    const delta = isMobile ? 0 : 1; // Show only current page on mobile, 1 on each side on desktop
    const range = [];
    const rangeWithDots = [];
    
    if (isMobile) {
      // Mobile: Show only current page with prev/next
      rangeWithDots.push(currentPage);
    } else {
      // Desktop: Show more pages
      // Always show first page if we're far from it
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

      // Always show last page if we're far from it
      if (currentPage < totalPages - 2) {
        if (currentPage < totalPages - 3) {
          rangeWithDots.push('...');
        }
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();
  const isMobile = window.innerWidth <= 768;

  const styles = {
    paginationContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '6px' : '8px',
      width: '100%',
      maxWidth: '100%',
      padding: isMobile ? '0 8px' : '0'
    },
    paginationButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: isMobile ? '28px' : '32px',
      height: isMobile ? '28px' : '32px',
      padding: '0',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: isMobile ? '12px' : '13px',
      fontWeight: '500',
      color: '#374151',
      transition: 'all 0.2s ease',
      userSelect: 'none',
      flexShrink: 0
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
      width: isMobile ? '32px' : '36px',
      height: isMobile ? '28px' : '32px',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      cursor: 'pointer',
      color: '#374151',
      transition: 'all 0.2s ease',
      flexShrink: 0
    },
    navigationButtonDisabled: {
      opacity: '0.4',
      cursor: 'not-allowed',
      backgroundColor: '#f9fafb'
    },
    dots: {
      display: 'flex',
      alignItems: 'center',
      padding: '0 2px',
      color: '#9ca3af',
      fontSize: isMobile ? '11px' : '13px',
      fontWeight: '500',
      minWidth: isMobile ? '16px' : '20px',
      justifyContent: 'center'
    },
    pageInfo: {
      fontSize: isMobile ? '11px' : '12px',
      color: '#6b7280',
      fontWeight: '500',
      minWidth: 'fit-content',
      textAlign: 'center',
      padding: '0 4px',
      whiteSpace: 'nowrap'
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
        aria-label="Previous page"
      >
        <ChevronLeft size={isMobile ? 12 : 14} />
      </button>

      {/* FIXED: Mobile page indicator */}
      {isMobile && (
        <div style={styles.pageInfo}>
          {currentPage} of {totalPages}
        </div>
      )}

      {/* FIXED: Desktop page numbers */}
      {!isMobile && visiblePages.map((pageNum, index) => {
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
            aria-label={`Go to page ${pageNum}`}
            aria-current={isActive ? 'page' : undefined}
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
        aria-label="Next page"
      >
        <ChevronRight size={isMobile ? 12 : 14} />
      </button>
    </div>
  );
};

export default CompactPagination;