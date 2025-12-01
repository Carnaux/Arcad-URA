import { useState } from "react";
import { ActionLabels } from "../../store/ActionsLabels";
import { useStore } from "../../store/Store";
import "../../styles/MqttConnectionModal.scss";

import mqtt from "mqtt";

export const MqttConnectionModal = () => {
  const triggerAction = useStore((store) => store.triggerAction);
  const mqttInstance = useStore((store) => store.mqttInstance);
  const setMqttInstance = useStore((store) => store.setMqttInstance);
  const pushToPayloadHistory = useStore((store) => store.pushToPayloadHistory);

  const [brokerEndpoint, setBrokerEndpoint] = useState<string>(
    "ws://localhost:9001"
  );
  const [subscribeChannel, setSubscribeChannel] =
    useState<string>("mqtt/local");
  const [tickTime, setTickTime] = useState<number>(10);

  const handleOnConnect = () => {
    if (mqttInstance && !brokerEndpoint && !subscribeChannel) return;

    const instance = mqtt.connect(brokerEndpoint, {
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    instance.on("connect", () => {
      console.log("Connected to MQTT broker");
      instance.subscribe(subscribeChannel, (err) => {
        if (!err) {
          instance.publish(subscribeChannel, "Browser client connected!!");
        }
      });
    });

    instance.on("message", (topic, payload) => {
      pushToPayloadHistory(payload.toString());
    });

    instance.on("close", () => console.log("Connection closed"));

    instance.on("error", (err) => {
      console.error("Connection error: ", err);
      instance.end();
    });

    instance.on("end", () => console.log("Connection ended"));

    setMqttInstance(instance);
  };

  const handleOnDisconnect = () => {
    if (!mqttInstance) return;

    mqttInstance.end();
  };

  return (
    <div className="mqttConnectionModalContainer">
      <div className="mqttConnectionModalContent">
        <p className="modalTitle">MQTT Connection</p>
        <div className="modalContent">
          <input
            type="text"
            placeholder="Broker endpoint"
            value={brokerEndpoint}
            onChange={(e) => {
              setBrokerEndpoint(e.target.value);
            }}
          ></input>
          <input
            type="text"
            placeholder="channel"
            value={subscribeChannel}
            onChange={(e) => {
              setSubscribeChannel(e.target.value);
            }}
          ></input>
          <input
            type="text"
            placeholder="10"
            value={tickTime}
            onChange={(e) => {
              setTickTime(parseInt(e.target.value));
            }}
          ></input>
          <button
            onClick={() => {
              handleOnConnect();
            }}
            disabled={brokerEndpoint.length === 0}
          >
            Conectar
          </button>
          <button
            onClick={() => {
              handleOnDisconnect();
            }}
          >
            Desconectar
          </button>
        </div>
        <div className="modalFooter">
          <button
            onClick={() => {
              triggerAction(
                ActionLabels.TOGGLE_MQTT_CONNECTION_MODAL,
                "mqttConnectionModal"
              );
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
