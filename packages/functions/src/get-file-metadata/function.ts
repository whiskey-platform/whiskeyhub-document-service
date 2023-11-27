import { wrapped } from '@whiskeyhub-document-service/core';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import responseMonitoring from '../lib/middleware/response-monitoring';
import { MongoClient } from 'mongodb';
import { Config } from 'sst/node/config';

const mongo = new MongoClient(Config.DB_CONNECTION);

const getFileMetadata: APIGatewayProxyHandlerV2 = async event => {
  const key = event.pathParameters!.key!;

  try {
    const db = mongo.db('whiskey-db');
    const collection = db.collection('files');

    const document = await collection.findOne({ key });

    if (!document) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: 'File not found',
        }),
      };
    }

    return {
      body: JSON.stringify(document),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: (error as Error).message,
      }),
    };
  }
};

export const handler = wrapped(getFileMetadata).use(responseMonitoring());
