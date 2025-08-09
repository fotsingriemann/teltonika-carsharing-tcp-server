require('dotenv').config();
const Redis = require('ioredis');
console.log(process.env.redisURL)
const connectRedis = async () => {
    global.redisClient = new Redis({
        // password: process.env.redisPW,
        host:  process.env.redisURL,
        port: process.env.redisPort,
        //connectTimeout: 120000,
        reconnectOnError: true,
    })

    global.redisSubscriber = new Redis({
        // password: process.env.redisPW,
        host:  process.env.redisURL,
        port: process.env.redisPort,
        //connectTimeout: 120000,
        reconnectOnError: true,
    })
}

module.exports = connectRedis;