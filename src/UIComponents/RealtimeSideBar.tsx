import { useState } from "react";
import "../styles/RealtimeSideBar.scss";
import { useStore } from "../store/Store";
import { ActionLabels } from "../store/ActionsLabels";

export const RealtimeSideBar = () => {
  const triggerAction = useStore((store) => store.triggerAction);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (e: string) => {
    // Trigger a deselect
    if (selected != null && selected !== e) {
      triggerAction(ActionLabels.DESELECT_FROM_REALTIME_LIST, "realtimeList", {
        selected: selected,
      });
    }

    setSelected(e);

    // Then select
    triggerAction(
      ActionLabels.TOGGLE_SELECT_FROM_REALTIME_LIST,
      "realtimeList",
      {
        selected: e,
      }
    );
  };

  return (
    <div className="realtimeSideBarContainer">
      <div className="partsListContainer">
        <p className="partsListTitle">Sensores/Atuadores</p>
        <div className="partsList">
          <button
            onClick={() => {
              handleSelect("leftMotor");
            }}
          >
            Motor Esquerdo
          </button>
          <button
            onClick={() => {
              handleSelect("rightMotor");
            }}
          >
            Motor Direito
          </button>
          <button
            onClick={() => {
              handleSelect("ultrasonic");
            }}
          >
            HC-04
          </button>
        </div>
      </div>
    </div>
  );
};
