import { useStore } from "../store/Store";
import { CodeSideBar } from "./SideBars/CodeSideBar";
import { RealtimeSideBar } from "./SideBars/RealtimeSideBar";

export const RightSideBar = () => {
  const mode = useStore((store) => store.mode);

  return (
    <>
      {mode === "realtime" && <RealtimeSideBar />}
      {mode === "code" && <CodeSideBar />}
    </>
  );
};
