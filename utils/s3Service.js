require('dotenv').config();
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const path = require('path');

/**
 * S3 Service for uploading and managing files
 */
class S3Service {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.S3_BUCKET;
  }

  /**
   * Convert product name to a safe folder name
   * @param {string} productName - Product name
   * @returns {string} - Safe folder name (lowercase, no special chars, spaces replaced with hyphens)
   */
  sanitizeProductName(productName) {
    if (!productName) return 'unknown';
    return productName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Generate a unique file name
   * @param {string} originalName - Original file name
   * @param {string} folder - Folder path in S3 (e.g., 'products', 'users')
   * @param {string} productName - Optional product name to organize by product
   * @returns {string} - Unique file name with path
   */
  generateFileName(originalName, folder = 'products', productName = null) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9]/g, '_');
    
    // If product name is provided, organize by product name
    if (productName) {
      const productFolder = this.sanitizeProductName(productName);
      return `${folder}/${productFolder}/${timestamp}-${randomString}-${baseName}${extension}`;
    }
    
    // Default: flat structure in products folder
    return `${folder}/${timestamp}-${randomString}-${baseName}${extension}`;
  }

  /**
   * Upload file to S3
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name (with path)
   * @param {string} contentType - MIME type (e.g., 'image/jpeg')
   * @returns {Promise<Object>} - Upload result with URL
   */
  async uploadFile(fileBuffer, fileName, contentType) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
        // Files are private by default - use Presigned URLs for access
        // ACL is not set, keeping files private
      });

      await this.s3Client.send(command);

      // Construct the public URL
      const fileUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com/${fileName}`;

      return {
        success: true,
        url: fileUrl,
        key: fileName,
        bucket: this.bucketName,
      };
    } catch (error) {
      console.error('❌ S3 Upload Error:', error);
      throw {
        success: false,
        error: error.message || 'Failed to upload file to S3',
        code: error.Code || error.name || 'UPLOAD_ERROR',
      };
    }
  }

  /**
   * Delete file from S3
   * @param {string} fileKey - S3 object key (file path)
   * @returns {Promise<Object>} - Delete result
   */
  async deleteFile(fileKey) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      console.error('❌ S3 Delete Error:', error);
      throw {
        success: false,
        error: error.message || 'Failed to delete file from S3',
        code: error.Code || error.name || 'DELETE_ERROR',
      };
    }
  }

  /**
   * Extract S3 key from URL
   * @param {string} url - S3 file URL
   * @returns {string|null} - S3 key or null if invalid URL
   */
  extractKeyFromUrl(url) {
    try {
      // Extract key from URL like: https://bucket-name.s3.region.amazonaws.com/folder/file.jpg
      const match = url.match(/https?:\/\/[^\/]+\/(.+)$/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get signed URL for private file access (if needed)
   * @param {string} fileKey - S3 object key
   * @param {number} expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   * @returns {Promise<string>} - Signed URL
   */
  async getSignedUrl(fileKey, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('❌ S3 Signed URL Error:', error);
      throw {
        success: false,
        error: error.message || 'Failed to generate signed URL',
      };
    }
  }

  /**
   * Validate file type
   * @param {string} mimeType - MIME type
   * @param {Array<string>} allowedTypes - Allowed MIME types
   * @returns {boolean} - True if valid
   */
  isValidFileType(mimeType, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']) {
    return allowedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Validate file size
   * @param {number} sizeInBytes - File size in bytes
   * @param {number} maxSizeInMB - Maximum size in MB (default: 5MB)
   * @returns {boolean} - True if valid
   */
  isValidFileSize(sizeInBytes, maxSizeInMB = 5) {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return sizeInBytes <= maxSizeInBytes;
  }
}

// Create singleton instance
const s3Service = new S3Service();

module.exports = s3Service;

