import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { IS3Service, S3Service, wrapped } from '@whiskeyhub-document-service/core';
import responseMonitoring from '../lib/middleware/response-monitoring';
import { Bucket } from 'sst/node/bucket';

const s3: IS3Service = new S3Service();

const deleteFile: APIGatewayProxyHandlerV2 = async event => {
  await s3.deleteObjects([JSON.parse(event.body!).key], Bucket.DocumentBucket.bucketName);
  return {
    body: JSON.stringify({
      message: 'Success',
    }),
  };
};

export const handler = wrapped(deleteFile).use(responseMonitoring());
