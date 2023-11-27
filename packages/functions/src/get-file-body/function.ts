import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { wrapped, logger } from '@whiskeyhub-document-service/core';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Bucket } from 'sst/node/bucket';
import responseMonitoring from '../lib/middleware/response-monitoring';
import { tracer } from '@whiskeyhub-document-service/core/src/utils/tracer';

const rawS3 = new S3Client({});
tracer.captureAWSv3Client(rawS3);

const getFileBody: APIGatewayProxyHandlerV2 = async event => {
  const key = event.pathParameters!.key!;
  logger.info(`Retrieving file body for key: ${key}`);

  const getRequest = new GetObjectCommand({
    Bucket: Bucket.DocumentBucket.bucketName,
    Key: key,
  });
  const url = getSignedUrl(rawS3, getRequest);
  logger.info(`Generated signed URL`);

  return {
    body: JSON.stringify({
      url,
    }),
  };
};

export const handler = wrapped(getFileBody).use(responseMonitoring());
