const s3Service = require('./s3Service');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

/**
 * Get all images for a specific product by product name
 * @param {string} productName - Product name
 * @returns {Promise<Array>} - Array of image URLs
 */
async function getProductImages(productName) {
  try {
    if (!productName) {
      return [];
    }

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const bucketName = process.env.S3_BUCKET;
    const productFolder = s3Service.sanitizeProductName(productName);
    const prefix = `products/${productFolder}/`;

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    // Return full S3 URLs
    const imageUrls = response.Contents.map((object) => {
      return `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com/${object.Key}`;
    });

    return imageUrls;
  } catch (error) {
    console.error('❌ Error getting product images:', error);
    return [];
  }
}

/**
 * Get all images in the products folder (regardless of subfolder)
 * @param {number} maxKeys - Maximum number of images to return (default: 1000)
 * @returns {Promise<Array>} - Array of image URLs with metadata
 */
async function getAllProductImages(maxKeys = 1000) {
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const bucketName = process.env.S3_BUCKET;
    const prefix = 'products/';

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    // Filter only image files and return with metadata
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const images = response.Contents
      .filter((object) => {
        const key = object.Key.toLowerCase();
        return imageExtensions.some(ext => key.endsWith(ext));
      })
      .map((object) => {
        const url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com/${object.Key}`;
        return {
          url: url,
          key: object.Key,
          size: object.Size,
          lastModified: object.LastModified,
          // Extract product name from folder structure if available
          productName: extractProductNameFromKey(object.Key),
        };
      });

    return images;
  } catch (error) {
    console.error('❌ Error getting all product images:', error);
    return [];
  }
}

/**
 * Extract product name from S3 key
 * @param {string} key - S3 object key (e.g., "products/red-roses-bouquet/123.jpg")
 * @returns {string|null} - Product name or null if in root
 */
function extractProductNameFromKey(key) {
  try {
    // Remove "products/" prefix
    const path = key.replace(/^products\//, '');
    
    // If there's a folder structure (contains "/")
    if (path.includes('/')) {
      const folderName = path.split('/')[0];
      // Convert folder name back to readable format (optional)
      return folderName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return null; // Image is in root products folder
  } catch (error) {
    return null;
  }
}

/**
 * Get product image folder path
 * @param {string} productName - Product name
 * @returns {string} - Folder path in S3
 */
function getProductImageFolder(productName) {
  if (!productName) {
    return 'products';
  }
  const productFolder = s3Service.sanitizeProductName(productName);
  return `products/${productFolder}`;
}

module.exports = {
  getProductImages,
  getProductImageFolder,
  getAllProductImages,
  extractProductNameFromKey,
};

