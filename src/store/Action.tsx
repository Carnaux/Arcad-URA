/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionLabels } from "./ActionsLabels";

export type callBackFunction = (event?: Event | any) => void;

// Action as hook
export type Action = {
  target: string;
  targetNode?: string;
  trigger: ActionLabels | any;
  cb: callBackFunction;
  id?: string;
  delay?: number; // in ms
};
