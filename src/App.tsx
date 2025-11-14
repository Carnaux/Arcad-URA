import "./styles/App.scss";
import { Viewer } from "./Viewer";
import { RightSideBar } from "./UIComponents/RightSideBar";
import { TopNavBar } from "./UIComponents/TopNavBar";
import { ModalContainer } from "./UIComponents/ModalContainer";

function App() {
  return (
    <div className="app">
      <div className="content">
        <TopNavBar />
        <Viewer />
        <ModalContainer />
      </div>
      <div className="sidebar">
        <RightSideBar />
      </div>
    </div>
  );
}

export default App;
