const fs = require("fs/promises");
const path = require("path");
const { toSystemPath } = require("../../../lib/core/path");
const ioredis = require("ioredis");

function getRedisInstance(db) {
    return new ioredis({
      port:
        process.env.REDIS_PORT ||
        (global.redisClient ? global.redisClient.options.port : 6379),
      host:
        process.env.REDIS_HOST ||
        (global.redisClient
          ? global.redisClient.options.host
            ? global.redisClient.options.host
            : global.redisClient.options.socket.host
          : "localhost"),
      db: db !== undefined ? db : (process.env.REDIS_DB || 0),
      password:
        process.env.REDIS_PASSWORD ||
        (global.redisClient ? global.redisClient.options.password : undefined),
      username:
        process.env.REDIS_USER ||
        (global.redisClient ? global.redisClient.options.user : undefined),
      tls:
        process.env.REDIS_TLS ||
        (global.redisClient ? global.redisClient.options.tls : undefined),
    });
  }
  

exports.insertJsonToRedis = async function (options) {
  options = this.parse(options);

  let content;
  if (options.filePath) {
    const filePath = toSystemPath(options.filePath);
    content = await fs.readFile(filePath, options.encoding || "utf8");
  } else if (options.jsonValue) {
    content = JSON.stringify(options.jsonValue);
  } else {
    throw new Error("Either file or json input must be provided");
  }

  const jsonContent = JSON.parse(content);

  const redis = getRedisInstance(options.db);

  if (options.ttl) {
    await redis.set(
      options.key,
      JSON.stringify(jsonContent),
      "EX",
      options.ttl
    );
  } else {
    await redis.set(options.key, JSON.stringify(jsonContent));
  }
};

exports.getJsonFromRedis = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);

  const content = await redis.get(options.key);
  if (content) {
    return JSON.parse(content);
  } else {
    throw new Error("Key not found in Redis");
  }
};

exports.deleteFromRedis = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);

  let cursor = "0";
  do {
    const res = await redis.scan(cursor, "MATCH", options.key);
    cursor = res[0];
    const keys = res[1];

    if (keys.length > 0) {
      const pipeline = redis.pipeline();
      keys.forEach((key) => {
        pipeline.del(key);
      });
      await pipeline.exec();
    }
  } while (cursor !== "0");
};

exports.updateJsonInRedis = async function (options) {
  options = this.parse(options);

  if (typeof options.json === "string") {
    try {
      options.json = JSON.parse(options.json);
    } catch (error) {
      console.error("Error parsing string to JSON:", error);
      return;
    }
  }

  const redis = getRedisInstance(options.db);

  const currentValue = await redis.get(options.key);
  const currentJson = JSON.parse(currentValue);

  function deepMerge(obj1, obj2) {
    for (const key in obj2) {
      if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
        obj1[key] = obj1[key].map((item, index) => {
          if (obj2[key][index]) {
            return deepMerge(item, obj2[key][index]);
          } else {
            return item;
          }
        });
      } else if (
        typeof obj1[key] === "object" &&
        obj1[key] !== null &&
        typeof obj2[key] === "object" &&
        obj2[key] !== null
      ) {
        obj1[key] = deepMerge(obj1[key], obj2[key]);
      } else {
        obj1[key] = obj2[key];
      }
    }
    return obj1;
  }

  const updatedJson = deepMerge(currentJson, options.json);

  await redis.set(options.key, JSON.stringify(updatedJson));
};

exports.incrementCounter = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);

  const currentCounterValue = await redis.get(options.key);
  const incrementValue = options.increment ? parseInt(options.increment) : 1;
  const incrementedCounterValue =
    parseInt(currentCounterValue || 0) + incrementValue;

  await redis.set(options.key, incrementedCounterValue);
};

exports.decrementCounter = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);

  const currentCounterValue = await redis.get(options.key);
  const decrementValue = options.decrement ? parseInt(options.decrement) : 1;
  const decrementedCounterValue =
    parseInt(currentCounterValue || 0) - decrementValue;

  await redis.set(options.key, decrementedCounterValue);
};

exports.getAllKeys = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);

  const keys = await redis.keys("*");
  return keys;
};

const { promisify } = require("util");

exports.runRedisCommand = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);
  const sendCommandAsync = promisify(redis.send_command).bind(redis);

  try {
    const reply = await sendCommandAsync(options.command);
    return reply;
  } catch (err) {
    throw err;
  }
};

exports.getAllKeyValuePairs = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);

  const keys = await redis.keys("*");

  const results = {};

  for (const key of keys) {
    const value = await redis.get(key);
    try {
      results[key] = JSON.parse(value);
    } catch (e) {
      results[key] = value;
    }
  }

  return results;
};

exports.expireKey = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);

  const result = await redis.expire(options.key, options.expiration);

  return result === 1
    ? "Key expiration set successfully"
    : "Failed to set key expiration";
};

exports.renameKey = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);

  try {
    await redis.rename(options.oldKey, options.newKey);
    return "Key renamed successfully";
  } catch (error) {
    return "Failed to rename key";
  }
};

exports.keyExists = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);

  const result = await redis.exists(options.key);

  return result === 1;
};

exports.getExpirationTTL = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);
  let ttl;

  if (options.pttl) {
    ttl = await redis.pttl(options.key);
  } else {
    ttl = await redis.ttl(options.key);
  }

  return ttl;
};

exports.addElementsToSet = async function (options) {
  options = this.parse(options);
  const redis = getRedisInstance(options.db);

  await redis.sadd(options.key, ...options.elements);
};

exports.addElementsToList = async function (options) {
  options = this.parse(options);
  const redis = getRedisInstance(options.db);

  await redis.rpush(options.key, ...options.elements);
};

exports.removeFromSet = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);

  await redis.srem(options.key, options.item);
};

exports.removeFromList = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);

  await redis.lrem(options.key, 0, options.item);
};

exports.removeDuplicatesFromList = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);
  const listItems = await redis.lrange(options.key, 0, -1);

  const uniqueItems = [...new Set(listItems)];

  await redis.multi().del(options.key).rpush(options.key, uniqueItems).exec();
};

exports.getListRange = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);
  const range = await redis.lrange(options.key, options.start, options.end);

  return range;
};

exports.getCollectionLength = async function (options) {
  options = this.parse(options);

  const redis = getRedisInstance(options.db);
  let length;

  switch (options.valuetype) {
    case "list":
      length = await redis.llen(options.key);
      break;
    case "set":
      length = await redis.scard(options.key);
      break;
    case "sortedset":
      length = await redis.zcard(options.key);
      break;
    default:
      throw new Error(
        "Invalid type specified. Must be 'list', 'set', or 'sortedset'"
      );
  }

  return length;
};
