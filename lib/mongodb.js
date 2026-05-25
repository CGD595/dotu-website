import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "Missing MONGODB_URI — add it to .env.local:\n" +
    "MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority"
  );
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let clientPromise;

if (process.env.NODE_ENV === "development") {
  // In dev, reuse the connection across hot reloads to avoid
  // exhausting the MongoDB Atlas free-tier connection limit.
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, always create a fresh client per serverless invocation
  // (Next.js serverless functions are short-lived anyway).
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
