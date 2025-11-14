/* eslint-disable @typescript-eslint/no-explicit-any */
import mqtt from "mqtt";
import { StateCreator } from "zustand";
import { UraModelParts } from "../components/UraRobot";

export const createAppSlice: StateCreator<
  AppSlice,
  [["zustand/subscribeWithSelector", never]],
  []
> = (set) => ({
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
});

export interface AppSlice {
  mode: string;
  setMode: (mode: string) => void;
  mqttInstance: mqtt.MqttClient | null;
  setMqttInstance: (instance: any) => void;
  uraModelParts: UraModelParts | null;
  setUraModelParts: (modelParts: UraModelParts) => void;
}
