import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Bucket } from 'sst/node/bucket';
import { json } from '../lib/lambda-utils';
import { wrapped } from '@whiskeyhub-document-service/core';
import responseMonitoring from '../lib/middleware/response-monitoring';

const listFiles: APIGatewayProxyHandlerV2 = async () => {
  const s3 = new S3Client({ region: process.env.AWS_REGION });
  const listRequest = new ListObjectsV2Command({ Bucket: Bucket.DocumentBucket.bucketName });
  const itemsRes = await s3.send(listRequest);
  return json({ items: itemsRes.Contents });
};

export const handler = wrapped(listFiles).use(responseMonitoring());
