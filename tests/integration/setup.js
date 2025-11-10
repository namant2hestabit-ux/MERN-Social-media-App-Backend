const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

let replSet;

module.exports.connect = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect(); // ensures fresh connection
  }

  // Start an in-memory replica set so we can use transactions
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();

  await mongoose.connect(uri, {
    dbName: "jestTestDB",
  });
};

module.exports.closeDatabase = async () => {
    console.log(mongoose.connection.readyState)
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (replSet) await replSet.stop();
};

module.exports.clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    if (Object.hasOwn(collections, key)) {
      const collection = collections[key];
      if (collection?.deleteMany) {
        await collection.deleteMany({});
      }
    }
  }
};
