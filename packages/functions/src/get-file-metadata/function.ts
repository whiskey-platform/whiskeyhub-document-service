import { GetObjectAttributesCommand, S3Client, S3ServiceException } from '@aws-sdk/client-s3';
import { wrapped } from '@whiskeyhub-document-service/core';
import { tracer } from '@whiskeyhub-document-service/core/src/utils/tracer';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Bucket } from 'sst/node/bucket';
import responseMonitoring from '../lib/middleware/response-monitoring';

const rawS3 = new S3Client({});
tracer.captureAWSv3Client(rawS3);

const getFileMetadata: APIGatewayProxyHandlerV2 = async event => {
  const key = event.pathParameters!.key!;

  const getRequest = new GetObjectAttributesCommand({
    Bucket: Bucket.DocumentBucket.bucketName,
    Key: key,
    ObjectAttributes: ['ETag', 'ObjectSize'],
  });
  try {
    const response = await rawS3.send(getRequest);

    return {
      body: JSON.stringify({
        key: event.queryStringParameters!.key,
        lastModified: response.LastModified,
        etag: response.ETag,
        size: response.ObjectSize,
      }),
    };
  } catch (error) {
    if (error as S3ServiceException) {
      const err = error as S3ServiceException;
      return {
        statusCode: err.$response?.statusCode,
        body: JSON.stringify({
          message: err.message,
        }),
      };
      // (error as S3ServiceException).$response?.statusCode;
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: (error as Error).message,
        }),
      };
    }
  }
};

export const handler = wrapped(getFileMetadata).use(responseMonitoring());
