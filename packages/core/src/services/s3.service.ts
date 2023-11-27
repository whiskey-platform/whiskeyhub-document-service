import {
  CommonPrefix,
  CopyObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2CommandInput,
  S3Client,
  _Object,
  paginateListObjectsV2,
} from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';
import { chunk } from 'lodash';
import { tracer } from '../utils/tracer';

export class S3Service {
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
    logger.info(`Successfully copied ${CopySource} to ${Bucket}/${Key}`);
  }
  public async retrieveObjects(Bucket: string, Prefix?: string | undefined): Promise<_Object[]> {
    logger.info(`Retrieving objects from bucket ${Bucket}`);
    const objects: _Object[] = [];
    const baseRequest: ListObjectsV2CommandInput = {
      Bucket,
      Prefix,
    };

    for await (const page of paginateListObjectsV2({ client: this.s3Client }, baseRequest))
      objects.push(...(page.Contents ?? []));

    logger.info(`Retrieved ${objects.length} objects from bucket ${Bucket}`);
    return objects;
  }

  public async retrieveGroupedObjects(
    Bucket: string,
    Prefix?: string | undefined
  ): Promise<{ objects: _Object[]; folders: string[] }> {
    logger.info(`Retrieving grouped objects from bucket ${Bucket}`);
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
    logger.info(
      `Retrieved ${objects.length} objects and ${folders.length} folders from bucket ${Bucket}`
    );
    return { objects, folders };
  }

  public async deleteObjects(keys: string[], Bucket: string) {
    logger.info(`Deleting objects from bucket ${Bucket}`);
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
    logger.info(`Deleted objects from bucket ${Bucket}`);
  }

  public async objectHead(Key: string, Bucket: string) {
    logger.info(`Getting metadata for object ${Key} in bucket ${Bucket}`);
    const request = new HeadObjectCommand({
      Bucket,
      Key,
    });
    const response = await this.s3Client.send(request);
    logger.info(`Retrieved metadata for object ${Key} in bucket ${Bucket}`);
    return response;
  }
}
