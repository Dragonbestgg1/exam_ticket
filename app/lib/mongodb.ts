import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

let clientPromise: Promise<MongoClient> | null = null;

async function createMongoClientPromise(): Promise<MongoClient> {

    const mongoUri: string = uri as string;
  
    const newClient = new MongoClient(mongoUri, options);
    try {
      const client = await newClient.connect();
      if (process.env.NODE_ENV === 'development') {
        console.log('MongoDB connected (development mode)');
      } else {
        console.log('MongoDB connected (production mode)');
      }
      return client;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('MongoDB connection error (development mode):', error);
      } else {
        console.error('MongoDB connection error (production mode):', error);
      }
      throw error;
    }
  }

async function getMongoClientPromise(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = createMongoClientPromise();
  }
  return clientPromise;
}

export default getMongoClientPromise;