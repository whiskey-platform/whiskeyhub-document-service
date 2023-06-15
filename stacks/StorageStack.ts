import { Duration } from 'aws-cdk-lib';
import { StorageClass } from 'aws-cdk-lib/aws-s3';
import { StackContext, Bucket } from 'sst/constructs';

export function Storage({ stack }: StackContext) {
  const bucket = new Bucket(stack, 'DocumentBucket', {
    name: stack.stage === 'prod' ? 'mattwyskiel-documents' : undefined,
    cdk: {
      bucket: {
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
  return {
    bucket,
  };
}
