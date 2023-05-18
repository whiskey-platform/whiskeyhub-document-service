import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
  _Object,
} from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';
import { chunk } from 'lodash';

export interface IS3Service {
  copyObject: (CopySource: string, Bucket: string, Key: string) => Promise<void>;
  retrieveObjects: (Bucket: string, Prefix?: string | undefined) => Promise<_Object[]>;
  deleteObjects: (keys: string[], Bucket: string) => Promise<void>;
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
  public async retrieveObjects(Bucket: string, Prefix?: string | undefined): Promise<_Object[]> {
    const getRequest = new ListObjectsV2Command({
      Bucket,
      Prefix,
    });
    const response = await this.s3Client.send(getRequest);
    const objects = response.Contents ?? [];
    let ContinuationToken = response.NextContinuationToken;
    while (ContinuationToken) {
      const getRequest = new ListObjectsV2Command({
        Bucket,
      });
      const response = await this.s3Client.send(getRequest);
      if (response.Contents) {
        objects?.push(...response.Contents!);
      }
      ContinuationToken = response.NextContinuationToken;
    }

    return objects;
  }

  public async deleteObjects(keys: string[], Bucket: string) {
    const groupedKeys = chunk(keys, 1000);
    for (const group of groupedKeys) {
      const deleteRequest = new DeleteObjectsCommand({
        Bucket,
        Delete: {
          Objects: group.map(Key => ({
            Key,
          })),
        },
      });
      await this.s3Client.send(deleteRequest);
    }
  }
}
