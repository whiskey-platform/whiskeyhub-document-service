import { Api, StackContext, use } from 'sst/constructs';
import { Storage } from './StorageStack';
import { ExternalResources } from './ExternalResources';

export function API({ stack }: StackContext) {
  const { bucket } = use(Storage);
  const { powertools } = use(ExternalResources);
  new Api(stack, 'Api', {
    routes: {
      'GET /files': 'packages/functions/src/list-files/function.handler',
      'POST /files': 'packages/functions/src/upload-file/function.handler',
    },
    defaults: {
      function: {
        bind: [bucket],
        layers: [powertools],
      },
    },
  });
}
