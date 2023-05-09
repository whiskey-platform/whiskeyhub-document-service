import { Handler } from 'aws-lambda';

export const handler: Handler = event => {
  console.log('handling event');
  console.log(event);
};
