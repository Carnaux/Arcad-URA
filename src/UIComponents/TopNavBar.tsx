import { ActionLabels } from "../store/ActionsLabels";
import { useStore } from "../store/Store";
import "../styles/TopNavBar.scss";
import { ModeSelect } from "./ModeSelect";

export const TopNavBar = () => {
  const triggerAction = useStore((store) => store.triggerAction);

  return (
    <div className="topNavBarContainer">
      <button
        onClick={() => {
          triggerAction(
            ActionLabels.TOGGLE_MQTT_CONNECTION_MODAL,
            "mqttConnectionModal"
          );
        }}
      >
        Mqtt
      </button>
      <ModeSelect />
    </div>
  );
};
