import { ApiGatewayV1Api, Config, Function, StackContext, use } from 'sst/constructs';
import {
  AuthorizationType,
  AwsIntegration,
  BasePathMapping,
  DomainName,
  EndpointType,
  IdentitySource,
  MethodOptions,
  PassthroughBehavior,
  RequestAuthorizer,
  Resource,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Storage } from './StorageStack';
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export function API({ stack, app }: StackContext) {
  const { bucket } = use(Storage);

  const apiGatewayRole = new Role(stack, 'api-gateway-role', {
    assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    inlinePolicies: {
      AllowFullS3AccessToBucket: new PolicyDocument({
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['s3:*'],
            resources: [bucket.bucketArn],
          }),
        ],
      }),
    },
  });

  const AUTH_BASE_URL = new Config.Parameter(stack, 'AUTH_BASE_URL', {
    value: StringParameter.valueFromLookup(stack, `/sst/auth-service/${app.stage}/Api/api/url`),
  });
  const authorizerFunction = new Function(stack, 'AuthorizerFunction', {
    handler: 'packages/functions/src/authorizer/function.handler',
    bind: [AUTH_BASE_URL],
  });
  const authorizer = new RequestAuthorizer(stack, 'Authorizer', {
    handler: authorizerFunction,
    identitySources: [
      IdentitySource.header('Authorization'),
      IdentitySource.header('x-whiskey-client-id'),
      IdentitySource.header('x-whiskey-client-secret'),
    ],
  });

  //Create REST API
  const restApi = new RestApi(stack, 'S3ObjectsRestApi', {
    endpointConfiguration: {
      types: [EndpointType.EDGE],
    },
    binaryMediaTypes: ['*/*'],
  });
  const itemResource = restApi.root.addResource('{item}');

  // GET / -> list all objects in bucket
  const listObjectsIntegration = new AwsIntegration({
    service: 's3',
    region: 'us-east-1',
    path: bucket.bucketName,
    integrationHttpMethod: 'GET',
    options: {
      credentialsRole: apiGatewayRole,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': 'integration.response.header.Content-Type',
          },
        },
      ],
    },
  });
  const listObjectsMethodOptions: MethodOptions = {
    authorizationType: AuthorizationType.CUSTOM,
    authorizer,
    methodResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Content-Type': true,
        },
      },
    ],
  };
  restApi.root.addMethod('GET', listObjectsIntegration, listObjectsMethodOptions);

  // HEAD /{object} -> get object metadata
  const getObjectMetadataIntegration = new AwsIntegration({
    service: 's3',
    region: 'us-east-1',
    path: `${bucket.bucketName}/{object}`,
    integrationHttpMethod: 'HEAD',
    options: {
      credentialsRole: apiGatewayRole,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestParameters: {
        'integration.request.path.object': 'method.request.path.item',
        'integration.request.header.Accept': 'method.request.header.Accept',
      },
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': 'integration.response.header.Content-Type',
          },
        },
      ],
    },
  });

  //GetObject (Metadata) method options
  const getObjectMetadataMethodOptions = {
    authorizationType: AuthorizationType.CUSTOM,
    authorizer,
    requestParameters: {
      'method.request.path.item': true,
      'method.request.header.Accept': true,
    },
    methodResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Content-Type': true,
        },
      },
    ],
  };
  itemResource.addMethod('HEAD', getObjectMetadataIntegration, getObjectMetadataMethodOptions);

  if (!app.local && app.stage !== 'local') {
    const domainName = DomainName.fromDomainNameAttributes(stack, 'ApiDomain', {
      domainName: StringParameter.valueFromLookup(
        stack,
        `/sst-outputs/${app.stage}-api-infra-Infra/domainName`
      ),
      domainNameAliasTarget: StringParameter.valueFromLookup(
        stack,
        `/sst-outputs/${app.stage}-api-infra-Infra/regionalDomainName`
      ),
      domainNameAliasHostedZoneId: StringParameter.valueFromLookup(
        stack,
        `/sst-outputs/${app.stage}-api-infra-Infra/regionalHostedZoneId`
      ),
    });
    new BasePathMapping(stack, 'BasePathMapping', {
      domainName,
      restApi,
      basePath: 'documents',
    });
  }

  new ApiGatewayV1Api(stack, 'DocumentsAPI', {
    cdk: {
      restApi,
    },
  });
}
