const s3Service = require('./s3Service');

/**
 * Generate Presigned URL for product image
 * @param {string} imageUrl - S3 image URL or key
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns {Promise<string|null>} - Presigned URL or null if invalid
 */
async function getProductImagePresignedUrl(imageUrl, expiresIn = 3600) {
  try {
    if (!imageUrl) {
      return null;
    }

    // Ensure imageUrl is a string
    // Handle cases where imageUrl might be an object or other type
    let urlString;
    if (typeof imageUrl === 'string') {
      urlString = imageUrl;
    } else if (typeof imageUrl === 'object' && imageUrl !== null) {
      // If it's an object, try to extract URL from common properties
      urlString = imageUrl.url || imageUrl.presignedUrl || imageUrl.originalUrl || null;
      if (!urlString || typeof urlString !== 'string') {
        console.warn('⚠️  imageUrl is an object but no valid URL property found:', imageUrl);
        return null;
      }
    } else {
      console.warn('⚠️  imageUrl is not a string or object:', typeof imageUrl, imageUrl);
      return null;
    }

    // Extract S3 key from URL or use as-is if it's already a key
    let fileKey;
    if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
      fileKey = s3Service.extractKeyFromUrl(urlString);
    } else {
      fileKey = urlString;
    }

    if (!fileKey) {
      console.warn('⚠️  Could not extract S3 key from URL:', urlString);
      return null;
    }

    // Generate Presigned URL
    const presignedUrl = await s3Service.getSignedUrl(fileKey, expiresIn);
    return presignedUrl;
  } catch (error) {
    console.error('❌ Error generating Presigned URL:', error);
    return null;
  }
}

/**
 * Generate Presigned URLs for product images in a product object
 * @param {Object} product - Product object with images.url
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns {Promise<Object>} - Product object with presigned image URL
 */
async function addPresignedUrlToProduct(product, expiresIn = 3600) {
  try {
    if (!product) {
      return product;
    }

    // Handle different image data structures
    let imageUrl = null;
    
    // Case 1: product.images is an object with url property
    if (product.images && typeof product.images === 'object' && product.images.url) {
      imageUrl = product.images.url;
    }
    // Case 2: product.images is a string (legacy format)
    else if (typeof product.images === 'string') {
      imageUrl = product.images;
    }
    // Case 3: product.image is a string (alternative field name)
    else if (typeof product.image === 'string') {
      imageUrl = product.image;
    }
    // Case 4: product.images exists but no url property
    else if (product.images) {
      console.warn('⚠️  Product images field exists but no valid URL found:', product.images);
      return product;
    }

    if (!imageUrl) {
      // No image URL found, return product as-is
      return product;
    }

    const presignedUrl = await getProductImagePresignedUrl(imageUrl, expiresIn);
    
    // Create a new object with presigned URL
    const productWithPresignedUrl = product.toObject ? product.toObject() : { ...product };
    
    if (presignedUrl) {
      // Ensure images is an object
      if (!productWithPresignedUrl.images || typeof productWithPresignedUrl.images !== 'object') {
        productWithPresignedUrl.images = {};
      }
      
      productWithPresignedUrl.images = {
        ...productWithPresignedUrl.images,
        url: imageUrl, // Ensure url is set
        presignedUrl: presignedUrl,
        // Keep original URL for reference
        originalUrl: imageUrl,
      };
    }

    return productWithPresignedUrl;
  } catch (error) {
    console.error('❌ Error adding Presigned URL to product:', error);
    return product;
  }
}

/**
 * Generate Presigned URLs for multiple products
 * @param {Array} products - Array of product objects
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns {Promise<Array>} - Array of products with presigned URLs
 */
async function addPresignedUrlsToProducts(products, expiresIn = 3600) {
  try {
    if (!Array.isArray(products)) {
      return products;
    }

    // Process all products in parallel
    const productsWithUrls = await Promise.all(
      products.map(product => addPresignedUrlToProduct(product, expiresIn))
    );

    return productsWithUrls;
  } catch (error) {
    console.error('❌ Error adding Presigned URLs to products:', error);
    return products;
  }
}

module.exports = {
  getProductImagePresignedUrl,
  addPresignedUrlToProduct,
  addPresignedUrlsToProducts,
};

