export class CompanyService {
  /**
   * Normalize company names to prevent duplicates
   * Removes common suffixes like Inc, LLC, Ltd, Corp, etc.
   */
  static normalizeCompanyName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b\.?/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }
  
  /**
   * Check if two company names likely refer to the same company
   * Uses normalized names and Levenshtein distance for fuzzy matching
   */
  static areSimilar(name1: string, name2: string): boolean {
    const norm1 = this.normalizeCompanyName(name1);
    const norm2 = this.normalizeCompanyName(name2);
    
    // Exact match after normalization
    if (norm1 === norm2) return true;
    
    // Check if one is contained in the other (for cases like "Google" vs "Google Inc")
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
    
    // Check Levenshtein distance for fuzzy matching (typos, slight variations)
    const distance = this.levenshteinDistance(norm1, norm2);
    return distance <= 2;
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   * Returns the minimum number of single-character edits needed to change one string into the other
   */
  private static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
  
  /**
   * Find potential duplicate companies in a list
   * Returns groups of similar company names
   */
  static findDuplicates(companies: Array<{ name: string }>): Array<Array<{ name: string }>> {
    const duplicateGroups: Array<Array<{ name: string }>> = [];
    const processed = new Set<string>();
    
    for (let i = 0; i < companies.length; i++) {
      if (processed.has(companies[i].name)) continue;
      
      const group: Array<{ name: string }> = [companies[i]];
      processed.add(companies[i].name);
      
      for (let j = i + 1; j < companies.length; j++) {
        if (processed.has(companies[j].name)) continue;
        
        if (this.areSimilar(companies[i].name, companies[j].name)) {
          group.push(companies[j]);
          processed.add(companies[j].name);
        }
      }
      
      if (group.length > 1) {
        duplicateGroups.push(group);
      }
    }
    
    return duplicateGroups;
  }
}
