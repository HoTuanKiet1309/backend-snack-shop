const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { beforeAll, afterAll, afterEach } = require('@jest/globals');
require('dotenv').config();

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
}); 