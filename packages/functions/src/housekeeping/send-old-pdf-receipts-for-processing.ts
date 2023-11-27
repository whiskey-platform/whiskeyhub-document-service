import { DatabaseService, SNSService, logger, wrapped } from '@whiskeyhub-document-service/core';
import { Handler } from 'aws-lambda';
import { DateTime } from 'luxon';
import { contentType } from 'mime-types';
import { Bucket } from 'sst/node/bucket';
import { Config } from 'sst/node/config';
import { Topic } from 'sst/node/topic';

const sns = new SNSService();
const db = new DatabaseService(Config.DB_CONNECTION);

const sendOldPDFReceiptsForProcessing: Handler = async event => {
  logger.info('Retrieving all receipt files');
  // const receiptFiles = await s3.retrieveObjects(
  //   Bucket.DocumentBucket.bucketName,
  //   'Finances/Receipts'
  // );
  const receiptFiles = await db.collection
    .find({
      key: { $in: /^Finances\/Receipts\// },
    })
    .toArray();

  logger.info('Filtering receipt files');
  const unaddedReceiptFiles = receiptFiles.filter(
    val =>
      !val.key?.match(/[0-7][0-9A-HJKMNP-TV-Z]{25}/) && // don't have ULID
      !val.key?.endsWith('/') // not a folder
  );

  const events = unaddedReceiptFiles.map(file => {
    logger.info(`Unhandled Receipt: ${file.key}`);
    const extracted = file.key!.match(/(\d{4}-\d{2}-\d{2}) - (.*)\.(.*)/);
    const dateString = extracted![1];
    const timestamp = DateTime.fromFormat(dateString, 'yyyy-MM-dd').toMillis();

    const store = extracted![2];
    const fileExt = extracted![3];

    return {
      id: Math.random().toString(36).substring(2, 13),
      payload: {
        store,
        timestamp,
        documentType: contentType(fileExt),
        sourceDataPath: `${Bucket.DocumentBucket.bucketName}/${file.key!}`,
      },
    };
  });

  await sns.batchEvents(events, Topic.ReceiptsIngestTopic.topicArn);
};

export const handler = wrapped(sendOldPDFReceiptsForProcessing);
