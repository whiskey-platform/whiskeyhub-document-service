import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import { Bucket } from 'sst/node/bucket';
import { APIGatewayJSONBodyEventHandler, json } from '../lib/lambda-utils';
import { logger } from '../lib/logger';
import requestMonitoring from '../lib/middleware/request-monitoring';

const inputSchema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
        },
      },
      required: ['key'],
    },
  },
  required: ['key'],
} as const;

const uploadFile: APIGatewayJSONBodyEventHandler<
  typeof inputSchema.properties.body
> = async event => {
  logger.info('Uploading new file', { body: event.body });
  const s3 = new S3Client({ region: process.env.AWS_REGION });
  const putRequest = new PutObjectCommand({
    Bucket: Bucket.DocumentBucket.bucketName,
    Key: event.body.key,
  });
  logger.info('Obtaining pre-signed URL for direct upload', { input: putRequest.input });
  const signedURL = await getSignedUrl(s3, putRequest);
  logger.info('Retrieved pre-signed URL', { url: signedURL });
  return json({ signedURL });
};

export const handler = middy(uploadFile)
  .use(jsonBodyParser())
  .use(requestMonitoring<typeof inputSchema.properties.body>());
