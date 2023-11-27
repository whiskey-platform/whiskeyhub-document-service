import {
  DynamoDBService,
  IDynamoDBService,
  logger,
  wrapped,
} from '@whiskeyhub-document-service/core';
import { S3Handler } from 'aws-lambda';
import { contentType } from 'mime-types';
import { MongoClient } from 'mongodb';
import { Config } from 'sst/node/config';
import { Table } from 'sst/node/table';

const dynamo: IDynamoDBService = new DynamoDBService();
const mongo = new MongoClient(Config.DB_CONNECTION);

const s3EventHandler: S3Handler = async event => {
  const db = mongo.db('whiskey-db');
  const collection = db.collection('files');

  for (const record of event.Records) {
    if (record.eventName.includes('ObjectRemoved')) {
      await collection.deleteOne({ key: record.s3.object.key });
      continue;
    }
    if (record.eventName.includes('ObjectCreated')) {
      let mimetype = contentType(record.s3.object.key ?? '');
      if (mimetype === false) mimetype = 'application/octet-stream';

      await collection.updateOne(
        { key: record.s3.object.key },
        {
          $set: {
            key: record.s3.object.key,
            size: record.s3.object.size,
            contentType: contentType(record.s3.object.key),
            lastModified: record.eventTime,
            parentKey: (record.s3.object.key ?? '').split('/').slice(0, -1).join('/') + '/' || '/',
          },
        },
        { upsert: true }
      );

      const document = await collection.findOne({ key: record.s3.object.key });
      if (!document!.created) {
        await collection.updateOne(
          { key: record.s3.object.key },
          {
            $set: {
              created: record.eventTime,
            },
          }
        );
      }

      continue;
    }
  }
  await dynamo.addItemsToTable(event.Records, Table.EventsTable.tableName);
};

export const handler = wrapped(s3EventHandler);
