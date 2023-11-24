import { SSTConfig } from 'sst';
import { API } from './stacks/APIStack';
import { Storage } from './stacks/StorageStack';
import { TopicStack } from './stacks/TopicStack';
import { ExternalResources } from './stacks/ExternalResources';
import { Housekeeping } from './stacks/Housekeeping';
import { Events } from './stacks/Events';

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config(_input) {
    return {
      name: 'whiskeyhub-document-service',
      region: 'us-east-1',
    };
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      runtime: 'nodejs20.x',
      nodejs: {
        esbuild: {
          external: !app.local ? ['@aws-sdk/*'] : undefined,
        },
      },
      environment: {
        POWERTOOLS_SERVICE_NAME: 'whiskey_document_service',
      },
    });
    app
      .stack(ExternalResources)
      .stack(Storage)
      .stack(Events)
      .stack(API)
      .stack(TopicStack)
      .stack(Housekeeping);
  },
} satisfies SSTConfig;
