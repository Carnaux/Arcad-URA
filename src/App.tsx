import "./styles/App.scss";
import { Viewer } from "./Viewer";
import { RightSideBar } from "./UIComponents/RightSideBar";
import { TopNavBar } from "./UIComponents/TopNavBar";
import { ModalContainer } from "./UIComponents/ModalContainer";
import { useStore } from "./store/Store";
import { CodeCanvas } from "./UIComponents/BlockCoding/CodeCanvas";

function App() {
  const mode = useStore((store) => store.mode);

  return (
    <div className="app">
      <div className="content">
        <TopNavBar />
        {mode === "realtime" && <Viewer />}
        {mode === "code" && <CodeCanvas />}
        <ModalContainer />
      </div>
      <div className="sidebar">
        <RightSideBar />
      </div>
    </div>
  );
}

export default App;
