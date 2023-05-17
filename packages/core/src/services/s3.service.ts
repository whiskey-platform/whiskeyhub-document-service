import { CopyObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';

export interface IS3Service {
  copyObject: (CopySource: string, Bucket: string, Key: string) => Promise<void>;
}

export class S3Service implements IS3Service {
  private s3Client = new S3Client({ region: process.env.AWS_REGION });
  public async copyObject(CopySource: string, Bucket: string, Key: string): Promise<void> {
    logger.info(`Copying ${CopySource} to ${Bucket}/${Key}`);
    const copyRequest = new CopyObjectCommand({
      Bucket,
      CopySource,
      Key,
    });
    await this.s3Client.send(copyRequest);
  }
}
