import {
  IS3Service,
  ISNSService,
  S3Service,
  SNSService,
  logger,
} from '@whiskeyhub-document-service/core';
import { Handler } from 'aws-lambda';
import { DateTime } from 'luxon';
import { contentType } from 'mime-types';
import { Bucket } from 'sst/node/bucket';
import { Topic } from 'sst/node/topic';

const s3: IS3Service = new S3Service();
const sns: ISNSService = new SNSService();

export const handler: Handler = async event => {
  logger.info('Retrieving all receipt files');
  const receiptFiles = await s3.retrieveObjects(
    Bucket.DocumentBucket.bucketName,
    'Finances/Receipts'
  );

  logger.info('Filtering receipt files');
  const unaddedReceiptFiles = receiptFiles.filter(
    val => !val.Key?.match(/[0-7][0-9A-HJKMNP-TV-Z]{25}/) // don't have ULID
  );

  const events = unaddedReceiptFiles.map(file => {
    logger.info(`Unhandled Receipt: ${file.Key}`);
    const extracted = file.Key!.match(/(\d{4}-\d{2}-\d{2}) - (.*)\.(.*)/);
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
      },
    };
  });

  await sns.batchEvents(events, Topic.ReceiptsIngestTopic.topicArn);
};
