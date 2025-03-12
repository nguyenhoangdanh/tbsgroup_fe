/**
 * Get the initials from a full name
 * @param {string} fullName - The full name to parse
 * @param {number} [maxInitials=2] - Maximum number of initials to return
 * @returns {string} Initials in uppercase
 */
export const getInitialsFromName = (fullName: string, maxInitials: number = 2): string => {
    // Return empty string if fullName is not provided
    if (!fullName) return '';
    
    // Split the name into parts
    const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
    
    // If no valid parts, return empty string
    if (nameParts.length === 0) return '';
    
    // For Vietnamese names, we typically want to use the first name (last part) 
    // and perhaps the middle name (second to last part if available)
    let initials = '';
    
    if (nameParts.length === 1) {
      // If only one name part, use the first character of that
      initials = nameParts[0].charAt(0);
    } else if (maxInitials === 1) {
      // If maxInitials is 1, just use the first character of the first name (last part)
      initials = nameParts[nameParts.length - 1].charAt(0);
    } else {
      // Use the standard: first character of first part and first character of last part
      // For Vietnamese names: this would be first character of family name and first character of first name
      const firstPart = nameParts[0];
      const lastPart = nameParts[nameParts.length - 1];
      
      if (nameParts.length >= maxInitials) {
        // If there are enough name parts, use first character of first maxInitials parts
        initials = nameParts.slice(0, maxInitials).map(part => part.charAt(0)).join('');
      } else {
        // Otherwise, use all name parts
        initials = nameParts.map(part => part.charAt(0)).join('');
      }
    }
    
    return initials.toUpperCase();
  };
  
  interface DisplayInitialsOptions {
    vietnameseStyle?: boolean;
    maxInitials?: number;
  }
  
  /**
   * Advanced function to get display initials based on name type
   * @param {string} fullName - The full name to parse
   * @param {DisplayInitialsOptions} options - Configuration options
   * @returns {string} Initials in uppercase
   */
  export const getDisplayInitials = (fullName: string, options: DisplayInitialsOptions = {}): string => {
    const { vietnameseStyle = true, maxInitials = 2 } = options;
    
    if (!fullName) return '';
    
    const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
    
    if (nameParts.length === 0) return '';
    
    // Simple case - just one name part
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    // For Vietnamese style (prioritize given name)
    if (vietnameseStyle) {
      if (maxInitials === 1) {
        // Just use the first character of the given name (last part)
        return nameParts[nameParts.length - 1].charAt(0).toUpperCase();
      } else if (nameParts.length === 2) {
        // For two part names, use both initials
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
      } else {
        // For multi-part Vietnamese names (e.g. Nguyễn Văn An)
        // Use family name and given name (first and last parts)
        const familyInitial = nameParts[0].charAt(0);
        const givenInitial = nameParts[nameParts.length - 1].charAt(0);
        
        return `${familyInitial}${givenInitial}`.toUpperCase();
      }
    } 
    
    // Western style - use first maxInitials parts
    return nameParts.slice(0, maxInitials).map(part => part.charAt(0)).join('').toUpperCase();
  };