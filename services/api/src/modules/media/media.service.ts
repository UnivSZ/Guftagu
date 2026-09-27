import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'guftagu-media';
    this.s3 = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
      },
    });
  }

  async getPresignedUploadUrl(userId: string, fileName: string, mimeType: string, size: number) {
    const maxSizes: Record<string, number> = {
      image: 10 * 1024 * 1024,
      voice: 5 * 1024 * 1024,
      file: 50 * 1024 * 1024,
    };
    const type = mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('audio/') ? 'voice' : 'file';
    if (size > (maxSizes[type] || maxSizes.file)) throw new BadRequestException(`File too large for type ${type}`);

    const key = `${userId}/${new Date().toISOString().slice(0,10)}/${uuidv4()}-${fileName}`;
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: mimeType });
    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

    return { uploadUrl: url, key, bucket: this.bucket, expiresIn: 3600 };
  }

  async getPresignedDownloadUrl(key: string) {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const url = await getSignedUrl(this.s3, command, { expiresIn: 900 });
    return { url, expiresIn: 900 };
  }
}
