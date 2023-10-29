import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Bucket } from 'sst/node/bucket';
import { json } from '../lib/lambda-utils';
import { IS3Service, S3Service, wrapped } from '@whiskeyhub-document-service/core';
import responseMonitoring from '../lib/middleware/response-monitoring';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

const s3: IS3Service = new S3Service();
const rawS3 = new S3Client({});

const listFiles: APIGatewayProxyHandlerV2 = async event => {
  if (event.queryStringParameters?.notGrouped === 'true') {
    const getRequest = new ListObjectsV2Command({
      Bucket: Bucket.DocumentBucket.bucketName,
      Prefix: event.queryStringParameters?.prefix,
      ContinuationToken: event.queryStringParameters?.pageToken,
      MaxKeys: parseInt(event.queryStringParameters?.maxItems ?? '1000'),
    });
    return {
      body: JSON.stringify(await rawS3.send(getRequest)),
    };
  } else {
    const { objects, folders } = await s3.retrieveGroupedObjects(
      Bucket.DocumentBucket.bucketName,
      event.queryStringParameters ? event.queryStringParameters!['prefix'] : undefined
    );
    return json({ objects, folders });
  }
};

export const handler = wrapped(listFiles).use(responseMonitoring());
