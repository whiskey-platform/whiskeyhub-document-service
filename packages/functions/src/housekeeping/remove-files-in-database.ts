// lambda handler that deletes the files collection from MongoDB.

import { Handler } from 'aws-lambda';
import { MongoClient } from 'mongodb';
import { Config } from 'sst/node/config';

const mongo = new MongoClient(Config.DB_CONNECTION);

export const handler: Handler = async (event, context) => {
  // save them to MongoDB
  const db = mongo.db();
  db.dropCollection('files');
};
