const mqtt = require("mqtt");

// Connect to your local Mosquitto broker (default port 1883)
const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  console.log("Connected to MQTT broker");

  // Subscribe to a topic
  // client.subscribe("mqtt/test", (err) => {
  //   if (!err) {
  //     console.log("Subscribed to mqtt/test");
  //   }
  // });
  client.publish("mqtt/local", "Server URA Simulator connected!");

  // Publish a message
  setInterval(() => {
    client.publish("mqtt/local", "random data");
  }, 10000);
});

client.on("message", (topic, message) => {
  // message is a Buffer
  console.log(`Received message on topic "${topic}": ${message.toString()}`);
  // client.end(); // Uncomment to close the connection after receiving a message
});

client.on("error", (err) => {
  console.error("MQTT error:", err);
});
