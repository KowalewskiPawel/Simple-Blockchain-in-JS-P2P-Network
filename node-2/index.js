import { getTransactions, writeTransactions } from './blockchain-helpers.js';
import { getKnownPeerAddresses } from './network-helpers.js';

import WebSocket, { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
dotenv.config();

const knownPeers = getKnownPeerAddresses();
const MY_PORT = process.env.PORT;
const MY_ADDRESS = `ws://localhost:${MY_PORT}`;
const transactions = getTransactions();
const openedSockets = [];
const connectedAddresses = [];
const attemptingToConnectAddresses = [];
// Add your code below
const nodeServer = new WebSocketServer({ port: MY_PORT });

nodeServer.on("connection", socket => {
    console.log("Incoming connection received");

    socket.on('message', dataString => {
        console.log(`Message: ${dataString}`);
        const message = JSON.parse(dataString);
        message.data.forEach(address => connect(address));
    })
});

const connect = (address) => {
    if (address !== MY_ADDRESS && !attemptingToConnectAddresses.includes(address) && !connectedAddresses.includes(address)) {
        console.log(`Attempting to connect to ${address}`);
        attemptingToConnectAddresses.push(address);

        const socket = new WebSocket(address);
        socket.on('open', () => {
            console.log(`Connection to ${address} opened`);
            attemptingToConnectAddresses.splice(attemptingToConnectAddresses.indexOf(address), 1);
            connectedAddresses.push(address);
            socket.send(
                JSON.stringify({ type: 'HANDSHAKE', data: [MY_ADDRESS, ...connectedAddresses] })
            )
        });

        socket.on('close', () => {
            console.log(`Connection to ${address} closed`);
            connectedAddresses.splice(connectedAddresses.indexOf(address), 1);
        });

        socket.on('error', () => {
            console.log(`Error while connecting to: ${address}`);
            const indexOfAddress = attemptingToConnectAddresses.indexOf(address);
            if (indexOfAddress >= 0) {
                attemptingToConnectAddresses.splice(indexOfAddress, 1);
            }
        })
    }
}

knownPeers.forEach((knownPeer) => connect(knownPeer));