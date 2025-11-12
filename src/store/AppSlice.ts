/* eslint-disable @typescript-eslint/no-explicit-any */
import mqtt from "mqtt";
import { StateCreator } from "zustand";

export const createAppSlice: StateCreator<
  AppSlice,
  [["zustand/subscribeWithSelector", never]],
  []
> = (set) => ({
  mqttInstance: null,
  setMqttInstance: (instance: any) => {
    set({ mqttInstance: instance });
  },
});

export interface AppSlice {
  mqttInstance: mqtt.MqttClient | null;
  setMqttInstance: (instance: any) => void;
}
