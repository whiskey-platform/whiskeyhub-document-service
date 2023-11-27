import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Bucket } from 'sst/node/bucket';
import { DatabaseService, wrapped } from '@whiskeyhub-document-service/core';
import responseMonitoring from '../lib/middleware/response-monitoring';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { tracer } from '@whiskeyhub-document-service/core/src/utils/tracer';
import { Config } from 'sst/node/config';

const rawS3 = new S3Client({});
tracer.captureAWSv3Client(rawS3);

const db = new DatabaseService(Config.DB_CONNECTION);

const listFiles: APIGatewayProxyHandlerV2 = async event => {
  const collection = db.collection;

  const getRequest = new ListObjectsV2Command({
    Bucket: Bucket.DocumentBucket.bucketName,
    Prefix: event.queryStringParameters?.prefix,
    ContinuationToken: event.queryStringParameters?.pageToken,
    MaxKeys: parseInt(event.queryStringParameters?.maxItems ?? '1000'),
    Delimiter: '/',
  });
  const response = await rawS3.send(getRequest);

  const filesCursor = collection.find({
    key: { $in: response.Contents?.map(item => item.Key!) ?? [] },
  });
  const files = await filesCursor.toArray();
  return {
    body: JSON.stringify({
      files,
      folders: response.CommonPrefixes?.map(p => p.Prefix!) ?? [],
      nextPage: response.NextContinuationToken,
    }),
  };
};

export const handler = wrapped(listFiles).use(responseMonitoring());
