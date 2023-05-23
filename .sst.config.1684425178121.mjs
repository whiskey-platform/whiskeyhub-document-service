import { createRequire as topLevelCreateRequire } from 'module';const require = topLevelCreateRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// stacks/APIStack.ts
import {
  ApiGatewayV1Api,
  Function,
  use
} from "sst/constructs";
import {
  AwsIntegration,
  DomainName,
  EndpointType,
  IdentitySource,
  PassthroughBehavior,
  RequestAuthorizer,
  RestApi
} from "aws-cdk-lib/aws-apigateway";

// stacks/StorageStack.ts
import { Bucket } from "sst/constructs";
function Storage({ stack }) {
  const bucket = new Bucket(stack, "DocumentBucket", {
    name: stack.stage === "prod" ? "mattwyskiel-documents" : void 0
  });
  return {
    bucket
  };
}
__name(Storage, "Storage");

// stacks/APIStack.ts
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
function API({ stack, app }) {
  const { bucket } = use(Storage);
  const apiGatewayRole = new Role(stack, "api-gateway-role", {
    assumedBy: new ServicePrincipal("apigateway.amazonaws.com")
  });
  const addActionToPolicy = /* @__PURE__ */ __name((action) => {
    apiGatewayRole.addToPolicy(
      new PolicyStatement({
        resources: [bucket.bucketArn],
        actions: [`${action}`]
      })
    );
  }, "addActionToPolicy");
  const authorizerFunction = new Function(stack, "AuthorizerFunction", {
    handler: "packages/functions/src/authorizer/function.handler"
  });
  const authorizer = new RequestAuthorizer(stack, "Authorizer", {
    handler: authorizerFunction,
    identitySources: [
      IdentitySource.header("Authorization"),
      IdentitySource.header("x-whiskey-client-id"),
      IdentitySource.header("x-whiskey-client-secret")
    ]
  });
  const restApi = new RestApi(stack, "S3ObjectsRestApi", {
    endpointConfiguration: {
      types: [EndpointType.EDGE]
    },
    binaryMediaTypes: ["*/*"]
  });
  const bucketItemResource = restApi.root.addResource("{item}");
  addActionToPolicy("s3:ListBucket");
  const listBucketIntegration = new AwsIntegration({
    service: "s3",
    region: "us-east-1",
    path: "{bucket}",
    integrationHttpMethod: "GET",
    options: {
      credentialsRole: apiGatewayRole,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestParameters: { "integration.request.path.bucket": bucket.bucketName },
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Content-Type": "integration.response.header.Content-Type"
          }
        }
      ]
    }
  });
  const listBucketMethodOptions = {
    authorizer,
    methodResponses: [
      {
        statusCode: "200",
        responseParameters: {
          "method.response.header.Content-Type": true
        }
      }
    ]
  };
  restApi.root.addMethod("GET", listBucketIntegration, listBucketMethodOptions);
  addActionToPolicy("s3:GetObject");
  const getObjectMetadataIntegration = new AwsIntegration({
    service: "s3",
    region: "us-east-1",
    path: "{bucket}/{object}",
    integrationHttpMethod: "HEAD",
    options: {
      credentialsRole: apiGatewayRole,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestParameters: {
        "integration.request.path.bucket": bucket.bucketName,
        "integration.request.path.object": "method.request.path.item",
        "integration.request.header.Accept": "method.request.header.Accept"
      },
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Content-Type": "integration.response.header.Content-Type"
          }
        }
      ]
    }
  });
  const getObjectMetadataMethodOptions = {
    authorizer,
    requestParameters: {
      "method.request.path.item": true,
      "method.request.header.Accept": true
    },
    methodResponses: [
      {
        statusCode: "200",
        responseParameters: {
          "method.response.header.Content-Type": true
        }
      }
    ]
  };
  bucketItemResource.addMethod(
    "HEAD",
    getObjectMetadataIntegration,
    getObjectMetadataMethodOptions
  );
  addActionToPolicy("s3:GetObject");
  const getObjectIntegration = new AwsIntegration({
    service: "s3",
    region: "us-east-1",
    path: "{bucket}/{object}",
    integrationHttpMethod: "GET",
    options: {
      credentialsRole: apiGatewayRole,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestParameters: {
        "integration.request.path.bucket": bucket.bucketName,
        "integration.request.path.object": "method.request.path.item",
        "integration.request.header.Accept": "method.request.header.Accept"
      },
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Content-Type": "integration.response.header.Content-Type"
          }
        }
      ]
    }
  });
  const getObjectMethodOptions = {
    authorizer,
    requestParameters: {
      "method.request.path.item": true,
      "method.request.header.Accept": true
    },
    methodResponses: [
      {
        statusCode: "200",
        responseParameters: {
          "method.response.header.Content-Type": true
        }
      }
    ]
  };
  bucketItemResource.addMethod("GET", getObjectIntegration, getObjectMethodOptions);
  addActionToPolicy("s3:PutObject");
  const putObjectIntegration = new AwsIntegration({
    service: "s3",
    region: "us-east-1",
    path: "{bucket}/{object}",
    integrationHttpMethod: "PUT",
    options: {
      credentialsRole: apiGatewayRole,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestParameters: {
        "integration.request.path.bucket": bucket.bucketName,
        "integration.request.path.object": "method.request.path.item",
        "integration.request.header.Accept": "method.request.header.Accept"
      },
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Content-Type": "integration.response.header.Content-Type"
          }
        }
      ]
    }
  });
  const putObjectMethodOptions = {
    authorizer,
    requestParameters: {
      "method.request.path.item": true,
      "method.request.header.Accept": true,
      "method.request.header.Content-Type": true
    },
    methodResponses: [
      {
        statusCode: "200",
        responseParameters: {
          "method.response.header.Content-Type": true
        }
      }
    ]
  };
  bucketItemResource.addMethod("PUT", putObjectIntegration, putObjectMethodOptions);
  let customDomain;
  if (!app.local && app.stage !== "local") {
    customDomain = {
      path: "documents",
      cdk: {
        domainName: DomainName.fromDomainNameAttributes(stack, "ApiDomain", {
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
          )
        })
      }
    };
  }
  const api = new ApiGatewayV1Api(stack, "DocumentsAPI", {
    cdk: {
      restApi
    },
    customDomain
  });
}
__name(API, "API");

// sst.config.ts
var sst_config_default = {
  config(_input) {
    return {
      name: "whiskeyhub-document-service",
      region: "us-east-1"
    };
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      runtime: "nodejs16.x",
      architecture: "arm_64"
    });
    app.stack(Storage).stack(API);
  }
};
export {
  sst_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3RhY2tzL0FQSVN0YWNrLnRzIiwgInN0YWNrcy9TdG9yYWdlU3RhY2sudHMiLCAic3N0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBpR2F0ZXdheVYxQXBpLFxuICBBcGlHYXRld2F5VjFBcGlDdXN0b21Eb21haW5Qcm9wcyxcbiAgRnVuY3Rpb24sXG4gIFN0YWNrQ29udGV4dCxcbiAgdXNlLFxufSBmcm9tICdzc3QvY29uc3RydWN0cyc7XG5pbXBvcnQge1xuICBBdXRob3JpemF0aW9uVHlwZSxcbiAgQXdzSW50ZWdyYXRpb24sXG4gIERvbWFpbk5hbWUsXG4gIEVuZHBvaW50VHlwZSxcbiAgSWRlbnRpdHlTb3VyY2UsXG4gIE1ldGhvZE9wdGlvbnMsXG4gIFBhc3N0aHJvdWdoQmVoYXZpb3IsXG4gIFJlcXVlc3RBdXRob3JpemVyLFxuICBSZXN0QXBpLFxuICBUb2tlbkF1dGhvcml6ZXIsXG59IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCB7IFN0b3JhZ2UgfSBmcm9tICcuL1N0b3JhZ2VTdGFjayc7XG5pbXBvcnQgeyBQb2xpY3lTdGF0ZW1lbnQsIFJvbGUsIFNlcnZpY2VQcmluY2lwYWwgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IFN0cmluZ1BhcmFtZXRlciB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zc20nO1xuXG5leHBvcnQgZnVuY3Rpb24gQVBJKHsgc3RhY2ssIGFwcCB9OiBTdGFja0NvbnRleHQpIHtcbiAgY29uc3QgeyBidWNrZXQgfSA9IHVzZShTdG9yYWdlKTtcblxuICBjb25zdCBhcGlHYXRld2F5Um9sZSA9IG5ldyBSb2xlKHN0YWNrLCAnYXBpLWdhdGV3YXktcm9sZScsIHtcbiAgICBhc3N1bWVkQnk6IG5ldyBTZXJ2aWNlUHJpbmNpcGFsKCdhcGlnYXRld2F5LmFtYXpvbmF3cy5jb20nKSxcbiAgfSk7XG5cbiAgY29uc3QgYWRkQWN0aW9uVG9Qb2xpY3kgPSAoYWN0aW9uOiBzdHJpbmcpID0+IHtcbiAgICBhcGlHYXRld2F5Um9sZS5hZGRUb1BvbGljeShcbiAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICByZXNvdXJjZXM6IFtidWNrZXQuYnVja2V0QXJuXSxcbiAgICAgICAgYWN0aW9uczogW2Ake2FjdGlvbn1gXSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfTtcblxuICBjb25zdCBhdXRob3JpemVyRnVuY3Rpb24gPSBuZXcgRnVuY3Rpb24oc3RhY2ssICdBdXRob3JpemVyRnVuY3Rpb24nLCB7XG4gICAgaGFuZGxlcjogJ3BhY2thZ2VzL2Z1bmN0aW9ucy9zcmMvYXV0aG9yaXplci9mdW5jdGlvbi5oYW5kbGVyJyxcbiAgfSk7XG4gIGNvbnN0IGF1dGhvcml6ZXIgPSBuZXcgUmVxdWVzdEF1dGhvcml6ZXIoc3RhY2ssICdBdXRob3JpemVyJywge1xuICAgIGhhbmRsZXI6IGF1dGhvcml6ZXJGdW5jdGlvbixcbiAgICBpZGVudGl0eVNvdXJjZXM6IFtcbiAgICAgIElkZW50aXR5U291cmNlLmhlYWRlcignQXV0aG9yaXphdGlvbicpLFxuICAgICAgSWRlbnRpdHlTb3VyY2UuaGVhZGVyKCd4LXdoaXNrZXktY2xpZW50LWlkJyksXG4gICAgICBJZGVudGl0eVNvdXJjZS5oZWFkZXIoJ3gtd2hpc2tleS1jbGllbnQtc2VjcmV0JyksXG4gICAgXSxcbiAgfSk7XG5cbiAgLy9DcmVhdGUgUkVTVCBBUElcbiAgY29uc3QgcmVzdEFwaSA9IG5ldyBSZXN0QXBpKHN0YWNrLCAnUzNPYmplY3RzUmVzdEFwaScsIHtcbiAgICBlbmRwb2ludENvbmZpZ3VyYXRpb246IHtcbiAgICAgIHR5cGVzOiBbRW5kcG9pbnRUeXBlLkVER0VdLFxuICAgIH0sXG4gICAgYmluYXJ5TWVkaWFUeXBlczogWycqLyonXSxcbiAgfSk7XG5cbiAgLy9DcmVhdGUge2l0ZW19IEFQSSByZXNvdXJjZSB0byByZWFkL3dyaXRlIGFuIG9iamVjdCBpbiBhIGdpdmVuIGJ1Y2tldFxuICBjb25zdCBidWNrZXRJdGVtUmVzb3VyY2UgPSByZXN0QXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3tpdGVtfScpO1xuXG4gIC8vTGlzdEJ1Y2tldCAoT2JqZWN0cykgbWV0aG9kXG4gIGFkZEFjdGlvblRvUG9saWN5KCdzMzpMaXN0QnVja2V0Jyk7XG4gIGNvbnN0IGxpc3RCdWNrZXRJbnRlZ3JhdGlvbiA9IG5ldyBBd3NJbnRlZ3JhdGlvbih7XG4gICAgc2VydmljZTogJ3MzJyxcbiAgICByZWdpb246ICd1cy1lYXN0LTEnLFxuICAgIHBhdGg6ICd7YnVja2V0fScsXG4gICAgaW50ZWdyYXRpb25IdHRwTWV0aG9kOiAnR0VUJyxcbiAgICBvcHRpb25zOiB7XG4gICAgICBjcmVkZW50aWFsc1JvbGU6IGFwaUdhdGV3YXlSb2xlLFxuICAgICAgcGFzc3Rocm91Z2hCZWhhdmlvcjogUGFzc3Rocm91Z2hCZWhhdmlvci5XSEVOX05PX1RFTVBMQVRFUyxcbiAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7ICdpbnRlZ3JhdGlvbi5yZXF1ZXN0LnBhdGguYnVja2V0JzogYnVja2V0LmJ1Y2tldE5hbWUgfSxcbiAgICAgIGludGVncmF0aW9uUmVzcG9uc2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcbiAgICAgICAgICByZXNwb25zZVBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkNvbnRlbnQtVHlwZSc6ICdpbnRlZ3JhdGlvbi5yZXNwb25zZS5oZWFkZXIuQ29udGVudC1UeXBlJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICB9KTtcbiAgLy9MaXN0QnVja2V0IChPYmplY3RzKSBtZXRob2Qgb3B0aW9uc1xuICBjb25zdCBsaXN0QnVja2V0TWV0aG9kT3B0aW9uczogTWV0aG9kT3B0aW9ucyA9IHtcbiAgICBhdXRob3JpemVyLFxuICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAge1xuICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcbiAgICAgICAgcmVzcG9uc2VQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQ29udGVudC1UeXBlJzogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfTtcbiAgcmVzdEFwaS5yb290LmFkZE1ldGhvZCgnR0VUJywgbGlzdEJ1Y2tldEludGVncmF0aW9uLCBsaXN0QnVja2V0TWV0aG9kT3B0aW9ucyk7XG5cbiAgLy9HZXRPYmplY3QgKE1ldGFkYXRhKSBtZXRob2RcbiAgYWRkQWN0aW9uVG9Qb2xpY3koJ3MzOkdldE9iamVjdCcpO1xuICBjb25zdCBnZXRPYmplY3RNZXRhZGF0YUludGVncmF0aW9uID0gbmV3IEF3c0ludGVncmF0aW9uKHtcbiAgICBzZXJ2aWNlOiAnczMnLFxuICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gICAgcGF0aDogJ3tidWNrZXR9L3tvYmplY3R9JyxcbiAgICBpbnRlZ3JhdGlvbkh0dHBNZXRob2Q6ICdIRUFEJyxcbiAgICBvcHRpb25zOiB7XG4gICAgICBjcmVkZW50aWFsc1JvbGU6IGFwaUdhdGV3YXlSb2xlLFxuICAgICAgcGFzc3Rocm91Z2hCZWhhdmlvcjogUGFzc3Rocm91Z2hCZWhhdmlvci5XSEVOX05PX1RFTVBMQVRFUyxcbiAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAgICdpbnRlZ3JhdGlvbi5yZXF1ZXN0LnBhdGguYnVja2V0JzogYnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgICdpbnRlZ3JhdGlvbi5yZXF1ZXN0LnBhdGgub2JqZWN0JzogJ21ldGhvZC5yZXF1ZXN0LnBhdGguaXRlbScsXG4gICAgICAgICdpbnRlZ3JhdGlvbi5yZXF1ZXN0LmhlYWRlci5BY2NlcHQnOiAnbWV0aG9kLnJlcXVlc3QuaGVhZGVyLkFjY2VwdCcsXG4gICAgICB9LFxuICAgICAgaW50ZWdyYXRpb25SZXNwb25zZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICcyMDAnLFxuICAgICAgICAgIHJlc3BvbnNlUGFyYW1ldGVyczoge1xuICAgICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQ29udGVudC1UeXBlJzogJ2ludGVncmF0aW9uLnJlc3BvbnNlLmhlYWRlci5Db250ZW50LVR5cGUnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gIH0pO1xuXG4gIC8vR2V0T2JqZWN0IChNZXRhZGF0YSkgbWV0aG9kIG9wdGlvbnNcbiAgY29uc3QgZ2V0T2JqZWN0TWV0YWRhdGFNZXRob2RPcHRpb25zOiBNZXRob2RPcHRpb25zID0ge1xuICAgIGF1dGhvcml6ZXIsXG4gICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICdtZXRob2QucmVxdWVzdC5wYXRoLml0ZW0nOiB0cnVlLFxuICAgICAgJ21ldGhvZC5yZXF1ZXN0LmhlYWRlci5BY2NlcHQnOiB0cnVlLFxuICAgIH0sXG4gICAgbWV0aG9kUmVzcG9uc2VzOiBbXG4gICAgICB7XG4gICAgICAgIHN0YXR1c0NvZGU6ICcyMDAnLFxuICAgICAgICByZXNwb25zZVBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5Db250ZW50LVR5cGUnOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9O1xuICBidWNrZXRJdGVtUmVzb3VyY2UuYWRkTWV0aG9kKFxuICAgICdIRUFEJyxcbiAgICBnZXRPYmplY3RNZXRhZGF0YUludGVncmF0aW9uLFxuICAgIGdldE9iamVjdE1ldGFkYXRhTWV0aG9kT3B0aW9uc1xuICApO1xuXG4gIC8vR2V0T2JqZWN0IG1ldGhvZFxuICBhZGRBY3Rpb25Ub1BvbGljeSgnczM6R2V0T2JqZWN0Jyk7XG4gIGNvbnN0IGdldE9iamVjdEludGVncmF0aW9uID0gbmV3IEF3c0ludGVncmF0aW9uKHtcbiAgICBzZXJ2aWNlOiAnczMnLFxuICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gICAgcGF0aDogJ3tidWNrZXR9L3tvYmplY3R9JyxcbiAgICBpbnRlZ3JhdGlvbkh0dHBNZXRob2Q6ICdHRVQnLFxuICAgIG9wdGlvbnM6IHtcbiAgICAgIGNyZWRlbnRpYWxzUm9sZTogYXBpR2F0ZXdheVJvbGUsXG4gICAgICBwYXNzdGhyb3VnaEJlaGF2aW9yOiBQYXNzdGhyb3VnaEJlaGF2aW9yLldIRU5fTk9fVEVNUExBVEVTLFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ2ludGVncmF0aW9uLnJlcXVlc3QucGF0aC5idWNrZXQnOiBidWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgJ2ludGVncmF0aW9uLnJlcXVlc3QucGF0aC5vYmplY3QnOiAnbWV0aG9kLnJlcXVlc3QucGF0aC5pdGVtJyxcbiAgICAgICAgJ2ludGVncmF0aW9uLnJlcXVlc3QuaGVhZGVyLkFjY2VwdCc6ICdtZXRob2QucmVxdWVzdC5oZWFkZXIuQWNjZXB0JyxcbiAgICAgIH0sXG4gICAgICBpbnRlZ3JhdGlvblJlc3BvbnNlczogW1xuICAgICAgICB7XG4gICAgICAgICAgc3RhdHVzQ29kZTogJzIwMCcsXG4gICAgICAgICAgcmVzcG9uc2VQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5Db250ZW50LVR5cGUnOiAnaW50ZWdyYXRpb24ucmVzcG9uc2UuaGVhZGVyLkNvbnRlbnQtVHlwZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgfSk7XG5cbiAgLy9HZXRPYmplY3QgbWV0aG9kIG9wdGlvbnNcbiAgY29uc3QgZ2V0T2JqZWN0TWV0aG9kT3B0aW9uczogTWV0aG9kT3B0aW9ucyA9IHtcbiAgICBhdXRob3JpemVyLFxuICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5pdGVtJzogdHJ1ZSxcbiAgICAgICdtZXRob2QucmVxdWVzdC5oZWFkZXIuQWNjZXB0JzogdHJ1ZSxcbiAgICB9LFxuICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAge1xuICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcbiAgICAgICAgcmVzcG9uc2VQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQ29udGVudC1UeXBlJzogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfTtcbiAgYnVja2V0SXRlbVJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgZ2V0T2JqZWN0SW50ZWdyYXRpb24sIGdldE9iamVjdE1ldGhvZE9wdGlvbnMpO1xuXG4gIC8vUHV0T2JqZWN0IG1ldGhvZFxuICBhZGRBY3Rpb25Ub1BvbGljeSgnczM6UHV0T2JqZWN0Jyk7XG4gIGNvbnN0IHB1dE9iamVjdEludGVncmF0aW9uID0gbmV3IEF3c0ludGVncmF0aW9uKHtcbiAgICBzZXJ2aWNlOiAnczMnLFxuICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gICAgcGF0aDogJ3tidWNrZXR9L3tvYmplY3R9JyxcbiAgICBpbnRlZ3JhdGlvbkh0dHBNZXRob2Q6ICdQVVQnLFxuICAgIG9wdGlvbnM6IHtcbiAgICAgIGNyZWRlbnRpYWxzUm9sZTogYXBpR2F0ZXdheVJvbGUsXG4gICAgICBwYXNzdGhyb3VnaEJlaGF2aW9yOiBQYXNzdGhyb3VnaEJlaGF2aW9yLldIRU5fTk9fVEVNUExBVEVTLFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ2ludGVncmF0aW9uLnJlcXVlc3QucGF0aC5idWNrZXQnOiBidWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgJ2ludGVncmF0aW9uLnJlcXVlc3QucGF0aC5vYmplY3QnOiAnbWV0aG9kLnJlcXVlc3QucGF0aC5pdGVtJyxcbiAgICAgICAgJ2ludGVncmF0aW9uLnJlcXVlc3QuaGVhZGVyLkFjY2VwdCc6ICdtZXRob2QucmVxdWVzdC5oZWFkZXIuQWNjZXB0JyxcbiAgICAgIH0sXG4gICAgICBpbnRlZ3JhdGlvblJlc3BvbnNlczogW1xuICAgICAgICB7XG4gICAgICAgICAgc3RhdHVzQ29kZTogJzIwMCcsXG4gICAgICAgICAgcmVzcG9uc2VQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5Db250ZW50LVR5cGUnOiAnaW50ZWdyYXRpb24ucmVzcG9uc2UuaGVhZGVyLkNvbnRlbnQtVHlwZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgfSk7XG5cbiAgLy9QdXRPYmplY3QgbWV0aG9kIG9wdGlvbnNcbiAgY29uc3QgcHV0T2JqZWN0TWV0aG9kT3B0aW9uczogTWV0aG9kT3B0aW9ucyA9IHtcbiAgICBhdXRob3JpemVyLFxuICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5pdGVtJzogdHJ1ZSxcbiAgICAgICdtZXRob2QucmVxdWVzdC5oZWFkZXIuQWNjZXB0JzogdHJ1ZSxcbiAgICAgICdtZXRob2QucmVxdWVzdC5oZWFkZXIuQ29udGVudC1UeXBlJzogdHJ1ZSxcbiAgICB9LFxuICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAge1xuICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcbiAgICAgICAgcmVzcG9uc2VQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQ29udGVudC1UeXBlJzogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfTtcbiAgYnVja2V0SXRlbVJlc291cmNlLmFkZE1ldGhvZCgnUFVUJywgcHV0T2JqZWN0SW50ZWdyYXRpb24sIHB1dE9iamVjdE1ldGhvZE9wdGlvbnMpO1xuXG4gIGxldCBjdXN0b21Eb21haW46IEFwaUdhdGV3YXlWMUFwaUN1c3RvbURvbWFpblByb3BzIHwgdW5kZWZpbmVkO1xuICBpZiAoIWFwcC5sb2NhbCAmJiBhcHAuc3RhZ2UgIT09ICdsb2NhbCcpIHtcbiAgICBjdXN0b21Eb21haW4gPSB7XG4gICAgICBwYXRoOiAnZG9jdW1lbnRzJyxcbiAgICAgIGNkazoge1xuICAgICAgICBkb21haW5OYW1lOiBEb21haW5OYW1lLmZyb21Eb21haW5OYW1lQXR0cmlidXRlcyhzdGFjaywgJ0FwaURvbWFpbicsIHtcbiAgICAgICAgICBkb21haW5OYW1lOiBTdHJpbmdQYXJhbWV0ZXIudmFsdWVGcm9tTG9va3VwKFxuICAgICAgICAgICAgc3RhY2ssXG4gICAgICAgICAgICBgL3NzdC1vdXRwdXRzLyR7YXBwLnN0YWdlfS1hcGktaW5mcmEtSW5mcmEvZG9tYWluTmFtZWBcbiAgICAgICAgICApLFxuICAgICAgICAgIGRvbWFpbk5hbWVBbGlhc1RhcmdldDogU3RyaW5nUGFyYW1ldGVyLnZhbHVlRnJvbUxvb2t1cChcbiAgICAgICAgICAgIHN0YWNrLFxuICAgICAgICAgICAgYC9zc3Qtb3V0cHV0cy8ke2FwcC5zdGFnZX0tYXBpLWluZnJhLUluZnJhL3JlZ2lvbmFsRG9tYWluTmFtZWBcbiAgICAgICAgICApLFxuICAgICAgICAgIGRvbWFpbk5hbWVBbGlhc0hvc3RlZFpvbmVJZDogU3RyaW5nUGFyYW1ldGVyLnZhbHVlRnJvbUxvb2t1cChcbiAgICAgICAgICAgIHN0YWNrLFxuICAgICAgICAgICAgYC9zc3Qtb3V0cHV0cy8ke2FwcC5zdGFnZX0tYXBpLWluZnJhLUluZnJhL3JlZ2lvbmFsSG9zdGVkWm9uZUlkYFxuICAgICAgICAgICksXG4gICAgICAgIH0pLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgYXBpID0gbmV3IEFwaUdhdGV3YXlWMUFwaShzdGFjaywgJ0RvY3VtZW50c0FQSScsIHtcbiAgICBjZGs6IHtcbiAgICAgIHJlc3RBcGksXG4gICAgfSxcbiAgICBjdXN0b21Eb21haW4sXG4gIH0pO1xufVxuIiwgImltcG9ydCB7IFN0YWNrQ29udGV4dCwgQnVja2V0IH0gZnJvbSAnc3N0L2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gU3RvcmFnZSh7IHN0YWNrIH06IFN0YWNrQ29udGV4dCkge1xuICBjb25zdCBidWNrZXQgPSBuZXcgQnVja2V0KHN0YWNrLCAnRG9jdW1lbnRCdWNrZXQnLCB7XG4gICAgbmFtZTogc3RhY2suc3RhZ2UgPT09ICdwcm9kJyA/ICdtYXR0d3lza2llbC1kb2N1bWVudHMnIDogdW5kZWZpbmVkLFxuICB9KTtcbiAgcmV0dXJuIHtcbiAgICBidWNrZXQsXG4gIH07XG59XG4iLCAiaW1wb3J0IHsgU1NUQ29uZmlnIH0gZnJvbSAnc3N0JztcbmltcG9ydCB7IEFQSSB9IGZyb20gJy4vc3RhY2tzL0FQSVN0YWNrJztcbmltcG9ydCB7IFN0b3JhZ2UgfSBmcm9tICcuL3N0YWNrcy9TdG9yYWdlU3RhY2snO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgY29uZmlnKF9pbnB1dCkge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiAnd2hpc2tleWh1Yi1kb2N1bWVudC1zZXJ2aWNlJyxcbiAgICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gICAgfTtcbiAgfSxcbiAgc3RhY2tzKGFwcCkge1xuICAgIGFwcC5zZXREZWZhdWx0RnVuY3Rpb25Qcm9wcyh7XG4gICAgICBydW50aW1lOiAnbm9kZWpzMTYueCcsXG4gICAgICBhcmNoaXRlY3R1cmU6ICdhcm1fNjQnLFxuICAgIH0pO1xuICAgIGFwcC5zdGFjayhTdG9yYWdlKS5zdGFjayhBUEkpO1xuICB9LFxufSBzYXRpc2ZpZXMgU1NUQ29uZmlnO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7QUFBQTtBQUFBLEVBQ0U7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUFBLE9BQ0s7QUFDUDtBQUFBLEVBRUU7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtB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
