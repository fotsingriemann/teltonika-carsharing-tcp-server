require('dotenv').config();
const net = require('net');
const Device = require('./device');
const connectRedis = require('./connectors/redis');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

// Configuration
const PORT = process.env.SERVICE_PORT || 6022;
const HOST = process.env.SERVICE_HOST || '127.0.0.1';

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running with ${numCPUs} workers`);
    
    // Gestion des workers qui crash
    cluster.on('exit', (worker, code, signal) => {
        console.error(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
        cluster.fork();
    });

    // Création des workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {
    // Worker process
    const server = net.createServer(onClientConnection);
    
    // Gestion des erreurs du serveur
    server.on('error', (err) => {
        console.error('Server error:', err);
        process.exit(1);
    });

    server.listen(PORT, HOST, () => {
        console.log(`Worker ${process.pid} started on ${HOST}:${PORT}`);
    });

        // connectRabbitMQ();
    connectRedis();
    // Stockage global des devices
    global.devices = {};

    // Gestion des connexions clients
    function onClientConnection(sock) {
        const clientInfo = `${sock.remoteAddress}:${sock.remotePort}`;
        console.log(`New connection from ${clientInfo} (Worker ${process.pid})`);
        
        // Gestion des erreurs de socket
        sock.on('error', (err) => {
            console.error(`Socket error with ${clientInfo}:`, err.message);
        });

        // Création d'un nouveau device
        new Device(sock);
    }
}