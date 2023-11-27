import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { json } from '../lib/lambda-utils';
import { DynamoDBService, wrapped } from '@whiskeyhub-document-service/core';
import { Table } from 'sst/node/table';
import { DateTime } from 'luxon';

const dynamo = new DynamoDBService();

const getEventsFromDynamo = async (type: string, afterTime: string) =>
  await dynamo.getItems(Table.EventsTable.tableName, afterTime, 'eventTime', 'eventName', type);

const getEvents: APIGatewayProxyHandlerV2 = async event => {
  const afterTime = event.queryStringParameters!.afterTime!;
  const afterDateTime = DateTime.fromMillis(parseInt(afterTime));
  const afterISO = afterDateTime.toISO()!;

  console.log(`Received request for events after time: ${afterISO}`);

  return json({
    ObjectCreated: [
      ...((await getEventsFromDynamo('ObjectCreated:Put', afterISO)) ?? []),
      ...((await getEventsFromDynamo('ObjectCreated:CompleteMultipartUpload', afterISO)) ?? []),
      ...((await getEventsFromDynamo('ObjectCreated:Copy', afterISO)) ?? []),
    ],
    ObjectRemoved: [
      ...((await getEventsFromDynamo('ObjectRemoved:Delete', afterISO)) ?? []),
      ...((await getEventsFromDynamo('ObjectRemoved:DeleteMarkerCreated', afterISO)) ?? []),
    ],
  });
};

export const handler = wrapped(getEvents);
