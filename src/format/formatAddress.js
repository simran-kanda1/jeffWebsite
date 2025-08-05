// Utility function to format address object
const formatAddress = (address) => {
    if (typeof address === 'string') {
      return address;
    }
    
    if (typeof address === 'object' && address !== null) {
      const parts = [];
      
      // Build address from components
      if (address.streetNumber) parts.push(address.streetNumber);
      if (address.streetDirectionPrefix) parts.push(address.streetDirectionPrefix);
      if (address.streetName) parts.push(address.streetName);
      if (address.streetSuffix) parts.push(address.streetSuffix);
      if (address.streetDirection) parts.push(address.streetDirection);
      if (address.unitNumber) parts.push(`Unit ${address.unitNumber}`);
      
      const streetAddress = parts.join(' ');
      const cityParts = [];
      
      if (address.city) cityParts.push(address.city);
      if (address.state || address.province) cityParts.push(address.state || address.province);
      if (address.zip) cityParts.push(address.zip);
      
      const fullAddress = [streetAddress, cityParts.join(', ')].filter(Boolean).join(', ');
      return fullAddress || 'Address not available';
    }
    
    return 'Address not available';
  };

export default formatAddress;