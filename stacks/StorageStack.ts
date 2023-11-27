import { Duration } from 'aws-cdk-lib';
import { StorageClass } from 'aws-cdk-lib/aws-s3';
import { StackContext, Bucket, Config, Script } from 'sst/constructs';

export function Storage({ stack }: StackContext) {
  const logBucket = new Bucket(stack, 'DocumentBucketLogs');
  const bucket = new Bucket(stack, 'DocumentBucket', {
    name: stack.stage === 'prod' ? 'mattwyskiel-documents' : undefined,
    cdk: {
      bucket: {
        serverAccessLogsBucket: logBucket.cdk.bucket,
        versioned: true,
        lifecycleRules: [
          {
            noncurrentVersionsToRetain: 2,
            noncurrentVersionExpiration: Duration.days(60),
            noncurrentVersionTransitions: [
              {
                storageClass: StorageClass.INFREQUENT_ACCESS,
                transitionAfter: Duration.days(30),
              },
            ],
          },
        ],
      },
    },
  });

  const DB_CONNECTION = new Config.Secret(stack, 'DB_CONNECTION');

  new Script(stack, 'SeedDatabase', {
    // handler: 'packages/functions/src/housekeeping/seed-database.handler',
    // bind: [bucket],
    onCreate: {
      handler: 'packages/functions/src/housekeeping/seed-database.handler',
      bind: [bucket, DB_CONNECTION],
    },
    onDelete: {
      handler: 'packages/functions/src/housekeeping/remove-files-in-database.handler',
      bind: [bucket, DB_CONNECTION],
    },
  });

  return {
    bucket,
    DB_CONNECTION,
  };
}
