import {
  DynamoDBService,
  IDynamoDBService,
  logger,
  wrapped,
} from '@whiskeyhub-document-service/core';
import { S3Handler } from 'aws-lambda';
import { Table } from 'sst/node/table';

const dynamo: IDynamoDBService = new DynamoDBService();

const s3EventHandler: S3Handler = async event => {
  await dynamo.addItemsToTable(event.Records, Table.EventsTable.tableName);
};

export const handler = wrapped(s3EventHandler);
