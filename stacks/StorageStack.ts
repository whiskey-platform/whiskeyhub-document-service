import { StackContext, Bucket } from 'sst/constructs';

export function Storage({ stack }: StackContext) {
  const bucket = new Bucket(stack, 'DocumentBucket', {
    name: stack.stage === 'prod' ? 'mattwyskiel-documents' : undefined,
    cdk: {
      bucket: {
        versioned: true,
      },
    },
  });
  return {
    bucket,
  };
}
