import { S3Service, logger, wrapped } from '@whiskeyhub-document-service/core';
import { Handler } from 'aws-lambda';
import { Bucket } from 'sst/node/bucket';

const s3 = new S3Service();

const deleteEmptyFiles: Handler = async _event => {
  const objects = await s3.retrieveObjects(Bucket.DocumentBucket.bucketName);

  const objectSizes = objects.map(v => ({ key: v.Key, size: v.Size }));
  const emptyObjects = objectSizes.filter(v => v.size === 0);

  if (emptyObjects.length > 0) {
    logger.info(`Deleting ${emptyObjects.length} empty objects`);
    await s3.deleteObjects(
      emptyObjects.map(v => v.key!),
      Bucket.DocumentBucket.bucketName
    );
    logger.info('Deleted objects successfully');
  } else {
    logger.info('No empty objects found!');
  }
};

export const handler = wrapped(deleteEmptyFiles);
