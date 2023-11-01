import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { wrapped } from '@whiskeyhub-document-service/core';
import { tracer } from '@whiskeyhub-document-service/core/src/utils/tracer';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Bucket } from 'sst/node/bucket';

const rawS3 = new S3Client({});
tracer.captureAWSv3Client(rawS3);

const uploadFile: APIGatewayProxyHandlerV2 = async event => {
  const key = event.pathParameters!.key!;

  const request = new PutObjectCommand({
    Bucket: Bucket.DocumentBucket.bucketName,
    Key: key,
  });
  const url = getSignedUrl(rawS3, request);

  return {
    body: JSON.stringify({
      url,
    }),
  };
};

export const handler = wrapped(uploadFile);
