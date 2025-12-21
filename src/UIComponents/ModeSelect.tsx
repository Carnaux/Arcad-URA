import { useStore } from "../store/Store";
import "../styles/ModeSelect.scss";

export const ModeSelect = () => {
  const setMode = useStore((store) => store.setMode);

  const handleModeSelection = (e) => {
    setMode(e.target.value);
  };

  return (
    <div className="modeSelectContainer">
      <p>Mode:</p>
      <select onChange={handleModeSelection}>
        <option value={"realtime"} label="realtime" />
        <option value={"code"} label="code" />
        {/* <option value={"simulation"} label="simulation" />
        <option value={"database"} label="database" />
        <option value={"remote"} label="remote control" /> */}
      </select>
    </div>
  );
};
