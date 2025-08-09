const amqp = require('amqplib/callback_api');

const connectRabbitMQ = () => {
    // Ensure URL has proper protocol (amqp:// or amqps://)
    const url = process.env.rabbitMQUrl.startsWith('amqp') 
        ? process.env.rabbitMQUrl 
        : `amqp://${process.env.rabbitMQUrl}`;
    
    amqp.connect(`${url}?heartbeat=60`, async function (err, conn) {
        if (err) {
            console.error("MQ Connection Error:", err.message);
            return setTimeout(connectRabbitMQ, 1000);
        }

        conn.on("error", function (err) {
            if (err.message !== "Connection closing") {
                console.error("MQ Connection Error:", err.message);
            }
        });

        conn.on("close", function () {
            console.error("MQ Connection Closed - Reconnecting...");
            return setTimeout(connectRabbitMQ, 1000);
        });

        console.log("MQ Connected Successfully");
        
        try {
            // Create channel
            const ch = await conn.createChannel();
            await ch.assertQueue('records');
            
            // Store connection and channel globally
            global.rabbitMQConn = conn;
            global.rabbitMQChannel = ch;
            
            console.log("MQ Channel Created and Queue Asserted");
        } catch (channelErr) {
            console.error("MQ Channel Error:", channelErr.message);
            conn.close();
            setTimeout(connectRabbitMQ, 1000);
        }
    });
}

// Initial connection
connectRabbitMQ();

module.exports = connectRabbitMQ;