const amqp = require('amqplib/callback_api');

const connectRabbitMQ = () => {
    // 1. Configuration robuste de la connexion
    const options = {
        protocol: 'amqp',
        hostname: process.env.RABBITMQ_HOST || 'bi.lewootrack.com',
        port: process.env.RABBITMQ_PORT || 5672,
        username: process.env.RABBITMQ_USER || 'teltonika',
        password: process.env.RABBITMQ_PASS || 'tracking123',
        vhost: process.env.RABBITMQ_VHOST || '/teltonika',
        frameMax: 8192, // Doit correspondre à la config serveur
        heartbeat: 60
    };

    // 2. Connexion avec gestion d'erreur améliorée
    amqp.connect(options, (err, conn) => {
        if (err) {
            console.error("MQ Connection Error:", {
                message: err.message,
                stack: err.stack,
                config: options // Log la config utilisée
            });
            return setTimeout(connectRabbitMQ, 5000);
        }

        // 3. Gestion des événements de connexion
        conn.on("error", (err) => {
            if (err.message !== "Connection closing") {
                console.error("MQ Connection Error:", err.message);
            }
        });

        conn.on("close", () => {
            console.log("MQ Connection Closed - Reconnecting...");
            global.publisherChannel = null; // Nettoyage
            setTimeout(connectRabbitMQ, 3000);
        });

        console.log("MQ Connected Successfully");

        // 4. Création du channel avec gestion d'erreur
        conn.createChannel((err, channel) => {
            if (err) {
                console.error("Channel Creation Error:", err);
                return conn.close();
            }

            global.publisherChannel = channel;
            console.log("Channel Created");

            // 5. Assertion de la queue avec callback
            channel.assertQueue('records', { durable: true }, (err) => {
                if (err) {
                    console.error("Queue Assertion Error:", err);
                    channel.close();
                } else {
                    console.log("Queue 'records' is ready");
                }
            });
        });
    });
};

module.exports = connectRabbitMQ;