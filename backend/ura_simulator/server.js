const mqtt = require("mqtt");

// Connect to your local Mosquitto broker (default port 1883)
const client = mqtt.connect("mqtt://localhost:1883");

let simStep = 0;

// Simulation
// Robot drives forward for a few seconds, then turn
// motorDir = [500, 500, 500, 500, 500]
// motorLeft = [500, 500, 500, -500, 500]
// Then repeat. In this simulation that turn we consider as a 90 degree turn, meaning the car will drive in a rectangle path.
// and since it is a rectangle, we can say that the ultrassonic will detect 3 walls and 1 empty space
// Like the drawing below
//
//      ------------
//     | ⬅️⬅️⬅️⬅️⬅️⬅️⬆️ |
//     | ⬇️        ⬆️ |
//     | ⬇️➡️➡️➡️➡️➡️⚙️ |
//
// The ⚙️ is the robot
// OBS: for this we are considering that the MQTT tick is 10s, for simplicity sake the turn takes 10s to happen

const simStates = [
  // going up
  { motorDir: 500, motorLeft: 500, ultrassonic: 50 },
  { motorDir: 500, motorLeft: 500, ultrassonic: 50 },
  { motorDir: 500, motorLeft: 500, ultrassonic: 50 },
  // turn
  { motorDir: 500, motorLeft: -500, ultrassonic: 50 },
  // going left
  { motorDir: 500, motorLeft: 500, ultrassonic: 50 },
  { motorDir: 500, motorLeft: 500, ultrassonic: 50 },
  { motorDir: 500, motorLeft: 500, ultrassonic: 50 },
  { motorDir: 500, motorLeft: 500, ultrassonic: 50 },
  //turn
  { motorDir: 500, motorLeft: -500, ultrassonic: 50 },
  // going down
  { motorDir: 500, motorLeft: 500, ultrassonic: 1000 },
  { motorDir: 500, motorLeft: 500, ultrassonic: 1000 },
  { motorDir: 500, motorLeft: 500, ultrassonic: 1000 },
  // turn
  { motorDir: 500, motorLeft: -500, ultrassonic: 50 },
  // going right
  { motorDir: 500, motorLeft: 500, ultrassonic: 50 },
  { motorDir: 500, motorLeft: 500, ultrassonic: 50 },
  { motorDir: 500, motorLeft: 500, ultrassonic: 50 },
  { motorDir: 500, motorLeft: 500, ultrassonic: 50 },
  // turn
  { motorDir: 500, motorLeft: -500, ultrassonic: 50 },
];

client.on("connect", () => {
  console.log("Connected to MQTT broker");

  // Simulating values from URA
  setInterval(() => {
    const payload = JSON.stringify(simStates[simStep]);
    console.log(`Publish: ${Date.now().toString()} - ${payload}`);
    client.publish("mqtt/local", payload);

    if (simStep >= simStates.length) {
      simStep = 0;
    } else {
      simStep++;
    }
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
