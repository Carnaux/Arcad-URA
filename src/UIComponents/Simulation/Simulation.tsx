/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { useCallback, useEffect, useState } from "react";
import { useStore } from "../../store/Store";

// Default fallbacks to prevent crashes if the store isn't populated yet
const defaultPartValues: Record<string, any> = {
	"Wheel Left": { mA: -1, v: -1, value: 0 },
	"Wheel Right": { mA: -1, v: -1, value: 0 },
	"Motor Left": { mA: 1000, v: 4.8, value: 0 },
	"Motor Right": { mA: 1000, v: 4.8, value: 0 },
	"HC-04": { mA: 15, v: 5, value: 0 },
	L9110: { mA: 2000, v: 6.5, value: -1 },
	"ESP-32": { mA: 240, v: 6.5, value: 1 },
	Battery: { mA: 5000, v: 3.7, value: -1 },
	MT3608: { mA: 240, v: 6.5, value: -1 },
};

const Connection = ({
	x1,
	y1,
	x2,
	y2,
	active,
}: {
	x1: string;
	y1: string;
	x2: string;
	y2: string;
	active: boolean;
}) => {
	let strokeColor = "#000000";
	let dashArray = "none";

	if (!active) {
		strokeColor = "#ef4444";
	}

	if (!active) {
		dashArray = "5,5";
	}

	return (
		<line
			x1={x1}
			y1={y1}
			x2={x2}
			y2={y2}
			stroke={strokeColor}
			strokeWidth="2.5"
			strokeDasharray={dashArray}
			className="transition-all duration-300"
		/>
	);
};

const Node = ({ title, top, left, state, label }: any) => {
	const { simulationParts } = useStore((store) => {
		return store;
	});
	const partData = simulationParts?.[title] ||
		defaultPartValues[title] || { mA: -1, v: -1, value: -1 };

	let displayVal = partData.value;
	let bgClass = "bg-[#cbd5e1] border-[#94a3b8]";

	if (state === "off") {
		if (typeof partData.value === "number") {
			displayVal = 0;
		}
		bgClass = "bg-gray-300 border-gray-400";
	}

	if (state === "brownout" || state === "error") {
		if (typeof partData.value === "number") {
			displayVal = Math.floor(Math.random() * 300);
		} else {
			displayVal = 0;
		}
		bgClass = "bg-[#fca5a5] border-[#f87171]";
	}

	return (
		<div
			className={`absolute transform -translate-x-1/2 -translate-y-1/2 border-[2.5px] border-dashed rounded-xl p-2.5 flex flex-col items-start justify-center shadow-[2px_2px_5px_rgba(0,0,0,0.15)] font-bold text-[11px] text-black z-10 w-[100px] ${bgClass}`}
			style={{ top, left }}
		>
			<h4 className="w-full text-center border-b border-black/20 pb-1 mb-1 whitespace-nowrap">
				{title}
			</h4>
			{label && partData.value !== -1 && (
				<p>
					{label}: {displayVal}
				</p>
			)}
			{partData.mA !== -1 && <p>mA: {partData.mA}</p>}
			{partData.v !== -1 && <p>V: {partData.v}</p>}
		</div>
	);
};

export default function Simulation() {
	const { simulationParts } = useStore((store) => {
		return store;
	});

	const [glitchTicker, setGlitchTicker] = useState(0);
	const [isExecuting, setIsExecuting] = useState(false);

	const [recordedCommands, setRecordedCommands] = useState<
		{ m: string; t: number }[]
	>([]);
	const [importedCode, setImportedCode] = useState<{ m: string; t: number }[]>(
		[],
	);
	const [isRecording, setIsRecording] = useState(false);

	// Forces a fast re-render to simulate fluctuating values during a brownout
	useEffect(() => {
		const interval = setInterval(() => {
			setGlitchTicker((prev) => {
				return prev + 1;
			});
		}, 100);

		return () => {
			clearInterval(interval);
		};
	}, []);

	const batteryData =
		simulationParts?.["Battery"] || defaultPartValues["Battery"];
	const batteryV = batteryData.v;
	const batteryI = batteryData.mA;

	// Calculate total required current based on execution state
	let totalCurrentDraw = 0;

	// Base draw of the ESP32
	totalCurrentDraw += (
		simulationParts?.["ESP-32"] || defaultPartValues["ESP-32"]
	).mA;

	if (isExecuting) {
		// Add motor draw if executing
		totalCurrentDraw += (
			simulationParts?.["Motor Left"] || defaultPartValues["Motor Left"]
		).mA;
		totalCurrentDraw += (
			simulationParts?.["Motor Right"] || defaultPartValues["Motor Right"]
		).mA;
	}

	// State Calculation Logic
	let mt3608State = "off";
	let esp32State = "off";
	let l9110State = "off";

	if (batteryV >= 2.0) {
		mt3608State = "normal";
	}

	if (mt3608State === "normal") {
		if (batteryI >= totalCurrentDraw) {
			esp32State = "normal";
		} else {
			if (batteryI > 0) {
				esp32State = "brownout";
			}
		}
	}

	if (mt3608State === "normal") {
		if (batteryI >= totalCurrentDraw) {
			l9110State = "normal";
		} else {
			if (batteryI > 0) {
				l9110State = "brownout";
			}
		}
	}

	// Hardware Crash Logic
	useEffect(() => {
		if (esp32State !== "normal") {
			if (isExecuting) {
				setIsExecuting(false);
				console.warn(
					"Hardware Crash: Lost power during execution due to insufficient mA.",
				);
			}
		}
	}, [esp32State, isExecuting]);

	// Command Simulation Execution
	const executeSequence = useCallback(
		async (commands: { m: string; t: number }[]) => {
			if (esp32State !== "normal" || l9110State !== "normal") {
				alert("Hardware Error: Check power supply limits.");
				return;
			}

			setIsExecuting(true);
			const telemetry: any = [];
			let currentTime = 0;

			for (const cmd of commands) {
				if (esp32State !== "normal") {
					break;
				}

				let lRpm = 0;
				let rRpm = 0;

				if (cmd.m === "F") {
					lRpm = 126;
					rRpm = 126;
				} else if (cmd.m === "B") {
					lRpm = -126;
					rRpm = -126;
				} else if (cmd.m === "L") {
					lRpm = -126;
					rRpm = 126;
				} else if (cmd.m === "R") {
					lRpm = 126;
					rRpm = -126;
				} else if (cmd.m === "S") {
					lRpm = 0;
					rRpm = 0;
				}

				telemetry.push({
					command: cmd.m,
					duration: cmd.t,
					startTime: currentTime,
					mA_draw: totalCurrentDraw,
					v_level: batteryV,
					left_rpm: lRpm,
					right_rpm: rRpm,
				});

				await new Promise((resolve) => {
					setTimeout(resolve, cmd.t);
				});
				currentTime += cmd.t;
			}

			setIsExecuting(false);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(window as any).__LAST_TELEMETRY__ = telemetry;
			window.dispatchEvent(new CustomEvent("SIM_TELEMETRY_UPDATE"));
		},
		[esp32State, l9110State, totalCurrentDraw, batteryV],
	);

	// Event Listeners from Sidebar
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const handleLoadCode = (e: any) => {
			setImportedCode(e.detail.steps);
		};
		const handleRunCode = () => {
			executeSequence(importedCode);
		};
		const handleRunRecorded = () => {
			executeSequence(recordedCommands);
		};
		const handleExportRecorded = () => {
			const dataStr =
				"data:text/json;charset=utf-8," +
				encodeURIComponent(
					JSON.stringify({ mode: "code", steps: recordedCommands }),
				);
			const anchor = document.createElement("a");
			anchor.setAttribute("href", dataStr);
			anchor.setAttribute("download", "recorded_commands.json");
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
		};

		window.addEventListener("SIM_LOAD_CODE", handleLoadCode);
		window.addEventListener("SIM_RUN_CODE", handleRunCode);
		window.addEventListener("SIM_RUN_RECORDED", handleRunRecorded);
		window.addEventListener("SIM_EXPORT_RECORDED", handleExportRecorded);

		return () => {
			window.removeEventListener("SIM_LOAD_CODE", handleLoadCode);
			window.removeEventListener("SIM_RUN_CODE", handleRunCode);
			window.removeEventListener("SIM_RUN_RECORDED", handleRunRecorded);
			window.removeEventListener("SIM_EXPORT_RECORDED", handleExportRecorded);
		};
	}, [executeSequence, importedCode, recordedCommands]);

	// Sync state back to sidebar UI
	useEffect(() => {
		window.dispatchEvent(
			new CustomEvent("SIM_STATE_UPDATE", {
				detail: {
					hasCode: importedCode.length > 0,
					hasRecorded: recordedCommands.length > 0,
				},
			}),
		);
	}, [importedCode, recordedCommands]);

	const toggleRecording = () => {
		if (isRecording) {
			// Stopping recording -> Immediately generate telemetry so the Report button activates
			const telemetry = recordedCommands.map((cmd, index) => {
				let lRpm = 0;
				let rRpm = 0;

				if (cmd.m === "F") {
					lRpm = 126;
					rRpm = 126;
				} else if (cmd.m === "B") {
					lRpm = -126;
					rRpm = -126;
				} else if (cmd.m === "L") {
					lRpm = -126;
					rRpm = 126;
				} else if (cmd.m === "R") {
					lRpm = 126;
					rRpm = -126;
				}

				return {
					command: cmd.m,
					duration: cmd.t,
					startTime: index * 1000,
					mA_draw: totalCurrentDraw,
					v_level: batteryV,
					left_rpm: lRpm,
					right_rpm: rRpm,
				};
			});
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(window as any).__LAST_TELEMETRY__ = telemetry;
			window.dispatchEvent(new CustomEvent("SIM_TELEMETRY_UPDATE"));
		}
		setIsRecording(!isRecording);
	};

	const handlePress = (dir: string) => {
		if (!isRecording || esp32State !== "normal") {
			return;
		}
		// Fixed 1000ms per command
		setRecordedCommands((prev) => {
			return [...prev, { m: dir, t: 1000 }];
		});
	};

	const hasMainPower = batteryV > 0;
	const mtPowerActive = mt3608State !== "off";
	const espPowerActive = esp32State !== "off";
	const l91PowerActive = l9110State !== "off";

	return (
		<div className="flex-1 relative bg-[#f0f4f8] font-sans overflow-hidden h-screen">
			<div className="absolute inset-0 flex justify-center items-center">
				<img
					src="/robotVector 1.png"
					alt="Robot Chassis"
					className="robot-chassis-image"
				/>
			</div>

			{/* SVG Connections Layer */}
			<svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
				<title>Connections</title>
				<Connection x1="25%" y1="78%" x2="35%" y2="64%" active={hasMainPower} />
				<Connection
					x1="35%"
					y1="64%"
					x2="50%"
					y2="38%"
					active={mtPowerActive}
				/>
				<Connection
					x1="35%"
					y1="64%"
					x2="50%"
					y2="61%"
					active={mtPowerActive}
				/>
				<Connection
					x1="50%"
					y1="38%"
					x2="50%"
					y2="61%"
					active={l91PowerActive}
				/>
				<Connection
					x1="38%"
					y1="30%"
					x2="48%"
					y2="38%"
					active={espPowerActive}
				/>
				<Connection
					x1="50%"
					y1="18%"
					x2="50%"
					y2="38%"
					active={espPowerActive}
				/>
				<Connection
					x1="65%"
					y1="30%"
					x2="50%"
					y2="38%"
					active={espPowerActive}
				/>
				<Connection
					x1="30%"
					y1="46%"
					x2="50%"
					y2="61%"
					active={l91PowerActive}
				/>
				<Connection
					x1="68%"
					y1="46%"
					x2="50%"
					y2="61%"
					active={l91PowerActive}
				/>
			</svg>

			{/* Hardware Nodes */}
			<Node
				title="Wheel Left"
				top="30%"
				left="35%"
				state={esp32State}
				label="RPM"
			/>
			<Node
				title="HC-04"
				top="22%"
				left="50%"
				state={esp32State}
				label="Distance"
			/>
			<Node
				title="Wheel Right"
				top="30%"
				left="65%"
				state={esp32State}
				label="RPM"
			/>
			<Node
				title="Motor Left"
				top="46%"
				left="32%"
				state={l9110State}
				label="RPM"
			/>
			<Node title="ESP-32" top="38%" left="50%" state={esp32State} />
			<Node
				title="Motor Right"
				top="46%"
				left="68%"
				state={l9110State}
				label="RPM"
			/>
			<Node title="MT3608" top="64%" left="36%" state={mt3608State} />
			<Node title="L9110" top="61%" left="50%" state={l9110State} />
			<Node title="Battery" top="80%" left="25%" state={l9110State} />

			{/* OVERLAYS: Recorded Commands & D-PAD */}
			<div className="absolute bottom-6 right-6 flex gap-4 z-20">
				{/* Current Recorded Commands Box */}
				<div className="w-[200px] h-[140px] border-2 border-dashed border-gray-800 bg-white rounded-xl shadow-lg flex flex-col items-center p-3 overflow-y-auto">
					<p className="text-[10px] font-bold text-center tracking-tight uppercase mb-4 sticky top-0 bg-white w-full border-b pb-1">
						Current Recorded
					</p>
					{recordedCommands.length === 0 ? (
						<span className="text-[10px] font-bold text-gray-500 m-auto">
							No recorded commands
						</span>
					) : (
						<div className="flex flex-col w-full gap-1">
							{recordedCommands.map((cmd, i) => {
								return (
									<div
										key={i}
										className="text-[10px] font-mono flex justify-between bg-gray-100 px-2 py-1 rounded"
									>
										<span>{cmd.m}</span>
										<span>{cmd.t}ms</span>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* D-Pad Controls Box */}
				<div className="w-[200px] border-2 border-dashed border-gray-800 bg-white rounded-xl shadow-lg p-3 flex flex-col items-center">
					<div className="flex justify-between w-full px-4 mb-4">
						<button
							type="button"
							onClick={toggleRecording}
							className={`flex flex-col items-center gap-1 hover:opacity-70 ${
								isRecording ? "text-red-500" : ""
							}`}
						>
							<div
								className={`w-6 h-6 border-2 rounded-full flex justify-center items-center ${
									isRecording ? "border-red-500" : "border-black"
								}`}
							>
								<div
									className={`w-3 h-3 rounded-full ${
										isRecording ? "bg-red-500" : "bg-black"
									}`}
								></div>
							</div>
							<span className="text-[9px] font-bold">
								{isRecording ? "RECORDING" : "RECORD"}
							</span>
						</button>
						<button
							type="button"
							onClick={() => {
								setRecordedCommands([]);
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								(window as any).__LAST_TELEMETRY__ = null;
							}}
							className="flex flex-col items-center gap-1 hover:opacity-70"
						>
							<div className="w-6 h-6 border-2 border-black rounded-sm flex justify-center items-center">
								<div className="w-3 h-3 bg-black"></div>
							</div>
							<span className="text-[9px] font-bold">CLEAR</span>
						</button>
					</div>

					{/* D-Pad Arrows */}
					<div className="relative w-28 h-28 mt-2">
						<div
							onMouseDown={() => {
								handlePress("S");
							}}
							className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-black rounded-full cursor-pointer hover:scale-105 z-10 shadow-[0px_2px_4px_rgba(0,0,0,0.3)]"
						>
							<div className="w-3 h-3 bg-white rounded-sm"></div>
						</div>

						<div
							onMouseDown={() => {
								handlePress("F");
							}}
							className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 flex flex-col items-center cursor-pointer hover:opacity-70"
						>
							<div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[16px] border-l-transparent border-r-transparent border-b-black"></div>
							<span className="text-[8px] font-bold mt-0.5">FORWARD</span>
						</div>
						<div
							onMouseDown={() => {
								handlePress("B");
							}}
							className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 flex flex-col items-center cursor-pointer hover:opacity-70"
						>
							<span className="text-[8px] font-bold mb-0.5">BACKWARD</span>
							<div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent border-t-black"></div>
						</div>
						<div
							onMouseDown={() => {
								handlePress("L");
							}}
							className="absolute top-1/2 left-0 -translate-x-4 -translate-y-1/2 flex items-center gap-1 cursor-pointer hover:opacity-70"
						>
							<span className="text-[8px] font-bold">LEFT</span>
							<div className="w-0 h-0 border-t-[12px] border-b-[12px] border-r-[16px] border-t-transparent border-b-transparent border-r-black"></div>
						</div>
						<div
							onMouseDown={() => {
								handlePress("R");
							}}
							className="absolute top-1/2 right-0 translate-x-4 -translate-y-1/2 flex items-center gap-1 cursor-pointer hover:opacity-70"
						>
							<div className="w-0 h-0 border-t-[12px] border-b-[12px] border-l-[16px] border-t-transparent border-b-transparent border-l-black"></div>
							<span className="text-[8px] font-bold">RIGHT</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
