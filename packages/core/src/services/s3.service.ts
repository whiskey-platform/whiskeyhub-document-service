import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  S3Client,
  _Object,
} from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';
import { chunk } from 'lodash';
import { tracer } from '../utils/tracer';

export interface IS3Service {
  copyObject: (CopySource: string, Bucket: string, Key: string) => Promise<void>;
  retrieveObjects: (Bucket: string, Prefix?: string | undefined) => Promise<_Object[]>;
  deleteObjects: (keys: string[], Bucket: string) => Promise<void>;
}

export class S3Service implements IS3Service {
  private s3Client: S3Client;
  constructor() {
    this.s3Client = new S3Client({ region: process.env.AWS_REGION });
    tracer.captureAWSv3Client(this.s3Client);
  }
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
    let ContinuationToken: string | undefined = undefined;
    const objects: _Object[] = [];
    const baseRequest: ListObjectsV2CommandInput = {
      Bucket,
      Prefix,
    };
    do {
      if (ContinuationToken !== undefined) baseRequest.ContinuationToken = ContinuationToken;
      const getRequest = new ListObjectsV2Command(baseRequest);
      const response = await this.s3Client.send(getRequest);
      objects.push(...(response.Contents ?? []));
      ContinuationToken = response.NextContinuationToken;
    } while (ContinuationToken !== undefined);
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

  public async objectHead(Key: string, Bucket: string) {
    const request = new HeadObjectCommand({
      Bucket,
      Key,
    });
    return await this.s3Client.send(request);
  }
}
