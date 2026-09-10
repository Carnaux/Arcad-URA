import mqtt from "mqtt";
import { useEffect, useState } from "react";
import { ActionLabels } from "../../store/ActionsLabels";
import { useStore } from "../../store/Store";

export const MqttConnectionModal = () => {
	const triggerAction = useStore((store) => store.triggerAction);
	const mqttInstance = useStore((store) => store.mqttInstance);
	const setMqttInstance = useStore((store) => store.setMqttInstance);
	const pushToPayloadHistory = useStore((store) => store.pushToPayloadHistory);

	const [brokerEndpoint, setBrokerEndpoint] = useState<string>(
		"ws://192.168.0.4:9001",
	);
	const [subscribeChannel, setSubscribeChannel] =
		useState<string>("oribot/publish");
	const [publishChannel, setPublishChannel] = useState<string>("arcad/publish");
	const [tickTime, setTickTime] = useState<number>(10);
	const [connected, setConnected] = useState<boolean>(false);

	const handleOnConnect = () => {
		if (mqttInstance && !brokerEndpoint && !subscribeChannel) {
			return;
		}

		const instance = mqtt.connect(brokerEndpoint, {
			clean: true,
			connectTimeout: 4000,
			reconnectPeriod: 1000,
		});

		instance.on("connect", () => {
			console.log("Connected to MQTT broker");
			setConnected(true);
			instance.subscribe(subscribeChannel, (err) => {
				if (!err) {
					instance.publish(publishChannel, "Browser client connected!!");
				}
			});
		});

		instance.on("message", (_topic, payload) => {
			pushToPayloadHistory(payload.toString());
		});

		instance.on("close", () => {
			console.log("Connection closed");
			setConnected(false);
		});

		instance.on("error", (err) => {
			console.error("Connection error: ", err);
			instance.end();
			setConnected(false);
		});

		instance.on("end", () => {
			console.log("Connection ended");
			setConnected(false);
		});

		setMqttInstance(instance);
	};

	const handleOnDisconnect = () => {
		if (!mqttInstance) {
			return;
		}

		mqttInstance.end();
		setConnected(false);
	};

	useEffect(() => {
		if (mqttInstance) {
			setConnected(mqttInstance.connected);
		}
	}, [mqttInstance]);

	return (
		<div className="absolute inset-0 w-full h-full bg-black/40 backdrop-blur-sm flex justify-center items-center pointer-events-auto z-[101]">
			<div className="w-[380px] bg-[#ececec] rounded-xl shadow-2xl p-6 border border-gray-400 flex flex-col gap-5">
				{/* Header */}
				<div className="flex justify-between items-center border-b border-gray-300 pb-3">
					<div>
						<h2 className="text-[18px] font-bold text-black tracking-tight">
							MQTT Connection
						</h2>
						<p className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mt-0.5">
							Broker Configuration
						</p>
						<div
							className={`h-3 w-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
							title={connected ? "Connected" : "Disconnected"}
						/>
					</div>
					<button
						type="button"
						onClick={() => {
							triggerAction(
								ActionLabels.TOGGLE_MQTT_CONNECTION_MODAL,
								"mqttConnectionModal",
							);
						}}
						className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-black font-bold shadow-[2px_2px_4px_rgba(0,0,0,0.1)] hover:bg-gray-100 transition-colors"
					>
						✕
					</button>
				</div>

				{/* Form Inputs */}
				<div className="flex flex-col gap-4 py-2">
					<label className="flex flex-col gap-1.5 font-bold text-[13px] text-black">
						Broker Endpoint
						<input
							type="text"
							placeholder="ws://localhost:9001"
							value={brokerEndpoint}
							onChange={(e) => {
								setBrokerEndpoint(e.target.value);
							}}
							className="px-3 py-2 rounded-md bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black shadow-inner font-normal"
						/>
					</label>

					<label className="flex flex-col gap-1.5 font-bold text-[13px] text-black">
						Subscribe Channel
						<input
							type="text"
							placeholder="oribot/publish"
							value={subscribeChannel}
							onChange={(e) => {
								setSubscribeChannel(e.target.value);
							}}
							className="px-3 py-2 rounded-md bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black shadow-inner font-normal"
						/>
					</label>
					<label className="flex flex-col gap-1.5 font-bold text-[13px] text-black">
						Publish Channel
						<input
							type="text"
							placeholder="arcad/publish"
							value={publishChannel}
							onChange={(e) => {
								setPublishChannel(e.target.value);
							}}
							className="px-3 py-2 rounded-md bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black shadow-inner font-normal"
						/>
					</label>

					<label className="flex flex-col gap-1.5 font-bold text-[13px] text-black">
						Tick Time
						<input
							type="number"
							placeholder="10"
							value={tickTime}
							onChange={(e) => {
								setTickTime(parseInt(e.target.value, 10));
							}}
							className="px-3 py-2 rounded-md bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black shadow-inner font-normal"
						/>
					</label>
				</div>

				{/* Footer Actions */}
				<div className="flex justify-between items-center pt-2 border-t border-gray-300">
					<button
						type="button"
						onClick={() => {
							handleOnDisconnect();
						}}
						className="px-4 py-1.5 text-[13px] font-bold text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
						disabled={!connected}
					>
						Disconnect
					</button>

					<button
						type="button"
						onClick={() => {
							handleOnConnect();
						}}
						disabled={brokerEndpoint.length === 0 || connected}
						className={`px-6 py-1.5 text-[13px] font-bold rounded-full shadow-[2px_2px_5px_rgba(0,0,0,0.3)] transition-colors disabled:opacity-50 ${
							brokerEndpoint.length === 0
								? "bg-gray-400 text-gray-200 cursor-not-allowed"
								: "bg-black text-white hover:bg-gray-800"
						}`}
					>
						Connect
					</button>
				</div>
			</div>
		</div>
	);
};
