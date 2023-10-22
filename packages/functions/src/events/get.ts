import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { json } from '../lib/lambda-utils';
import { DynamoDBService, IDynamoDBService, wrapped } from '@whiskeyhub-document-service/core';
import { Table } from 'sst/node/table';
import { DateTime } from 'luxon';

const dynamo: IDynamoDBService = new DynamoDBService();

const getEventsFromDynamo = async (type: string, afterTime: string) =>
  await dynamo.getItems(Table.EventsTable.tableName, afterTime, 'eventTime', 'eventName', type);

const getEvents: APIGatewayProxyHandlerV2 = async event => {
  const afterTime = event.queryStringParameters!.afterTime!;
  const afterDateTime = DateTime.fromMillis(parseInt(afterTime));
  const afterISO = afterDateTime.toISO()!;
  return json({
    's3:ObjectCreated:Put': await getEventsFromDynamo('s3:ObjectCreated:Put', afterTime),
    's3:ObjectCreated:CompleteMultipartUpload': await getEventsFromDynamo(
      's3:ObjectCreated:CompleteMultipartUpload',
      afterISO
    ),
    's3:ObjectRemoved:Delete': await getEventsFromDynamo('s3:ObjectRemoved:Delete', afterTime),
    's3:ObjectRemoved:DeleteMarkerCreated': await getEventsFromDynamo(
      's3:ObjectRemoved:DeleteMarkerCreated',
      afterISO
    ),
  });
};

export const handler = wrapped(getEvents);
