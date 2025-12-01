/* eslint-disable @typescript-eslint/no-explicit-any */
import mqtt from "mqtt";
import { UraModelParts } from "../components/UraRobot";

export const createAppSlice = (set) => ({
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
  pushToPayloadHistory: (payload: string) => {
    set((state) => {
      state.payloadHistory.push(payload);
    });
  },
});

export interface AppSlice {
  mode: string;
  setMode: (mode: string) => void;
  mqttInstance: mqtt.MqttClient | null;
  setMqttInstance: (instance: any) => void;
  uraModelParts: UraModelParts | null;
  setUraModelParts: (modelParts: UraModelParts) => void;
  payloadHistory: string[];
  pushToPayloadHistory: (payload: string) => void;
}
