import { useMemo } from "react";
import "../../styles/CodeSideBar.scss";
import { useStore } from "../../store/Store";
import { ActionLabels } from "../../store/ActionsLabels";
import { CommandType } from "../BlockCoding/CodeCanvas";
import { ConvertCodeBlockToJSON } from "../../utils/ConvertCodeBlock";

export const CodeSideBar = () => {
  const shapes = useStore((s) => s.codeBlocks);
  const blockOrder = useStore((s) => s.blockOrder);
  const triggerAction = useStore((s) => s.triggerAction);
  const mqttInstance = useStore((s) => s.mqttInstance);

  const commands: { type: CommandType; color: string }[] = [
    { type: "Forward", color: "#3b82f6" },
    { type: "Back", color: "#ef4444" },
    { type: "Left", color: "#10b981" },
    { type: "Right", color: "#f59e0b" },
    { type: "Stop", color: "#475569" },
  ];

  const sortedShapes = useMemo(
    () => [...shapes].sort((a, b) => a.id - b.id),
    [shapes]
  );

  const HandleRunCode = () => {
    const json = ConvertCodeBlockToJSON(blockOrder, shapes);

    console.log(json);
    mqttInstance?.publish("mqtt/robot", JSON.stringify(json));
  };

  return (
    <div className="codeSideBarContainer">
      <div className="add-controls">
        <p className="section-label">Add Movement:</p>
        <div className="button-grid">
          {commands.map((cmd) => (
            <button
              key={cmd.type}
              onClick={() =>
                triggerAction(
                  ActionLabels.ADD_CODE_BLOCK,
                  "canvasCode",
                  cmd.type
                )
              }
              style={{ border: `2px solid ${cmd.color}`, background: "white" }}
            >
              {cmd.type}
            </button>
          ))}
        </div>
      </div>

      <div className="list-section">
        <p className="section-label">Program Flow</p>
        <div className="shape-list">
          {sortedShapes.map((s) => (
            <div
              key={s.id}
              className={`shape-item ${
                blockOrder.includes(s.id) ? "is-main" : ""
              }`}
              style={{ borderLeft: `4px solid ${s.color}` }}
            >
              <div className="shape-info">
                <span className="id-badge">{s.type.toUpperCase()}</span>
                {s.id !== 0 && (
                  <input
                    type="number"
                    className="block-input"
                    value={s.value}
                    onChange={(e) =>
                      triggerAction(
                        ActionLabels.UPDATE_CODE_BLOCK_VALUES,
                        "canvasCode",
                        { id: s.id, val: parseInt(e.target.value) || 0 }
                      )
                    }
                  />
                )}
              </div>
              {s.id !== 0 && (
                <button
                  className="delete-btn"
                  onClick={() =>
                    triggerAction(
                      ActionLabels.DELETE_CODE_BLOCK,
                      "canvasCode",
                      s.id
                    )
                  }
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="thread-log">
        <small>Current Sequence:</small>
        <code>
          {blockOrder
            .map((id) => shapes.find((s) => s.id === id)?.type)
            .filter(Boolean)
            .join(" → ")}
        </code>
        <button
          onClick={() => {
            HandleRunCode();
          }}
        >
          Run Code
        </button>
      </div>
    </div>
  );
};
