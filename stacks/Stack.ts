import { StackContext, Api, Bucket, Config, Cognito } from '@serverless-stack/resources';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';

export function Stack({ stack }: StackContext) {
  const bucket = new Bucket(stack, 'DocumentBucket');
  const BUCKET_NAME = new Config.Parameter(stack, 'BUCKET_NAME', { value: bucket.bucketName });

  const auth = new Cognito(stack, 'Auth', {
    cdk: {
      userPool: UserPool.fromUserPoolId(stack, 'AuthUserPool', process.env.USER_POOL_ID ?? ''),
      userPoolClient: UserPoolClient.fromUserPoolClientId(
        stack,
        'AuthUserPoolClient',
        process.env.USER_POOL_CLIENT ?? ''
      ),
    },
  });

  const api = new Api(stack, 'Api', {
    routes: {
      'GET /files': 'functions/list-files/function.handler',
      'POST /files': 'functions/upload-file/function.handler',
    },
    defaults: {
      function: {
        permissions: [bucket],
        config: [BUCKET_NAME],
      },
      authorizer: 'userPool',
    },
    authorizers: {
      userPool: {
        type: 'user_pool',
        userPool: {
          id: process.env.USER_POOL_ID ?? '',
          clientIds: [auth.userPoolClientId],
        },
      },
    },
  });
  stack.addOutputs({
    ApiEndpoint: api.url,
    Bucket: bucket.bucketName,
    AuthClient: auth.userPoolClientId,
  });
}
