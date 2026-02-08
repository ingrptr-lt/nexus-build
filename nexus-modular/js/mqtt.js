// --- MQTT NETWORK MANAGER ---
import { State } from './app.js'; // Import state

export class NetworkManager {
    constructor() {
        this.client = null;
        this.brokers = [
            { host: "broker.emqx.io", port: 8084, ssl: true },
            { host: "test.mosquitto.org", port: 8080, ssl: false }
        ];
        this.currentIdx = 0;
    }

    connect() {
        if (typeof Paho === 'undefined') {
            console.error("Paho MQTT library missing");
            return;
        }
        const broker = this.brokers[this.currentIdx];
        const clientId = "nexus_" + Math.random().toString(16).substr(2,
