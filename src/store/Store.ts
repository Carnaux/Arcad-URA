import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { ActionSlice, createActionSlice } from "./ActionSlice";
import { AppSlice, createAppSlice } from "./AppSlice";

// create the store to manage the behaviours of 3d objects
export const useStore = create<ActionSlice & AppSlice>()(
  subscribeWithSelector((...a) => ({
    ...createActionSlice(...a),
    ...createAppSlice(...a),
  }))
);
