import { CopyObjectCommand, DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import { logger, wrapped } from '@whiskeyhub-document-service/core';
import { tracer } from '@whiskeyhub-document-service/core/src/utils/tracer';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Bucket } from 'sst/node/bucket';
import responseMonitoring from '../lib/middleware/response-monitoring';

const rawS3 = new S3Client({});
tracer.captureAWSv3Client(rawS3);

const copyFile: APIGatewayProxyHandlerV2 = async event => {
  const { from, to } = JSON.parse(event.body!);
  const move = event.queryStringParameters?.move ? true : false;

  logger.info(`Copying ${from} to ${to}`);
  const copyRequest = new CopyObjectCommand({
    Bucket: Bucket.DocumentBucket.bucketName,
    CopySource: Bucket.DocumentBucket.bucketName + '/' + from,
    Key: to,
  });
  await rawS3.send(copyRequest);

  if (move) {
    const deleteRequest = new DeleteObjectsCommand({
      Bucket: Bucket.DocumentBucket.bucketName,
      Delete: {
        Objects: [from].map(Key => ({
          Key,
        })),
      },
    });
    await rawS3.send(deleteRequest);
  }

  logger.info(`File copied successfully`);

  return {
    body: JSON.stringify({
      message: 'success',
    }),
  };
};

export const handler = wrapped(copyFile).use(responseMonitoring());
