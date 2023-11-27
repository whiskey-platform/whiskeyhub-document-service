import { DatabaseService, wrapped, logger } from '@whiskeyhub-document-service/core';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import responseMonitoring from '../lib/middleware/response-monitoring';
import { Config } from 'sst/node/config';

const db = new DatabaseService(Config.DB_CONNECTION);

const getFileMetadata: APIGatewayProxyHandlerV2 = async event => {
  const key = event.pathParameters!.key!;

  try {
    logger.info(`Fetching document with key: ${key}`);
    const document = await db.getDocument(key);

    if (!document) {
      logger.warn(`Document not found with key: ${key}`);
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: 'File not found',
        }),
      };
    }

    logger.info(`Document found with key: ${key}`);
    return {
      body: JSON.stringify(document),
    };
  } catch (error) {
    logger.error(`Error fetching document with key: ${key}`, error as Error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: (error as Error).message,
      }),
    };
  }
};

export const handler = wrapped(getFileMetadata).use(responseMonitoring());
