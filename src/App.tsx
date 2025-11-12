import "./styles/App.scss";
import { Viewer } from "./components/Viewer";
import { RightSideBar } from "./components/RightSideBar";
import { TopNavBar } from "./components/TopNavBar";
import { ModalContainer } from "./components/ModalContainer";

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
