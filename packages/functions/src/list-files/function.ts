import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Bucket } from 'sst/node/bucket';
import { json } from '../lib/lambda-utils';
import { IS3Service, S3Service, wrapped } from '@whiskeyhub-document-service/core';
import responseMonitoring from '../lib/middleware/response-monitoring';

const s3: IS3Service = new S3Service();

const listFiles: APIGatewayProxyHandlerV2 = async event => {
  const { objects, folders } = await s3.retrieveGroupedObjects(
    Bucket.DocumentBucket.bucketName,
    event.queryStringParameters ? event.queryStringParameters!['prefix'] : undefined
  );
  return json({ objects, folders });
};

export const handler = wrapped(listFiles).use(responseMonitoring());
