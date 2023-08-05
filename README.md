# Wappler Redis Toolkit

## Functionality
Wappler Redis Toolkit is a powerful extension allowing Wappler users to interact directly with Redis. This includes operations like inserting, updating, retrieving JSON, manipulating counters, managing keys, handling collections, and executing custom Redis commands.

## Requirements
- Functioning Redis connection, specified within the Wappler server config, Redis connection defined with ENV variables, or a user-defined db in the extension UI.
- The [ioredis](https://github.com/luin/ioredis) library needs to be installed in your project.

## Installation
- Create the directory `/extensions/server_connect/modules` in your project folder if it doesn't exist already.
- Unzip the source code into `/extensions/server_connect/modules`.
- Refresh the Server Actions panel (Restarting Wappler is also an option).
- Install ioredis library will be automatically installed upon use and next deployment.
- You should now have a Redis Toolkit group in your available actions list for server workflows.

## Optional ENV Variables
- REDIS_PORT: The Redis port.
- REDIS_HOST: The Redis host.
- REDIS_DB: The Redis database.
- REDIS_PASSWORD: The Redis password.
- REDIS_USER: The Redis user.
- REDIS_TLS: The TLS certificate. Define it is {} if you need a TLS connection without defining a cert.

## Actions
### Insert JSON to Redis
Stores JSON data in the specified Redis key.

### Get JSON from Redis
Retrieves JSON data from the specified Redis key.

### Delete Value from Redis
Deletes the specified key-value pair from Redis.

### Update JSON in Redis
Updates the JSON data in the specified Redis key.

### Increment Counter in Redis
Increments the counter at the specified Redis key.

### Decrement Counter in Redis
Decrements the counter at the specified Redis key.

### Get All Keys in Redis
Fetches all keys currently stored in Redis.

### Run Redis Command
Allows running of custom Redis commands.

### Get All Key-Value Pairs
Fetches all key-value pairs currently stored in Redis.

### Expire Key in Redis
Sets an expiration time on a given key.

### Rename Key in Redis
Renames the given key.

### Check if Key Exists in Redis
Checks if the specified key exists in Redis.

### Get Expiration TTL
Gets the TTL (time to live) of a specified key.

### Add Elements to Set
Adds elements to a specified Redis set.

### Add Elements to List
Adds elements to a specified Redis list.

### Remove Item from Set
Removes the specified item from a Redis set.

### Remove Item from List
Removes the specified item from a Redis list.

### Remove Duplicates from List
Removes duplicate items from a specified Redis list.

### Get Collection Length
Returns the length of a specified Redis list or set.
