import { IS3Service, S3Service, logger, wrapped } from '@whiskeyhub-document-service/core';
import { Handler } from 'aws-lambda';
import { Bucket } from 'sst/node/bucket';

const s3: IS3Service = new S3Service();

const deleteOldPDFReceipts: Handler = async event => {
  logger.info('Retrieving all receipt files');
  const receiptFiles = await s3.retrieveObjects(
    Bucket.DocumentBucket.bucketName,
    'Finances/Receipts'
  );

  logger.info('Filtering receipt files');
  const oldReceiptFiles = receiptFiles.filter(
    val => !val.Key?.match(/[0-7][0-9A-HJKMNP-TV-Z]{25}/) // don't have ULID
  );

  logger.info('deleting old receipt files');
  await s3.deleteObjects(
    oldReceiptFiles.map(f => f.Key!),
    Bucket.DocumentBucket.bucketName
  );
  logger.info('deleted old receipt files');
};

export const handler = wrapped(deleteOldPDFReceipts);
