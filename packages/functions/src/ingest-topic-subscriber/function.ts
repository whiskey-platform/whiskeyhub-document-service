import { SNSHandler } from 'aws-lambda';
import {
  DocumentIngestMessage,
  S3Service,
  logger,
  wrapped,
} from '@whiskeyhub-document-service/core';
import { Bucket } from 'sst/node/bucket';

const s3 = new S3Service();

const ingestTopicSubscriber: SNSHandler = async event => {
  for (const record of event.Records) {
    logger.info('Handling SNS event record', { record });
    const input: DocumentIngestMessage = JSON.parse(record.Sns.Message);
    logger.info('Extracted event', { event: input });

    await s3.copyObject(
      `${input.sourceBucket}/${input.sourceKey}`,
      Bucket.DocumentBucket.bucketName,
      input.destinationKey
    );
  }
};

export const handler = wrapped(ingestTopicSubscriber);
