import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    retries = 3,
    timeout = 30000,
  ): Promise<UploadApiResponse> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'raw',
              public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
              use_filename: true,
              unique_filename: true,
              timeout,
            },
            (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
              if (error) {
                this.logger.error(`Cloudinary upload error (attempt ${attempt}): ${error.message}`);
                return reject(error);
              }
              if (!result) {
                return reject(new Error('Cloudinary upload failed: No result returned.'));
              }
              resolve(result);
            },
          );

          const readableStream = new Readable();
          readableStream.push(file.buffer);
          readableStream.push(null);
          readableStream.pipe(uploadStream);
        });
      } catch (error) {
        if (attempt === retries) {
          this.logger.error(`Cloudinary upload failed after ${retries} attempts: ${error.message}`);
          throw new InternalServerErrorException('Failed to upload file to cloud storage.');
        }
        this.logger.warn(`Retrying Cloudinary upload (attempt ${attempt + 1})...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
    throw new InternalServerErrorException('Failed to upload file to cloud storage.');
  }

  async deleteFile(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      if (result.result === 'ok') {
        return result;
      }
      throw new Error('Failed to delete file from Cloudinary.');
    } catch (error) {
      try {
        return await cloudinary.uploader.destroy(publicId);
      } catch (imgError) {
        this.logger.error(`Failed to delete Cloudinary file ${publicId}: ${imgError.message}`);
        throw new InternalServerErrorException('Failed to delete file from cloud storage.');
      }
    }
  }
}