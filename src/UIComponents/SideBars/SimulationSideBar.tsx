/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { useEffect, useRef, useState } from "react";
import type { SimulationPartConfig } from "../../store/AppSlice";
import { useStore } from "../../store/Store";

const defaultPartValues: Record<string, SimulationPartConfig> = {
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

// Helper to prevent "forced digit" input issues
const InputField = ({
	value,
	onChange,
}: {
	value: number;
	onChange: (val: number) => void;
}) => {
	const [localValue, setLocalValue] = useState(value.toString());

	useEffect(() => {
		setLocalValue(value.toString());
	}, [value]);

	return (
		<input
			type="number"
			value={localValue}
			onChange={(e) => setLocalValue(e.target.value)}
			onBlur={() => onChange(parseFloat(localValue) || 0)}
			className="w-16 bg-white border border-gray-300 rounded-full text-center py-0.5 font-bold text-[13px] shadow-inner"
		/>
	);
};

export const SimulationSideBar = () => {
	const partsList = [
		"Wheel Left",
		"Wheel Right",
		"Motor Left",
		"Motor Right",
		"HC-04",
		"L9110",
		"ESP-32",
		"Battery",
		"MT3608",
	];

	const { simulationParts, setSimulationParts } = useStore((store) => store);
	const [selectedPart, setSelectedPart] = useState("HC-04");

	// States synced from Simulation via events
	const [hasImportedCode, setHasImportedCode] = useState(false);
	const [hasRecordedCommands, setHasRecordedCommands] = useState(false);
	const [hasReportData, setHasReportData] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const handleStateUpdate = (e: any) => {
			setHasImportedCode(e.detail.hasCode);
			setHasRecordedCommands(e.detail.hasRecorded);
		};

		const handleTelemetryUpdate = () => {
			setHasReportData(true);
		};

		window.addEventListener("SIM_STATE_UPDATE", handleStateUpdate);
		window.addEventListener("SIM_TELEMETRY_UPDATE", handleTelemetryUpdate);

		return () => {
			window.removeEventListener("SIM_STATE_UPDATE", handleStateUpdate);
			window.removeEventListener("SIM_TELEMETRY_UPDATE", handleTelemetryUpdate);
		};
	}, []);

	const handleValueChange = (val: number, prop: keyof SimulationPartConfig) => {
		const currentPartState =
			simulationParts?.[selectedPart] || defaultPartValues[selectedPart];
		setSimulationParts(selectedPart, {
			...currentPartState,
			[prop]: val,
		});
	};

	const handleResetToDefault = () => {
		setSimulationParts(selectedPart, { ...defaultPartValues[selectedPart] });
	};

	const handleImportCode = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const parsedData = JSON.parse(e.target?.result as string);
				window.dispatchEvent(
					new CustomEvent("SIM_LOAD_CODE", { detail: parsedData }),
				);
			} catch (error) {
				console.error("Parse Error", error);
			}
		};
		reader.readAsText(file);
		event.target.value = "";
	};

	const generatePDFReport = () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const telemetry = (window as any).__LAST_TELEMETRY__;
		if (!telemetry || telemetry.length === 0) {
			alert("No simulation data found. Run a simulation first.");
			return;
		}

		// Kinematics Calculation
		const r = 3.5; // Wheel radius (7cm diameter)
		const d = 14.0;
		let x = 0,
			y = 0,
			theta = 0;
		const pathPoints = [{ x: 0, y: 0, theta: 0 }];

		telemetry.forEach((t: any) => {
			if (t.command === "L") theta += Math.PI / 2;
			else if (t.command === "R") theta -= Math.PI / 2;
			else {
				// Assuming 1s duration, calculate displacement
				const v = 5; // Velocity constant for demo
				x += v * Math.cos(theta);
				y += v * Math.sin(theta);
			}
			pathPoints.push({ x, y, theta });
		});

		const printWindow = window.open("", "_blank");
		if (!printWindow) return;

		printWindow.document.write(`
            <html>
                <head>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h1>Simulation Report</h1>
                    <canvas id="c" width="500" height="400"></canvas>
                    <h2>Telemetry</h2>
                    <table>
                        <tr><th>Command</th><th>Duration</th><th>mA</th><th>V</th></tr>
                        ${telemetry.map((t: any) => `<tr><td>${t.command}</td><td>${t.duration}</td><td>${t.mA_draw}</td><td>${t.v_level}</td></tr>`).join("")}
                    </table>
                   <script>
						const ctx = document.getElementById('c').getContext('2d');
						const path = ${JSON.stringify(pathPoints)};
						ctx.translate(250, 200);

						// Draw trajectory path
						ctx.beginPath();
						ctx.moveTo(0,0);
						path.forEach(p => ctx.lineTo(p.x * 20, -p.y * 20));
						ctx.strokeStyle = '#3b82f6';
						ctx.lineWidth = 3;
						ctx.stroke();

						// Draw Starting Circle (Green)
						ctx.fillStyle = 'green';
						ctx.beginPath();
						ctx.arc(0, 0, 6, 0, Math.PI * 2);
						ctx.fill();

						// Draw End Circle (Red)
						const end = path[path.length - 1];
						ctx.fillStyle = 'red';
						ctx.beginPath();
						ctx.arc(end.x * 20, -end.y * 20, 6, 0, Math.PI * 2);
						ctx.fill();

						setTimeout(() => window.print(), 500);
					</script>
                </body>
            </html>
        `);
		printWindow.document.close();
	};

	const currentPart =
		simulationParts?.[selectedPart] || defaultPartValues[selectedPart];
	const defaultPartInfo = defaultPartValues[selectedPart];

	return (
		<div className="w-full min-w-[320px] h-screen bg-[#d9d9d9] shadow-[-2px_0_5px_rgba(0,0,0,0.1)] flex flex-col items-center py-6 px-4 z-10 overflow-y-auto">
			{/* Parts List */}
			<div className="w-full bg-[#cecece] rounded-xl border border-gray-400 mb-6 h-[200px] flex flex-col">
				<p className="text-center font-bold text-[13px] pt-3 pb-2">Parts</p>
				<div className="flex flex-col overflow-y-auto flex-1">
					{partsList.map((part) => (
						<button
							key={part}
							onClick={() => setSelectedPart(part)}
							className={`w-full text-left px-4 py-1 font-bold text-[12px] ${selectedPart === part ? "bg-white" : ""}`}
						>
							{part}
						</button>
					))}
				</div>
			</div>

			{/* Config Box */}
			<div className="w-full bg-[#cecece] rounded-xl border-2 border-dashed border-gray-500 p-4 mb-6 flex flex-col items-center">
				<p className="font-bold text-[14px] mb-4">{selectedPart}</p>
				{defaultPartInfo.value !== -1 && (
					<div className="flex items-center gap-2 mb-4">
						<span className="font-bold text-[13px]">Value:</span>
						<InputField
							value={currentPart.value}
							onChange={(v) => handleValueChange(v, "value")}
						/>
					</div>
				)}
				{(defaultPartInfo.mA !== -1 || defaultPartInfo.v !== -1) && (
					<div className="flex justify-between w-full px-2 mb-6">
						{defaultPartInfo.mA !== -1 && (
							<div className="flex items-center gap-2">
								<span className="font-bold text-[13px]">mA:</span>
								<InputField
									value={currentPart.mA}
									onChange={(v) => handleValueChange(v, "mA")}
								/>
							</div>
						)}
						{defaultPartInfo.v !== -1 && (
							<div className="flex items-center gap-2">
								<span className="font-bold text-[13px]">V:</span>
								<InputField
									value={currentPart.v}
									onChange={(v) => handleValueChange(v, "v")}
								/>
							</div>
						)}
					</div>
				)}
				<button
					onClick={handleResetToDefault}
					className="w-full border-2 border-black rounded-full py-1 text-[10px] font-bold uppercase hover:bg-black hover:text-white"
				>
					Reset
				</button>
			</div>

			{/* Report */}
			<div className="w-full bg-[#cecece] rounded-xl border border-gray-400 p-3 mb-4">
				<p className="text-center font-bold text-[13px] mb-3">REPORT</p>
				<button
					onClick={generatePDFReport}
					disabled={!hasReportData}
					className="w-full border-2 border-black rounded-full py-1 text-[11px] font-bold uppercase hover:bg-black hover:text-white disabled:opacity-50"
				>
					View & Export
				</button>
			</div>

			{/* Recorded/Code Buttons */}
			<div className="w-full bg-[#cecece] rounded-xl border border-gray-400 p-3 mb-4">
				<p className="text-center font-bold text-[13px] mb-3">RECORDED</p>
				<div className="flex gap-2">
					<button
						disabled={!hasRecordedCommands}
						onClick={() =>
							window.dispatchEvent(new CustomEvent("SIM_RUN_RECORDED"))
						}
						className="flex-1 border-2 border-black rounded-full py-1 text-[11px] font-bold uppercase"
					>
						Re-Run
					</button>
					<button
						disabled={!hasRecordedCommands}
						onClick={() =>
							window.dispatchEvent(new CustomEvent("SIM_EXPORT_RECORDED"))
						}
						className="flex-1 border-2 border-black rounded-full py-1 text-[11px] font-bold uppercase"
					>
						Export
					</button>
				</div>
			</div>

			<div className="w-full bg-[#cecece] rounded-xl border border-gray-400 p-3">
				<p className="text-center font-bold text-[13px] mb-3">CODE</p>
				<div className="flex gap-2">
					<button
						disabled={!hasImportedCode}
						onClick={() =>
							window.dispatchEvent(new CustomEvent("SIM_RUN_CODE"))
						}
						className="flex-1 border-2 border-black rounded-full py-1 text-[11px] font-bold uppercase"
					>
						Run
					</button>
					<button
						onClick={() => fileInputRef.current?.click()}
						className="flex-1 border-2 border-black rounded-full py-1 text-[11px] font-bold uppercase"
					>
						Import
					</button>
					<input
						type="file"
						ref={fileInputRef}
						className="hidden"
						onChange={handleImportCode}
					/>
				</div>
			</div>
		</div>
	);
};
