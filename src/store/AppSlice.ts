/* eslint-disable @typescript-eslint/no-explicit-any */
import type mqtt from "mqtt";
import type { UraModelParts } from "../components/UraRobot";
import type { CodeBlockShape } from "../UIComponents/BlockCoding/CodeCanvas";

export interface SensorDataPoint {
	value: any;
	timestamp: number;
}

export interface SensorConfig {
	partName: string;
	minValue: number;
	maxValue: number;
	minColor: string;
	maxColor: string;
}

export interface SimulationPartConfig {
	mA: number;
	v: number;
	value: number;
}

export interface AppSlice {
	mode: string;
	setMode: (mode: string) => void;
	mqttInstance: mqtt.MqttClient | null;
	setMqttInstance: (instance: any) => void;
	uraModelParts: UraModelParts | null;
	setUraModelParts: (modelParts: UraModelParts) => void;

	payloadHistory: string[];
	sensorHistory: Record<string, SensorDataPoint[]>;
	pushToPayloadHistory: (payload: string) => void;

	sensorConfigs: Record<string, SensorConfig>;
	setSensorConfig: (sensorId: string, config: SensorConfig) => void;

	blockOrder: number[];
	setBlockOrder: (code: number[]) => void;
	codeBlocks: CodeBlockShape[];
	setCodeBlocks: (code: CodeBlockShape[]) => void;

	simulationParts: Record<string, SimulationPartConfig>;
	setSimulationParts: (part: string, config: SimulationPartConfig) => void;
}

export const createAppSlice = (set: any) => ({
	mode: "realtime",
	setMode: (selectedMode: string) => {
		set({ mode: selectedMode });
	},

	mqttInstance: null,
	setMqttInstance: (instance: any) => {
		set({ mqttInstance: instance });
	},

	uraModelParts: null,
	setUraModelParts: (modelParts: any) => {
		set({ uraModelParts: modelParts });
	},

	payloadHistory: [],
	sensorHistory: {},

	// Define default configurations for your sensors here
	sensorConfigs: {
		hc04: {
			partName: "ultrasonic",
			minValue: 0,
			maxValue: 40,
			minColor: "#ff0000",
			maxColor: "#00ff00",
		},
	},
	setSensorConfig: (sensorId: string, config: SensorConfig) => {
		set((state: AppSlice) => ({
			sensorConfigs: {
				...state.sensorConfigs,
				[sensorId]: config,
			},
		}));
	},

	pushToPayloadHistory: (payload: string) => {
		set((state: AppSlice) => {
			let parsedPayload: Record<string, any> = {};

			try {
				parsedPayload = JSON.parse(payload);
			} catch (error) {
				// Not valid JSON
			}

			const newSensorHistory = { ...state.sensorHistory };
			const currentTimestamp = Date.now();

			for (const key in parsedPayload) {
				if (Object.hasOwn(parsedPayload, key)) {
					if (!newSensorHistory[key]) {
						newSensorHistory[key] = [];
					}

					newSensorHistory[key] = [
						...newSensorHistory[key],
						{ value: parsedPayload[key], timestamp: currentTimestamp },
					];
				}
			}

			return {
				payloadHistory: [...state.payloadHistory, payload],
				sensorHistory: newSensorHistory,
			};
		});
	},

	blockOrder: [],
	setBlockOrder: (code: number[]) => {
		set({ blockOrder: code });
	},

	codeBlocks: [],
	setCodeBlocks: (blocks: CodeBlockShape[]) => {
		set({ codeBlocks: blocks });
	},

	simulationParts: {
		"Wheel Left": {
			mA: -1,
			v: -1,
			value: 0,
		},
		"Wheel Right": {
			mA: -1,
			v: -1,
			value: 0,
		},
		"Motor Left": {
			mA: 1000,
			v: 4.8,
			value: 0,
		},
		"Motor Right": {
			mA: 1000,
			v: 4.8,
			value: 0,
		},
		"HC-04": {
			mA: 15,
			v: 5,
			value: 0,
		},
		L9110: {
			mA: 2000,
			v: 6.5,
			value: -1,
		},
		"ESP-32": {
			mA: 240,
			v: 6.5,
			value: 1,
		},
		Battery: {
			mA: 5000,
			v: 3.7,
			value: -1,
		},
	},
	setSimulationParts: (part: string, config: SimulationPartConfig) => {
		set((state) => {
			state.simulationParts[part] = config;
		});
	},
});
