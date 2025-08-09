const { REDIS_MESSAGES } = require('../../constants/messages');
const tcpCommands = require('../../commands');

async function onDataReceived(data) {
    try {
        // 1. Validation des données d'entrée
        if (!Buffer.isBuffer(data) {
            throw new Error('Invalid data format: expected Buffer');
        }

        const rawHex = data.toString('hex');
        console.log(`\n${this.imei || 'no imei'}: ${rawHex} raw data\n`);

        // 2. Gestion des commandes expirées
        if (this.expireCommand) {
            redisClient.publish(this.imei, JSON.stringify({ 
                message: REDIS_MESSAGES.DEVICE_CONNECTED 
            }));
            clearTimeout(this.expireCommand);
            
            const timeout = 30000;
            this.expireCommand = setTimeout(() => {
                console.warn(`${this.imei}: Command ${this.command?.action} expired after ${timeout/1000}s`);
                this.resetCommandState();
            }, timeout);
        }

        // 3. Journalisation de la connexion
        console.log(`${this.sock.remoteAddress}:${this.sock.remotePort} Received ${data.length} bytes`);

        // 4. Traitement des données
        const hexToUtf8 = Buffer.from(data, 'hex');
        const cleanData = hexToUtf8.toString('utf8').replace(/[^a-zA-Z0-9]/g, '');

        // 5. Validation IMEI (15 chiffres)
        if (cleanData.length === 15 && !isNaN(cleanData)) {
            console.log('Valid IMEI detected:', cleanData);
            await this.onImeiReceived(cleanData);
            
            if (this.command && this.shouldExecuteCommand()) {
                return this.execute();
            }
        } else {
            // 6. Traitement des paquets normaux
            return this.onPacketReceived(data);
        }

        // 7. Envoi d'ACK si nécessaire
        if (!this.awaitingResponse && !this.ackSent) {
            await this.sendAcknowledgement();
            if (this.command) {
                return this.execute();
            }
        }
    } catch (error) {
        console.error(`Error processing data from ${this.sock.remoteAddress}:`, {
            error: error.message,
            stack: error.stack,
            rawData: data?.toString('hex')
        });
        
        // Envoyer un message d'erreur au device si possible
        const errorResponse = Buffer.from([0x00]); // NACK standard
        this.sock.write(errorResponse);
    }
}

// Fonctions utilitaires (à ajouter dans votre classe)
function resetCommandState() {
    this.awaitingResponse = false;
    this.executionIndex = 0;
    this.command = null;
}

function shouldExecuteCommand() {
    return this.executionIndex < tcpCommands[this.command?.action]?.length && this.ackSent;
}

async function sendAcknowledgement() {
    try {
        const isChannelReady = publisherChannel?.connection?.stream?.writable;
        const ackCode = isChannelReady ? '01' : '00';
        const confirmation = Buffer.from(ackCode, 'hex');
        
        console.log(`Sending ACK to ${this.sock.remoteAddress}`);
        this.sock.write(confirmation);
        this.ackSent = true;
    } catch (err) {
        console.error('Failed to send ACK:', err);
        throw err;
    }
}

module.exports = onDataReceived;