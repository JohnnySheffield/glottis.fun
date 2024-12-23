// Metadata version to allow future format changes
const METADATA_VERSION = 1;

/**
 * Pack token metadata into bytes
 * @param {Object} metadata Token metadata
 * @param {string} metadata.description Token description
 * @param {string} metadata.logoUrl Token logo URL
 * @param {Object} metadata.social Social and website URLs
 * @param {string} [metadata.social.link1] First URL
 * @param {string} [metadata.social.link2] Second URL
 * @param {string} [metadata.social.link3] Third URL
 * @returns {string} Packed metadata as hex string
 */
export function packMetadata({ description, logoUrl, social }) {
  // Create metadata object with version
  const metadataObj = {
    v: METADATA_VERSION,
    d: description || '',
    l: logoUrl || '',
    s: {
      link1: social?.link1 || '',
      link2: social?.link2 || '',
      link3: social?.link3 || ''
    }
  };
  
  // Convert to JSON and then to hex string
  const jsonStr = JSON.stringify(metadataObj);
  return jsonStr;
}

/**
 * Unpack token metadata from bytes
 * @param {string} packedMetadata Packed metadata from contract
 * @returns {Object|null} Unpacked metadata object or null if invalid
 */
export function unpackMetadata(packedMetadata) {
  try {
    // Try to parse as JSON
    const metadataObj = JSON.parse(packedMetadata);
    
    // Validate version and structure
    if (metadataObj.v !== METADATA_VERSION) {
      console.warn('Unknown metadata version:', metadataObj.v);
      return null;
    }
    
    // Handle both old and new metadata formats
    const social = metadataObj.s || {};
    return {
      description: metadataObj.d || '',
      logoUrl: metadataObj.l || '',
      social: {
        link1: social.link1 || social.twitter || '',
        link2: social.link2 || social.discord || '',
        link3: social.link3 || social.website || ''
      }
    };
  } catch (error) {
    console.warn('Failed to parse token metadata:', error);
    return null;
  }
}

/**
 * Check if metadata is valid
 * @param {Object} metadata Metadata object to validate
 * @returns {boolean} True if metadata is valid
 */
export function isValidMetadata(metadata) {
  return (
    metadata &&
    typeof metadata.description === 'string' &&
    typeof metadata.logoUrl === 'string' &&
    typeof metadata.social === 'object' &&
    metadata.social !== null
  );
}
