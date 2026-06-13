import dotenv from "dotenv";
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach } from "vitest";

dotenv.config();

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";
process.env.COOKIE_SECURE ||= "false";
process.env.COOKIE_SAME_SITE ||= "lax";

const TEST_DB_NAME = "tracktaskflow_test";

const getTestMongoUri = () => {
  const configuredUri = process.env.TEST_MONGO_URI || process.env.MONGO_URI;

  if (!configuredUri) {
    throw new Error("TEST_MONGO_URI or MONGO_URI is required to run backend tests");
  }

  if (process.env.TEST_MONGO_URI) {
    return configuredUri;
  }

  const [withoutQuery, query] = configuredUri.split("?");
  const lastSlashIndex = withoutQuery.lastIndexOf("/");
  const baseUri =
    lastSlashIndex === -1 ? withoutQuery : withoutQuery.slice(0, lastSlashIndex);
  const queryString = query ? `?${query}` : "";

  return `${baseUri}/${TEST_DB_NAME}${queryString}`;
};

beforeAll(async () => {
  await mongoose.connect(getTestMongoUri());

  const dbName = mongoose.connection.db?.databaseName;
  if (!dbName?.includes("test")) {
    throw new Error(`Refusing to run tests against non-test database: ${dbName}`);
  }
});

beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.db?.dropDatabase();
  await mongoose.disconnect();
});
