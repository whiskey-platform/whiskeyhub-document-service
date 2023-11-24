// lambda handler that lists all object versions from S3, transforms them into a Document object, and saves them to MongoDB.

import { S3Client, paginateListObjectsV2 } from '@aws-sdk/client-s3';
import { Handler } from 'aws-lambda';
import { contentType } from 'mime-types';
import { Bucket } from 'sst/node/bucket';
import { MongoClient } from 'mongodb';
import { Config } from 'sst/node/config';
import { Document } from '@whiskeyhub-document-service/core';
const s3 = new S3Client({});
const mongo = new MongoClient(Config.DB_CONNECTION);

export const handler: Handler = async (event, context) => {
  // list all object versions from S3
  const objects = [];
  const paginator = paginateListObjectsV2(
    { client: s3 },
    { Bucket: Bucket.DocumentBucket.bucketName }
  );

  for await (const page of paginator) {
    objects.push(...(page.Contents ?? []));
  }

  // transform them into a Document object
  const documents: Document[] = objects.map(object => {
    let mimetype = contentType(object.Key ?? '');
    if (mimetype === false) mimetype = 'application/octet-stream';
    return {
      key: object.Key ?? '',
      contentType: mimetype,
      size: object.Size!,
      created: object.LastModified!,
      lastModified: object.LastModified!,
      parentKey: (object.Key ?? '').split('/').slice(0, -1).join('/') + '/' || '/',
    };
  });

  // save them to MongoDB
  const db = mongo.db();
  const collection = db.collection('files');
  await collection.insertMany(documents);
};
