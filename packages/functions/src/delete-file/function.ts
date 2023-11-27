import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { S3Service, wrapped } from '@whiskeyhub-document-service/core';
import responseMonitoring from '../lib/middleware/response-monitoring';
import { Bucket } from 'sst/node/bucket';

const s3 = new S3Service();

const deleteFile: APIGatewayProxyHandlerV2 = async event => {
  console.log('Deleting file:', JSON.parse(event.body!).key);
  await s3.deleteObjects([JSON.parse(event.body!).key], Bucket.DocumentBucket.bucketName);
  console.log('File deleted:', JSON.parse(event.body!).key);
  return {
    body: JSON.stringify({
      message: 'Success',
    }),
  };
};

export const handler = wrapped(deleteFile).use(responseMonitoring());
