import { S3Service, logger, wrapped } from '@whiskeyhub-document-service/core';
import { SNSHandler } from 'aws-lambda';
import { DateTime } from 'luxon';
import { extension } from 'mime-types';
import { Bucket } from 'sst/node/bucket';

interface ReceiptEvent {
  action: 'ADD' | 'DELETE';
  details: {
    id: string;
    timestamp: number;
    store: string;
    documentType: string;
    sourceBucket?: string;
    sourceKey?: string;
  };
  replay?: boolean;
}

const s3 = new S3Service();

const receiptsEventHandler: SNSHandler = async event => {
  const deleteKeys: string[] = [];
  const copyObjects: { source: string; key: string }[] = [];
  for (const record of event.Records) {
    const payload: ReceiptEvent = JSON.parse(record.Sns.Message);

    const dateTime = DateTime.fromMillis(payload.details.timestamp);
    const year = dateTime.year;
    const dateString = dateTime.toFormat('yyyy-MM-dd');

    if (payload.action === 'ADD') {
      copyObjects.push({
        source: `${payload.details.sourceBucket!}/${payload.details.sourceKey}`,
        key: `Finances/Receipts/${year}/${dateString} - ${payload.details.store} (${
          payload.details.id
        }).${extension(payload.details.documentType)}`,
      });
    } else if (payload.action === 'DELETE') {
      deleteKeys.push(
        `Finances/Receipts/${year}/${dateString} - ${payload.details.store} (${
          payload.details.id
        }).${extension(payload.details.documentType)}`
      );
    } else {
      logger.error('Unhandled payload action', { action: payload.action });
    }
  }

  logger.info(`Adding ${copyObjects.length} receipt documents`);
  for (const info of copyObjects) {
    await s3.copyObject(info.source, Bucket.DocumentBucket.bucketName, info.key);
  }

  logger.info(`Deleting ${deleteKeys.length} receipt documents`);
  if (deleteKeys.length > 0) {
    await s3.deleteObjects(deleteKeys, Bucket.DocumentBucket.bucketName);
  }
};

export const handler = wrapped(receiptsEventHandler);
