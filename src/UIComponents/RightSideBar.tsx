import { useStore } from "../store/Store";
import { RealtimeSideBar } from "./RealtimeSideBar";

export const RightSideBar = () => {
  const mode = useStore((store) => store.mode);

  return <>{mode === "realtime" && <RealtimeSideBar />}</>;
};
