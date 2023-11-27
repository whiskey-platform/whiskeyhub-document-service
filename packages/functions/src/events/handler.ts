import { DatabaseService, DynamoDBService, wrapped } from '@whiskeyhub-document-service/core';
import { S3Handler } from 'aws-lambda';
import { DateTime } from 'luxon';
import { contentType } from 'mime-types';
import { Config } from 'sst/node/config';
import { Table } from 'sst/node/table';

const dynamo = new DynamoDBService();
const db = new DatabaseService(Config.DB_CONNECTION);

const s3EventHandler: S3Handler = async event => {
  const collection = db.collection;

  for (const record of event.Records) {
    if (record.eventName.includes('ObjectRemoved')) {
      await db.deleteDocument(record.s3.object.key);
      continue;
    }
    if (record.eventName.includes('ObjectCreated')) {
      let mimetype = contentType(record.s3.object.key ?? '');
      if (mimetype === false) mimetype = 'application/octet-stream';

      await db.upsertDocument({
        key: record.s3.object.key,
        filename: record.s3.object.key?.split('/').findLast(v => v) ?? record.s3.object.key,
        size: record.s3.object.size,
        contentType: mimetype,
        lastModified: DateTime.fromISO(record.eventTime).toJSDate(),
        parentKey: (record.s3.object.key ?? '').split('/').slice(0, -1).join('/') + '/' || '/',
      });

      const document = await collection.findOne({ key: record.s3.object.key });
      if (!document!.created) {
        await db.updateDocument({
          key: record.s3.object.key,
          created: DateTime.fromISO(record.eventTime).toJSDate(),
        });
      }

      continue;
    }
  }
  await dynamo.addItemsToTable(event.Records, Table.EventsTable.tableName);
};

export const handler = wrapped(s3EventHandler);
