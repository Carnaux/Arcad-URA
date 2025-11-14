import { useEffect, useState } from "react";
import { MqttConnectionModal } from "./modals/MqttConnectionModal";
import { useStore } from "../store/Store";
import { ActionLabels } from "../store/ActionsLabels";
import "../styles/ModalContainer.scss";

export const ModalContainer = () => {
  const [showMqttConnectionModal, setShowMqttConnectionModal] = useState(false);
  const addAction = useStore((store) => store.addAction);

  useEffect(() => {
    addAction({
      target: "mqttConnectionModal",
      trigger: ActionLabels.TOGGLE_MQTT_CONNECTION_MODAL,
      cb: () => {
        setShowMqttConnectionModal(!showMqttConnectionModal);
      },
    });
  }, [addAction, showMqttConnectionModal]);

  return (
    <div className="modalContainer">
      {showMqttConnectionModal && <MqttConnectionModal />}
    </div>
  );
};
