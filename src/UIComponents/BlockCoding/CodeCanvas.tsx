/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionLabels } from "../../store/ActionsLabels";
import { useStore } from "../../store/Store";

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

export const COLORS: Record<CommandType, string> = {
	Start: "#1e293b",
	Forward: "#3b82f6",
	Back: "#ef4444",
	Left: "#10b981",
	Right: "#f59e0b",
	Stop: "#475569",
};

const TEMPLATES: CommandType[] = ["Forward", "Back", "Stop", "Left", "Right"];
export const CodeCanvas: React.FC = () => {
	// Read selections from store
	const codeBlocks = useStore((s) => s.codeBlocks);
	const setCodeBlocks = useStore((s) => s.setCodeBlocks);
	const setBlockOrder = useStore((s) => s.setBlockOrder);
	const addAction = useStore((s) => s.addAction);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	const [shapes, setShapes] = useState<CodeBlockShape[]>([
		{
			id: 0,
			type: "Start",
			value: 0,
			x: 80,
			y: 250,
			width: 140,
			height: 60,
			color: COLORS.Start,
			isLocked: false,
		},
	]);

	const [dragState, setDragState] = useState<{
		id: number;
		ox: number;
		oy: number;
		isNew: boolean;
		startX: number;
		startY: number;
	} | null>(null);

	const SNAP_THRESHOLD = 30;

	// --- SYNC STORE TO LOCAL STATE ---
	// Watch for external changes (like imports) to codeBlocks and update canvas
	const codeBlocksString = JSON.stringify(codeBlocks);
	useEffect(() => {
		if (codeBlocks && codeBlocks.length > 0) {
			setShapes((prevShapes) => {
				const prevString = JSON.stringify(prevShapes);
				if (prevString !== codeBlocksString) {
					return codeBlocks;
				}
				return prevShapes;
			});
		}
	}, [codeBlocks, codeBlocksString]);

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
			const shape = shapes.find((s) => {
				return s.id === currentId;
			});

			if (!shape) {
				break;
			}

			thread.push(currentId);
			visited.add(currentId);
			currentId = shape.nextId;
		}
		return thread;
	}, [shapes]);

	// --- PUSH LOCAL STATE TO STORE ---
	useEffect(() => {
		// Prevent pushing an empty array if shapes hasn't initialized fully
		if (shapes && shapes.length > 0) {
			setCodeBlocks(shapes);
			setBlockOrder(mainThread);
		}
	}, [shapes, mainThread, setCodeBlocks, setBlockOrder]);

	useEffect(() => {
		addAction({
			target: "canvasCode",
			trigger: ActionLabels.DELETE_CODE_BLOCK,
			cb: (id: number) => {
				setShapes((prev) => {
					return prev
						.filter((s) => {
							return s.id !== id;
						})
						.map((s) => {
							if (s.nextId === id) {
								return { ...s, nextId: null };
							}
							return s;
						});
				});
			},
		});

		addAction({
			target: "canvasCode",
			trigger: ActionLabels.UPDATE_CODE_BLOCK_VALUES,
			cb: ({ id, val }: { id: number; val: number }) => {
				setShapes((prev) => {
					return prev.map((s) => {
						if (s.id === id) {
							return { ...s, value: val };
						}
						return s;
					});
				});
			},
		});
	}, [addAction]);

	const drawBlockPath = (
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		w: number,
		h: number,
		isStart: boolean,
	) => {
		const tabH = 20;
		const tabY = y + (h - tabH) / 2;

		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + w, y);

		// Right tab (Outwards)
		ctx.lineTo(x + w, tabY);
		ctx.arc(x + w, tabY + tabH / 2, tabH / 2, -Math.PI / 2, Math.PI / 2);
		ctx.lineTo(x + w, y + h);
		ctx.lineTo(x, y + h);

		// Left tab (Inwards - Cutout)
		if (!isStart) {
			ctx.lineTo(x, tabY + tabH);
			ctx.arc(x, tabY + tabH / 2, tabH / 2, Math.PI / 2, -Math.PI / 2, true);
		}

		ctx.lineTo(x, y);
		ctx.closePath();
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: todo
	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");

		if (!canvas || !ctx) {
			return;
		}

		const dpr = window.devicePixelRatio || 1;
		const cw = canvas.width / dpr;
		const ch = canvas.height / dpr;

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, cw, ch);

		// Draw Bottom Template Area (Spawn Area)
		const boxWidth = 800;
		const boxHeight = 120;
		const boxX = (cw - boxWidth) / 2;
		const boxY = ch - boxHeight - 40;

		ctx.setLineDash([10, 8]);
		ctx.strokeStyle = "#94a3b8";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 20);
		ctx.stroke();
		ctx.setLineDash([]);

		// Draw Templates
		const gap = 150;
		const startX =
			boxX +
			(boxWidth -
				(TEMPLATES.length * 140 + (TEMPLATES.length - 1) * (gap - 140))) /
				2;

		TEMPLATES.forEach((type, index) => {
			const tx = startX + index * gap;
			const ty = boxY + 30;

			ctx.save();
			ctx.fillStyle = COLORS[type];
			drawBlockPath(ctx, tx, ty, 140, 60, false);
			ctx.fill();

			// Dashed border for templates
			ctx.setLineDash([4, 4]);
			ctx.strokeStyle = "#000";
			ctx.lineWidth = 1.5;
			ctx.stroke();

			ctx.fillStyle = "#fff";
			ctx.font = "bold 13px sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(type.toUpperCase(), tx + 70, ty + 25);

			ctx.font = "11px sans-serif";
			ctx.fillText("1000ms", tx + 70, ty + 45);
			ctx.restore();
		});

		// Draw Active Canvas Shapes
		[...shapes]
			.sort((a) => {
				if (a.id === dragState?.id) {
					return 1;
				}
				return -1;
			})
			.forEach((s) => {
				const isMain = mainThread.includes(s.id);

				ctx.save();
				ctx.globalAlpha =
					isMain || dragState?.id === s.id || s.id === 0 ? 1 : 0.4;

				ctx.fillStyle = s.color;
				drawBlockPath(ctx, s.x, s.y, s.width, s.height, s.type === "Start");
				ctx.fill();

				// Active Blocks styling matching the image (dashed border for all active components)
				ctx.setLineDash([4, 4]);
				ctx.strokeStyle = "#000";
				ctx.lineWidth = isMain ? 2.5 : 1.5;
				ctx.stroke();

				ctx.fillStyle = "#fff";
				ctx.font = "bold 13px sans-serif";
				ctx.textAlign = "center";
				ctx.fillText(
					s.type.toUpperCase(),
					s.x + s.width / 2,
					s.y + (s.id === 0 ? 35 : 25),
				);

				if (s.id !== 0) {
					ctx.font = "11px sans-serif";
					ctx.fillText(`${s.value}ms`, s.x + s.width / 2, s.y + 45);
				}
				ctx.restore();
			});
	}, [shapes, mainThread, dragState]);

	useEffect(() => {
		const observer = new ResizeObserver(() => {
			const canvas = canvasRef.current;
			const container = containerRef.current;

			if (!canvas || !container) {
				return;
			}

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

		if (containerRef.current) {
			observer.observe(containerRef.current);
		}

		return () => {
			observer.disconnect();
		};
	}, [draw]);

	useEffect(() => {
		draw();
	}, [draw]);

	const handleMouseDown = (e: React.MouseEvent) => {
		if (!canvasRef.current) {
			return;
		}
		const rect = canvasRef.current.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		const my = e.clientY - rect.top;

		const dpr = window.devicePixelRatio || 1;
		const cw = canvasRef.current.width / dpr;
		const ch = canvasRef.current.height / dpr;

		// 1. Check if clicking on Templates (Spawn Area)
		const boxWidth = 800;
		const boxHeight = 120;
		const boxX = (cw - boxWidth) / 2;
		const boxY = ch - boxHeight - 40;
		const gap = 150;
		const startX =
			boxX +
			(boxWidth -
				(TEMPLATES.length * 140 + (TEMPLATES.length - 1) * (gap - 140))) /
				2;

		if (
			my >= boxY &&
			my <= boxY + boxHeight &&
			mx >= boxX &&
			mx <= boxX + boxWidth
		) {
			let clickedTemplate: CommandType | null = null;
			let tx = 0;
			const ty = boxY + 30;

			for (let i = 0; i < TEMPLATES.length; i++) {
				const checkX = startX + i * gap;
				if (mx >= checkX && mx <= checkX + 140 && my >= ty && my <= ty + 60) {
					clickedTemplate = TEMPLATES[i];
					tx = checkX;
					break;
				}
			}

			if (clickedTemplate) {
				const newId = Date.now();
				const newShape: CodeBlockShape = {
					id: newId,
					type: clickedTemplate,
					value: 1000,
					x: tx,
					y: ty,
					width: 140,
					height: 60,
					color: COLORS[clickedTemplate],
					nextId: null,
				};

				setShapes((prev) => {
					return [...prev, newShape];
				});

				setDragState({
					id: newId,
					ox: mx - tx,
					oy: my - ty,
					isNew: true,
					startX: mx,
					startY: my,
				});
				return;
			}
		}

		// 2. Check if clicking on existing active shapes
		const target = [...shapes].reverse().find((s) => {
			return (
				!s.isLocked &&
				mx >= s.x &&
				mx <= s.x + s.width &&
				my >= s.y &&
				my <= s.y + s.height
			);
		});

		if (target) {
			setDragState({
				id: target.id,
				ox: mx - target.x,
				oy: my - target.y,
				isNew: false,
				startX: mx,
				startY: my,
			});
		}
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!dragState || !canvasRef.current) {
			return;
		}

		const rect = canvasRef.current.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		const my = e.clientY - rect.top;

		let nx = mx - dragState.ox;
		let ny = my - dragState.oy;

		for (const o of shapes) {
			if (o.id === dragState.id) {
				continue;
			}

			const dx = Math.abs(nx - (o.x + o.width));
			const dy = Math.abs(ny - o.y);

			// Snap to right edge of another block
			if (dx < SNAP_THRESHOLD && dy < SNAP_THRESHOLD) {
				nx = o.x + o.width;
				ny = o.y;
				break;
			}
		}

		setShapes((prev) => {
			return prev.map((s) => {
				if (s.id === dragState.id) {
					return { ...s, x: nx, y: ny };
				}
				return s;
			});
		});
	};

	const handleMouseUp = (e: React.MouseEvent) => {
		if (!dragState || !canvasRef.current) {
			return;
		}

		const rect = canvasRef.current.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		const my = e.clientY - rect.top;

		setShapes((prev) => {
			// Logic for Template "Click to Append"
			if (dragState.isNew) {
				const distMoved = Math.sqrt(
					(mx - dragState.startX) ** 2 + (my - dragState.startY) ** 2,
				);

				if (distMoved < 5) {
					// Identify the last block in the flow chain
					let currentId: number | null | undefined = 0;
					let lastBlock = prev.find((s) => {
						return s.id === 0;
					});

					while (currentId !== null && currentId !== undefined) {
						const shape = prev.find((s) => {
							return s.id === currentId;
						});
						if (!shape) {
							break;
						}
						lastBlock = shape;
						currentId = shape.nextId;
					}

					if (lastBlock) {
						return prev.map((s) => {
							if (s.id === lastBlock?.id) {
								return { ...s, nextId: dragState.id };
							}
							if (s.id === dragState.id) {
								return {
									...s,
									x: lastBlock.x + lastBlock.width,
									y: lastBlock.y,
								};
							}
							return s;
						});
					}
				}
			}

			// Standard Drag & Drop Logic
			const active = prev.find((s) => {
				return s.id === dragState.id;
			});

			if (!active) {
				return prev;
			}

			const parent = prev.find((o) => {
				return (
					o.id !== dragState.id &&
					Math.abs(active.x - (o.x + o.width)) < 5 &&
					Math.abs(active.y - o.y) < 5
				);
			});

			return prev.map((s) => {
				const u = { ...s };
				if (u.nextId === dragState.id) {
					u.nextId = null;
				}
				if (parent && u.id === parent.id) {
					u.nextId = dragState.id;
				}
				return u;
			});
		});

		setDragState(null);
	};

	return (
		<div
			className="flex-1 h-screen bg-[#f0f4f8] overflow-hidden relative"
			ref={containerRef}
		>
			<canvas
				ref={canvasRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				className="w-full h-full cursor-pointer"
			/>
		</div>
	);
};
