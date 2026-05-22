import { useStore } from "../store/Store";

export const ModeSelect = () => {
	const setMode = useStore((store) => store.setMode);

	const handleModeSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setMode(e.target.value);
	};

	return (
		<div className="flex flex-col items-center bg-[#d9d9d9] rounded-xl px-5 py-2 shadow-[2px_2px_6px_rgba(0,0,0,0.2)] border border-gray-300 z-[100]">
			<p className="text-[13px] font-bold text-black mb-1">Mode</p>
			<select
				onChange={handleModeSelection}
				className="bg-white rounded-full pl-3 pr-8 py-0.5 text-[13px] font-bold text-black shadow-[0px_2px_5px_rgba(0,0,0,0.15)] outline-none cursor-pointer border border-gray-200"
			>
				<option value={"realtime"} label="Realtime">
					Realtime
				</option>
				<option value={"code"} label="Code">
					Code
				</option>
				<option value={"simulation"} label="Simulation">
					Simulation
				</option>
			</select>
		</div>
	);
};
