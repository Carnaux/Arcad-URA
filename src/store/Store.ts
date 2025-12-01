import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { ActionSlice, createActionSlice } from "./ActionSlice";
import { AppSlice, createAppSlice } from "./AppSlice";
import { immer } from "zustand/middleware/immer";

export type Middlewares = [
  ["zustand/subscribeWithSelector", never],
  ["zustand/immer", never]
];

// create the store to manage the behaviours of 3d objects
export const useStore = create<ActionSlice & AppSlice>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...createAppSlice(set),
      ...createActionSlice(set, get),
    }))
  )
);
