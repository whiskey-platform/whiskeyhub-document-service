import {
  ApiGatewayV1Api,
  ApiGatewayV1ApiCustomDomainProps,
  Function,
  StackContext,
  use,
} from 'sst/constructs';
import {
  AwsIntegration,
  DomainName,
  EndpointType,
  IdentitySource,
  MethodOptions,
  PassthroughBehavior,
  RequestAuthorizer,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Storage } from './StorageStack';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export function API({ stack, app }: StackContext) {
  const { bucket } = use(Storage);

  const apiGatewayRole = new Role(stack, 'api-gateway-role', {
    assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
  });

  const addActionToPolicy = (action: string) => {
    apiGatewayRole.addToPolicy(
      new PolicyStatement({
        resources: [bucket.bucketArn],
        actions: [`${action}`],
      })
    );
  };

  const authorizerFunction = new Function(stack, 'AuthorizerFunction', {
    handler: 'packages/functions/src/authorizer/function.handler',
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

  //Create {item} API resource to read/write an object in a given bucket
  const bucketItemResource = restApi.root.addResource('{item}');

  //ListBucket (Objects) method
  addActionToPolicy('s3:ListBucket');
  const listBucketIntegration = new AwsIntegration({
    service: 's3',
    region: 'us-east-1',
    path: '{bucket}',
    integrationHttpMethod: 'GET',
    options: {
      credentialsRole: apiGatewayRole,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestParameters: { 'integration.request.path.bucket': bucket.bucketName },
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
  //ListBucket (Objects) method options
  const listBucketMethodOptions: MethodOptions = {
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
  restApi.root.addMethod('GET', listBucketIntegration, listBucketMethodOptions);

  //GetObject (Metadata) method
  addActionToPolicy('s3:GetObject');
  const getObjectMetadataIntegration = new AwsIntegration({
    service: 's3',
    region: 'us-east-1',
    path: '{bucket}/{object}',
    integrationHttpMethod: 'HEAD',
    options: {
      credentialsRole: apiGatewayRole,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestParameters: {
        'integration.request.path.bucket': bucket.bucketName,
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
  const getObjectMetadataMethodOptions: MethodOptions = {
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
  bucketItemResource.addMethod(
    'HEAD',
    getObjectMetadataIntegration,
    getObjectMetadataMethodOptions
  );

  //GetObject method
  addActionToPolicy('s3:GetObject');
  const getObjectIntegration = new AwsIntegration({
    service: 's3',
    region: 'us-east-1',
    path: '{bucket}/{object}',
    integrationHttpMethod: 'GET',
    options: {
      credentialsRole: apiGatewayRole,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestParameters: {
        'integration.request.path.bucket': bucket.bucketName,
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

  //GetObject method options
  const getObjectMethodOptions: MethodOptions = {
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
  bucketItemResource.addMethod('GET', getObjectIntegration, getObjectMethodOptions);

  //PutObject method
  addActionToPolicy('s3:PutObject');
  const putObjectIntegration = new AwsIntegration({
    service: 's3',
    region: 'us-east-1',
    path: '{bucket}/{object}',
    integrationHttpMethod: 'PUT',
    options: {
      credentialsRole: apiGatewayRole,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestParameters: {
        'integration.request.path.bucket': bucket.bucketName,
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

  //PutObject method options
  const putObjectMethodOptions: MethodOptions = {
    authorizer,
    requestParameters: {
      'method.request.path.item': true,
      'method.request.header.Accept': true,
      'method.request.header.Content-Type': true,
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
  bucketItemResource.addMethod('PUT', putObjectIntegration, putObjectMethodOptions);

  let customDomain: ApiGatewayV1ApiCustomDomainProps | undefined;
  if (!app.local && app.stage !== 'local') {
    customDomain = {
      path: 'documents',
      cdk: {
        domainName: DomainName.fromDomainNameAttributes(stack, 'ApiDomain', {
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
        }),
      },
    };
  }

  new ApiGatewayV1Api(stack, 'DocumentsAPI', {
    cdk: {
      restApi,
    },
    customDomain,
  });
}
