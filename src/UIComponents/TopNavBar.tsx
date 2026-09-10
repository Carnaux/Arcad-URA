import { ActionLabels } from "../store/ActionsLabels";
import { useStore } from "../store/Store";
import { ModeSelect } from "./ModeSelect";

export const TopNavBar = () => {
	const triggerAction = useStore((store) => store.triggerAction);

	return (
		<div className="w-full flex justify-between items-start absolute top-0 z-[101] mt-2 px-4 bg-transparent pointer-events-none">
			<button
				type="button"
				className="w-11 h-11 rounded-full bg-[#d9d9d9] flex justify-center items-center shadow-[2px_2px_5px_rgba(0,0,0,0.2)] hover:bg-[#cecece] transition-colors pointer-events-auto border border-gray-300"
				onClick={() => {
					triggerAction(
						ActionLabels.TOGGLE_MQTT_CONNECTION_MODAL,
						"mqttConnectionModal",
					);
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="black"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<title>wifi</title>
					<path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
					<path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
					<path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
					<line x1="12" y1="20" x2="12.01" y2="20"></line>
				</svg>
			</button>

			<div className="pointer-events-auto">
				<ModeSelect />
			</div>
		</div>
	);
};
