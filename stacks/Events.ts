import { Api, ApiDomainProps, StackContext, Table, use } from 'sst/constructs';
import { DomainName } from '@aws-cdk/aws-apigatewayv2-alpha';
import { Storage } from './StorageStack';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export const Events = ({ stack, app }: StackContext) => {
  const { bucket, DB_CONNECTION } = use(Storage);

  const table = new Table(stack, 'EventsTable', {
    fields: {
      eventName: 'string',
      eventTime: 'string',
    },
    primaryIndex: {
      partitionKey: 'eventName',
      sortKey: 'eventTime',
    },
  });

  bucket.addNotifications(stack, {
    allEvents: {
      function: {
        handler: 'packages/functions/src/events/handler.handler',
        bind: [table, DB_CONNECTION],
      },
    },
  });

  let customDomain: ApiDomainProps | undefined;
  if (!app.local && app.stage !== 'local') {
    customDomain = {
      path: 'documents/events',
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

  const api = new Api(stack, 'EventsAPI', {
    routes: {
      'GET /': 'packages/functions/src/events/get.handler',
    },
    defaults: {
      function: {
        bind: [table],
      },
    },
    customDomain,
  });
};
