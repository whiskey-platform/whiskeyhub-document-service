import { Api, ApiDomainProps, Config, Function, StackContext, use } from 'sst/constructs';
import { Storage } from './StorageStack';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { DomainName } from '@aws-cdk/aws-apigatewayv2-alpha';

export function API({ stack, app }: StackContext) {
  const { bucket, DB_CONNECTION } = use(Storage);

  const AUTH_BASE_URL = new Config.Parameter(stack, 'AUTH_BASE_URL', {
    value: StringParameter.valueFromLookup(stack, `/sst/auth-service/${app.stage}/Api/api/url`),
  });
  const authorizerFunction = new Function(stack, 'AuthorizerFunction', {
    handler: 'packages/functions/src/authorizer/function.handler',
    bind: [AUTH_BASE_URL],
  });

  let customDomain: ApiDomainProps | undefined;
  if (!app.local && app.stage !== 'local') {
    customDomain = {
      path: 'documents',
      cdk: {
        domainName: DomainName.fromDomainNameAttributes(stack, 'ApiDomain', {
          name: StringParameter.valueFromLookup(
            stack,
            `/sst-outputs/${app.stage}-api-infra-Infra/domainName`
          ),
          regionalDomainName: StringParameter.valueFromLookup(
            stack,
            `/sst-outputs/${app.stage}-api-infra-Infra/regionalDomainName`
          ),
          regionalHostedZoneId: StringParameter.valueFromLookup(
            stack,
            `/sst-outputs/${app.stage}-api-infra-Infra/regionalHostedZoneId`
          ),
        }),
      },
    };
  }

  new Api(stack, 'DocumentsAPI', {
    authorizers: {
      Authorizer: {
        type: 'lambda',
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
    customDomain,
  });
}
