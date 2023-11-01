import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Bucket } from 'sst/node/bucket';
import { IS3Service, S3Service, wrapped } from '@whiskeyhub-document-service/core';
import responseMonitoring from '../lib/middleware/response-monitoring';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { tracer } from '@whiskeyhub-document-service/core/src/utils/tracer';

const rawS3 = new S3Client({});
tracer.captureAWSv3Client(rawS3);

const listFiles: APIGatewayProxyHandlerV2 = async event => {
  const getRequest = new ListObjectsV2Command({
    Bucket: Bucket.DocumentBucket.bucketName,
    Prefix: event.queryStringParameters?.prefix,
    ContinuationToken: event.queryStringParameters?.pageToken,
    MaxKeys: parseInt(event.queryStringParameters?.maxItems ?? '1000'),
    Delimiter: '/',
  });
  const response = await rawS3.send(getRequest);
  return {
    body: JSON.stringify({
      files: response.Contents?.map(item => ({
        key: item.Key,
        etag: item.ETag,
        lastModified: item.LastModified?.toISOString(),
        size: item.Size,
      })),
      folders: response.CommonPrefixes?.map(p => p.Prefix!) ?? [],
      nextPage: response.NextContinuationToken,
    }),
  };
};

export const handler = wrapped(listFiles).use(responseMonitoring());
