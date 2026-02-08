import Paho from 'paho-mqtt';
import { State } from './state.js';
import { UI } from '../main.js'; // Assuming UI is exported from main

let client = null;
const BROKERS = [
    { host: "broker.emqx.io", port: 8084, ssl: true },
    { host: "test.mosquitto.org", port: 8080, ssl: false }
];

export function connectMQTT() {
    if (client && client.isConnected()) return;
    const broker = BROKERS[0]; // Simplified for demo
    const clientId = "nexus_" + Math.random().toString(16).substr(2, 8);
    client = new Paho.MQTT.Client(broker.host, broker.port, "/mqtt", clientId);

    client.onConnectionLost = () => {
        UI.apiStatus.className = "w-2 h-2 rounded-full bg-red-500 animate-pulse";
        setTimeout(connectMQTT, 2000);
    };

    client.onMessageArrived = (message) => {
        const payload = JSON.parse(message.payloadString);
        if (payload.user === State.user.name) return;
        if (payload.type === 'chat') UI.addMessage(payload.text, false, payload.user, payload.avatar);
    };

    client.connect({
        onSuccess: () => {
            console.log("MQTT Connected");
            UI.apiStatus.className = "w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00e5ff]";
            const topic = State.room === "public" ? "termos/public" : `termos/rooms/${State.room}`;
            client.subscribe(topic);
        },
        useSSL: broker.ssl
    });
}

export function sendMessage(text) {
    if (!client || !client.isConnected()) return;
    const topic = State.room === "public" ? "termos/public" : `termos/rooms/${State.room}`;
    const msg = new Paho.MQTT.Message(JSON.stringify({
        type: 'chat', user: State.user.name, avatar: State.user.avatar, text: text
    }));
    msg.destinationName = topic;
    client.send(msg);
}
