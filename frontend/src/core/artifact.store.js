const fs = require('fs').promises;
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class ArtifactStore {
  constructor() {
    this.mode = process.env.ARTIFACT_STORAGE || 'local'; // 'local' or 's3'
    this.localPath = process.env.ARTIFACTS_PATH || '/opt/seo-analyzer-nextjs/artifacts';
    this.s3Client = null;
    this.bucketName = process.env.DO_SPACES_BUCKET || 'seo-analyzer-artifacts';
    
    if (this.mode === 's3') {
      this.initS3();
    } else {
      this.initLocal();
    }
  }

  async initLocal() {
    try {
      await fs.mkdir(this.localPath, { recursive: true });
      console.log(`[STORAGE] Local artifact storage initialized at ${this.localPath}`);
    } catch (error) {
      console.error('Failed to create local storage directory:', error);
    }
  }

  initS3() {
    const endpoint = process.env.DO_SPACES_ENDPOINT || 'https://fra1.digitaloceanspaces.com';
    const region = process.env.DO_SPACES_REGION || 'fra1';
    
    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY || '',
        secretAccessKey: process.env.DO_SPACES_SECRET || '',
      },
    });
    
    console.log(`[S3] S3-compatible storage initialized (${endpoint})`);
  }

  async put(key, content, contentType = 'application/json') {
    try {
      if (this.mode === 'local') {
        const filePath = path.join(this.localPath, key);
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        // Handle different content types properly
        let data;
        let encoding = 'utf8';
        
        if (Buffer.isBuffer(content)) {
          // Binary content (like PDFs) - save as-is
          data = content;
          encoding = null; // Binary mode
        } else if (typeof content === 'string') {
          data = content;
        } else {
          // Objects - JSON stringify
          data = JSON.stringify(content);
        }
        
        await fs.writeFile(filePath, data, encoding);
        
        console.log(`[SAVE] Saved artifact locally: ${key}`);
        const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
        return { key, size };
      } else {
        // S3/Spaces upload - handle different content types
        let body;
        if (Buffer.isBuffer(content)) {
          body = content; // Binary content
        } else if (typeof content === 'string') {
          body = content; // Text content
        } else {
          body = JSON.stringify(content); // Objects
        }
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: body,
          ContentType: contentType,
        });
        
        await this.s3Client.send(command);
        console.log(`☁️ Uploaded artifact to S3: ${key}`);
        return { key, size: Buffer.byteLength(body) };
      }
    } catch (error) {
      console.error(`Failed to store artifact ${key}:`, error);
      throw error;
    }
  }

  async get(key) {
    try {
      if (this.mode === 'local') {
        const filePath = path.join(this.localPath, key);
        
        // Detect if this is a binary file based on file extension
        const isBinary = key.endsWith('.pdf') || key.endsWith('.png') || key.endsWith('.jpg') || 
                        key.endsWith('.jpeg') || key.endsWith('.gif') || key.endsWith('.webp');
        
        if (isBinary) {
          // Read as buffer for binary files
          const data = await fs.readFile(filePath);
          return data; // Returns Buffer
        } else {
          // Read as text for JSON/text files
          const data = await fs.readFile(filePath, 'utf8');
          return data;
        }
      } else {
        // S3/Spaces download
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });
        
        const response = await this.s3Client.send(command);
        const data = await streamToString(response.Body);
        return data;
      }
    } catch (error) {
      console.error(`Failed to retrieve artifact ${key}:`, error);
      return null;
    }
  }

  async getUrl(key, expiresInSeconds = 3600) {
    if (this.mode === 'local') {
      // For local mode, return a URL that the Express server can handle
      return `/api/artifacts/${key}`;
    } else {
      // Generate signed URL for S3/Spaces
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });
      
      return url;
    }
  }

  async delete(key) {
    try {
      if (this.mode === 'local') {
        const filePath = path.join(this.localPath, key);
        await fs.unlink(filePath);
        console.log(`[DELETE] Deleted local artifact: ${key}`);
      } else {
        // S3/Spaces delete - implement when needed
        console.log(`[DELETE] S3 delete not implemented yet for: ${key}`);
      }
    } catch (error) {
      console.error(`Failed to delete artifact ${key}:`, error);
    }
  }

  generateKey(analysisId, type, extension = 'json') {
    const timestamp = new Date().toISOString().split('T')[0];
    return `analyses/${timestamp}/${analysisId}/${type}.${extension}`;
  }

  generateKeyWithDate(analysisId, type, date, extension = 'json') {
    const timestamp = new Date(date).toISOString().split('T')[0];
    return `analyses/${timestamp}/${analysisId}/${type}.${extension}`;
  }
}

// Helper function for S3 stream
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

module.exports = new ArtifactStore();