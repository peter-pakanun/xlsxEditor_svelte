import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from 'mongodb';
import { hash } from 'bcrypt';

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env');
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (hot module replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
}

// Run this code only once.
if (!global._defaultDbLoaded) {
  global._defaultDbLoaded = true;

  console.log("Loading default data...");
  let client = await clientPromise;
  let Users = client.db().collection('users');
  if (!await Users.findOne({ username: 'user' })) {
    console.log("creating default user account");
    await Users.insertOne({
      username: 'user',
      password: await hash('user', 10),
      avatar: "https://i.pravatar.cc/500?u=user",
      role: 'user',
    });
  }
  if (!await Users.findOne({ username: 'admin' })) {
    console.log("creating default admin account");
    await Users.insertOne({
      username: 'admin',
      password: await hash('admin', 10),
      avatar: "https://i.pravatar.cc/500?u=admin",
      role: 'admin',
    });
  }
  console.log("Loading default data... done");
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;