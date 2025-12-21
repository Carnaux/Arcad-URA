/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import "../../styles/CodeCanvas.scss";
import { useStore } from "../../store/Store";
import { ActionLabels } from "../../store/ActionsLabels";

export type CommandType =
  | "Forward"
  | "Back"
  | "Left"
  | "Right"
  | "Start"
  | "Stop";

export interface CodeBlockShape {
  id: number;
  type: CommandType;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  nextId?: number | null;
  isLocked?: boolean;
}

export const CodeCanvas: React.FC = () => {
  const setCodeBlocks = useStore((s) => s.setCodeBlocks);
  const setBlockOrder = useStore((s) => s.setBlockOrder);
  const addAction = useStore((s) => s.addAction);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // local state for smooth 60fps dragging
  const [shapes, setShapes] = useState<CodeBlockShape[]>([
    {
      id: 0,
      type: "Start",
      value: 0,
      x: 50,
      y: 50,
      width: 140,
      height: 60,
      color: "#1e293b",
      isLocked: true,
    },
  ]);

  const [dragState, setDragState] = useState<{
    id: number;
    ox: number;
    oy: number;
  } | null>(null);
  // const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);

  const SNAP_THRESHOLD = 30;
  const BREAK_THRESHOLD = 60;

  // --- LOGIC: Program Chain ---
  const mainThread = useMemo(() => {
    const thread: number[] = [];
    let currentId: number | null | undefined = 0;
    const visited = new Set<number>();
    while (
      currentId !== null &&
      currentId !== undefined &&
      !visited.has(currentId)
    ) {
      const shape = shapes.find((s) => s.id === currentId);
      if (!shape) break;
      thread.push(currentId);
      visited.add(currentId);
      currentId = shape.nextId;
    }
    return thread;
  }, [shapes]);

  useEffect(() => {
    setCodeBlocks(shapes);
    setBlockOrder(mainThread);
  }, [shapes, mainThread, setCodeBlocks, setBlockOrder]);

  useEffect(() => {
    addAction({
      target: "canvasCode",
      trigger: ActionLabels.ADD_CODE_BLOCK,
      cb: (type: CommandType) => {
        const dpr = window.devicePixelRatio || 1;
        const cw = (canvasRef.current?.width || 800) / dpr;
        const ch = (canvasRef.current?.height || 600) / dpr;
        const colors: any = {
          Forward: "#3b82f6",
          Back: "#ef4444",
          Left: "#10b981",
          Right: "#f59e0b",
          Stop: "#475569",
        };

        setShapes((prev) => [
          ...prev,
          {
            id: Date.now(),
            type,
            value: 1000,
            x: cw / 2 - 70,
            y: ch - 90,
            width: 140,
            height: 60,
            color: colors[type] || "#666",
          },
        ]);
      },
    });

    addAction({
      target: "canvasCode",
      trigger: ActionLabels.DELETE_CODE_BLOCK,
      cb: (id: number) => {
        setShapes((prev) =>
          prev
            .filter((s) => s.id !== id)
            .map((s) => (s.nextId === id ? { ...s, nextId: null } : s))
        );
      },
    });

    addAction({
      target: "canvasCode",
      trigger: ActionLabels.UPDATE_CODE_BLOCK_VALUES,
      cb: ({ id, val }: { id: number; val: number }) => {
        setShapes((prev) =>
          prev.map((s) => (s.id === id ? { ...s, value: val } : s))
        );
      },
    });
  }, [addAction]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    // Spawn Area
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = "#cbd5e1";
    ctx.strokeRect(40, ch - 120, cw - 80, 100);

    [...shapes]
      .sort((a) => (a.id === dragState?.id ? 1 : -1))
      .forEach((s) => {
        const isMain = mainThread.includes(s.id);
        ctx.save();
        ctx.globalAlpha =
          isMain || dragState?.id === s.id || s.id === 0 ? 1 : 0.3;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.roundRect(s.x, s.y, s.width, s.height, s.type === "Stop" ? 30 : 8);
        ctx.fill();
        if (isMain) {
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(
          s.type.toUpperCase(),
          s.x + 15,
          s.y + (s.type === "Stop" ? 35 : 25)
        );
        if (s.id !== 0) {
          ctx.font = "10px sans-serif";
          ctx.fillText(
            `Val: ${s.value}`,
            s.x + 15,
            s.y + (s.type === "Stop" ? 52 : 45)
          );
        }
        ctx.restore();
      });
  }, [shapes, mainThread, dragState]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      if (
        canvas.width !== rect.width * dpr ||
        canvas.height !== rect.height * dpr
      ) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        draw();
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const target = [...shapes]
      .reverse()
      .find(
        (s) =>
          !s.isLocked &&
          mx >= s.x &&
          mx <= s.x + s.width &&
          my >= s.y &&
          my <= s.y + s.height
      );
    if (target)
      setDragState({ id: target.id, ox: mx - target.x, oy: my - target.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let nx = mx - dragState.ox,
      ny = my - dragState.oy;
    // let tGhost = null;

    for (const o of shapes) {
      if (o.id === dragState.id) continue;
      const dx = Math.abs(nx - (o.x + o.width)),
        dy = Math.abs(ny - (o.y + o.height));
      if (
        dx < SNAP_THRESHOLD &&
        Math.sqrt(Math.pow(nx - (o.x + o.width), 2) + Math.pow(ny - o.y, 2)) <
          BREAK_THRESHOLD
      ) {
        nx = o.x + o.width;
        ny = o.y;
        // tGhost = { x: nx, y: ny };
        break;
      } else if (
        dy < SNAP_THRESHOLD &&
        Math.sqrt(Math.pow(nx - o.x, 2) + Math.pow(ny - (o.y + o.height), 2)) <
          BREAK_THRESHOLD
      ) {
        ny = o.y + o.height;
        nx = o.x;
        // tGhost = { x: nx, y: ny };
        break;
      }
    }
    // setGhost(tGhost);
    setShapes((prev) =>
      prev.map((s) => (s.id === dragState.id ? { ...s, x: nx, y: ny } : s))
    );
  };

  const handleMouseUp = () => {
    if (!dragState) return;
    setShapes((prev) => {
      const active = prev.find((s) => s.id === dragState.id);
      if (!active) return prev;
      const parent = prev.find(
        (o) =>
          o.id !== dragState.id &&
          ((Math.abs(active.x - (o.x + o.width)) < 1 && active.y === o.y) ||
            (Math.abs(active.y - (o.y + o.height)) < 1 && active.x === o.x))
      );
      return prev.map((s) => {
        const u = { ...s };
        if (u.nextId === dragState.id) u.nextId = null;
        if (parent && u.id === parent.id) u.nextId = dragState.id;
        return u;
      });
    });
    setDragState(null);
    // setGhost(null);
  };

  return (
    <div className="codeCanvasContainer" ref={containerRef}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};
