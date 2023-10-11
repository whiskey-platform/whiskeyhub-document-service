import {
  CommonPrefix,
  CopyObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
  S3Client,
  _Object,
  paginateListObjectsV2,
} from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';
import { chunk } from 'lodash';
import { tracer } from '../utils/tracer';

export interface IS3Service {
  copyObject: (CopySource: string, Bucket: string, Key: string) => Promise<void>;
  retrieveObjects: (Bucket: string, Prefix?: string | undefined) => Promise<_Object[]>;
  deleteObjects: (keys: string[], Bucket: string) => Promise<void>;
  retrieveGroupedObjects: (
    Bucket: string,
    Prefix?: string | undefined
  ) => Promise<{ objects: _Object[]; folders: string[] }>;
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
    const objects: _Object[] = [];
    const baseRequest: ListObjectsV2CommandInput = {
      Bucket,
      Prefix,
    };

    for await (const page of paginateListObjectsV2({ client: this.s3Client }, baseRequest))
      objects.push(...(page.Contents ?? []));

    return objects;
  }

  public async retrieveGroupedObjects(
    Bucket: string,
    Prefix?: string | undefined
  ): Promise<{ objects: _Object[]; folders: string[] }> {
    const objects: _Object[] = [];
    const folders: string[] = [];
    const baseRequest: ListObjectsV2CommandInput = {
      Bucket,
      Prefix,
      Delimiter: '/',
    };
    for await (const page of paginateListObjectsV2({ client: this.s3Client }, baseRequest)) {
      objects.push(...(page.Contents ?? []));
      folders.push(...(page.CommonPrefixes ? page.CommonPrefixes!.map(v => v.Prefix ?? '') : []));
    }
    return { objects, folders };
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
