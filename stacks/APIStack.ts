import { Api, Config, Function, StackContext, use } from 'sst/constructs';
import { Storage } from './StorageStack';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export function API({ stack, app }: StackContext) {
  const { bucket } = use(Storage);

  const AUTH_BASE_URL = new Config.Parameter(stack, 'AUTH_BASE_URL', {
    value: StringParameter.valueFromLookup(stack, `/sst/auth-service/${app.stage}/Api/api/url`),
  });
  const authorizerFunction = new Function(stack, 'AuthorizerFunction', {
    handler: 'packages/functions/src/authorizer/function.handler',
    bind: [AUTH_BASE_URL],
  });

  const DB_CONNECTION = new Config.Secret(stack, 'DB_CONNECTION');

  new Api(stack, 'DocumentsAPI', {
    authorizers: {
      Authorizer: {
        type: 'lambda',
        identitySource: [
          '$request.header.Authorization',
          '$request.header.x-whiskey-client-id',
          '$request.header.x-whiskey-client-secret',
        ],
        function: authorizerFunction,
      },
    },
    routes: {
      'GET /': 'packages/functions/src/list-files/function.handler',
      'POST /copy-file': 'packages/functions/src/copy-file/function.handler',
      'GET /{key}/metadata': 'packages/functions/src/get-file-metadata/function.handler',
      'GET /{key}': 'packages/functions/src/get-file-body/function.handler',
      'PUT /{key}': 'packages/functions/src/upload-file/function.handler',
      'DELETE /{key}': 'packages/functions/src/delete-file/function.handler',
    },
    defaults: {
      authorizer: 'Authorizer',
      function: {
        bind: [DB_CONNECTION, bucket],
      },
    },
  });
}
