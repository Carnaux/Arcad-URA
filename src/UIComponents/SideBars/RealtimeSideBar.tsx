/** biome-ignore-all lint/suspicious/noArrayIndexKey: todo */
import { useEffect, useState } from "react";
import { ActionLabels } from "../../store/ActionsLabels";
import { useStore } from "../../store/Store";

// Metadata structure to link the UI options to the store IDs and model parts
const DEVICE_METADATA: Record<
	string,
	{ name: string; type: string; partName: string }
> = {
	hc04: {
		name: "HC-04",
		type: "Sensor",
		partName: "ultrasonic",
	},
};

// Helper function to format the timestamp to match the previous UI style
const formatTimestamp = (timestamp: number) => {
	const d = new Date(timestamp);
	const pad = (n: number) => {
		return n.toString().padStart(2, "0");
	};
	return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}-${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const RealtimeSideBar = () => {
	const triggerAction = useStore((store) => store.triggerAction);
	const sensorConfigs = useStore((store) => store.sensorConfigs);
	const setSensorConfig = useStore((store) => store.setSensorConfig);
	const sensorHistory = useStore((store) => store.sensorHistory);

	const [selectedId, setSelectedId] = useState<string | null>(null);

	// States to handle the editable configurations
	const [minValue, setMinValue] = useState<number | string>("");
	const [maxValue, setMaxValue] = useState<number | string>("");
	const [minColor, setMinColor] = useState<string>("#000000");
	const [maxColor, setMaxColor] = useState<string>("#000000");

	// Sync local configuration state whenever the selection changes
	useEffect(() => {
		if (selectedId !== null) {
			const config = sensorConfigs[selectedId];
			if (config !== undefined) {
				setMinValue(config.minValue);
				setMaxValue(config.maxValue);
				setMinColor(config.minColor);
				setMaxColor(config.maxColor);
			} else {
				// Reset to defaults if no configuration exists in the store yet
				setMinValue("");
				setMaxValue("");
				setMinColor("#000000");
				setMaxColor("#ffffff");
			}
		}
	}, [selectedId, sensorConfigs]);

	// Update the store configuration safely
	// biome-ignore lint/suspicious/noExplicitAny: generic value handler
	const handleConfigUpdate = (key: string, value: any) => {
		if (selectedId === null) {
			return;
		}

		const currentConfig = sensorConfigs[selectedId] || {
			partName: DEVICE_METADATA[selectedId].partName,
			minValue: 0,
			maxValue: 100,
			minColor: "#000000",
			maxColor: "#ffffff",
		};

		const newConfig = { ...currentConfig, [key]: value };
		setSensorConfig(selectedId, newConfig);
	};

	const handleSelect = (id: string) => {
		if (selectedId !== null && selectedId !== id) {
			const prevPart = DEVICE_METADATA[selectedId].partName;
			triggerAction(ActionLabels.DESELECT_FROM_REALTIME_LIST, "realtimeList", {
				selected: prevPart,
			});
		}

		setSelectedId(id);

		const newPart = DEVICE_METADATA[id].partName;
		triggerAction(
			ActionLabels.TOGGLE_SELECT_FROM_REALTIME_LIST,
			"realtimeList",
			{
				selected: newPart,
			},
		);
	};

	const selectedData = selectedId !== null ? DEVICE_METADATA[selectedId] : null;

	// Retrieve and sort the history array (newest first)
	let currentHistory: { value: any; timestamp: number }[] = [];
	if (selectedId !== null) {
		if (sensorHistory[selectedId] !== undefined) {
			currentHistory = [...sensorHistory[selectedId]];
			currentHistory.sort((a, b) => {
				return b.timestamp - a.timestamp;
			});
		}
	}

	return (
		<div className="w-full min-h-screen bg-[#d9d9d9] flex flex-col items-center py-6 px-4 font-sans text-black shadow-[-2px_0_5px_rgba(0,0,0,0.1)]">
			{/* Sensors/Actuators List Box */}
			<div className="w-full bg-[#cecece] rounded-xl shadow-[2px_2px_8px_rgba(0,0,0,0.2)] border border-gray-400 overflow-hidden mb-8 pb-12">
				<p className="text-center font-bold text-[15px] pt-4 pb-6">
					Sensors/Actuators
				</p>
				<div className="flex flex-col w-full">
					<button
						type="button"
						className={`w-full text-left px-4 py-1.5 font-bold text-[14px] transition-colors ${
							selectedId === "hc04" ? "bg-white" : "hover:bg-white/40"
						}`}
						onClick={() => {
							handleSelect("hc04");
						}}
					>
						HC-04
					</button>
				</div>
			</div>

			{/* Inspector Details */}
			{selectedData !== null ? (
				<div className="w-full px-2 flex flex-col">
					<p className="text-center font-bold text-[16px] mb-6">Inspector</p>

					<div className="flex justify-between items-center w-full font-bold text-[14px] mb-8">
						<span>Name: {selectedData.name}</span>
						<span>Type: {selectedData.type}</span>
					</div>

					<p className="text-center font-bold text-[15px] mb-6">
						Configuration
					</p>

					{/* Min Config */}
					<div className="flex justify-between items-center w-full font-bold text-[13px] mb-4">
						<label className="flex items-center gap-1">
							Min Value:
							<input
								type="number"
								className="w-10 border-b text-left focus:outline-none p-0 bg-transparent"
								value={minValue}
								onChange={(e) => {
									setMinValue(e.target.value);
									handleConfigUpdate("minValue", Number(e.target.value));
								}}
							/>
						</label>
						<label className="flex items-center gap-2 cursor-pointer">
							Color:
							<div className="relative w-4 h-4 rounded-sm overflow-hidden flex-shrink-0">
								<input
									type="color"
									className="absolute -top-2 -left-2 w-8 h-8 cursor-pointer"
									value={minColor}
									onChange={(e) => {
										setMinColor(e.target.value);
										handleConfigUpdate("minColor", e.target.value);
									}}
								/>
							</div>
							<span>{minColor.toUpperCase()}</span>
						</label>
					</div>

					{/* Max Config */}
					<div className="flex justify-between items-center w-full font-bold text-[13px] mb-8">
						<label className="flex items-center gap-1">
							Max Value:
							<input
								type="number"
								className="w-10 border-b text-left focus:outline-none p-0 bg-transparent"
								value={maxValue}
								onChange={(e) => {
									setMaxValue(e.target.value);
									handleConfigUpdate("maxValue", Number(e.target.value));
								}}
							/>
						</label>
						<label className="flex items-center gap-2 cursor-pointer">
							Color:
							<div className="relative w-4 h-4 rounded-sm overflow-hidden flex-shrink-0">
								<input
									type="color"
									className="absolute -top-2 -left-2 w-8 h-8 cursor-pointer"
									value={maxColor}
									onChange={(e) => {
										setMaxColor(e.target.value);
										handleConfigUpdate("maxColor", e.target.value);
									}}
								/>
							</div>
							<span>{maxColor.toUpperCase()}</span>
						</label>
					</div>

					<p className="text-center font-bold text-[15px] mb-4">Last values</p>

					{/* History List Box */}
					<div className="w-full bg-[#d9d9d9] rounded-lg shadow-[inset_2px_2px_6px_rgba(0,0,0,0.3),_2px_2px_6px_rgba(0,0,0,0.1)] border border-gray-400 p-4 h-[220px] overflow-y-auto">
						<ul className="flex flex-col gap-1.5">
							{currentHistory.length === 0 ? (
								<li className="text-[11px] font-bold tracking-tight text-gray-500">
									No history recorded yet.
								</li>
							) : (
								currentHistory.map((record, index) => {
									return (
										<li
											key={index}
											className="text-[11px] font-bold tracking-tight"
										>
											{formatTimestamp(record.timestamp)} Value:{" "}
											{String(record.value)}
										</li>
									);
								})
							)}
						</ul>
					</div>
				</div>
			) : null}
		</div>
	);
};
