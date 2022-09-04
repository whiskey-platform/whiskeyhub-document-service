import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import middy from '@middy/core';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { json } from 'lib/lambda-utils';
import requestMonitoring from 'lib/middleware/request-monitoring';
import { Config } from '@serverless-stack/node/config';

const listFiles: APIGatewayProxyHandlerV2 = async () => {
  const s3 = new S3Client({ region: process.env.AWS_REGION });
  const listRequest = new ListObjectsV2Command({ Bucket: Config.BUCKET_NAME });
  const itemsRes = await s3.send(listRequest);
  return json({ items: itemsRes.Contents });
};

export const handler = middy(listFiles).use(requestMonitoring());
