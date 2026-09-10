import "./styles/App.scss";
import { useStore } from "./store/Store";
import { CodeCanvas } from "./UIComponents/BlockCoding/CodeCanvas";
import { ModalContainer } from "./UIComponents/ModalContainer";
import { RightSideBar } from "./UIComponents/RightSideBar";
import Simulation from "./UIComponents/Simulation/Simulation";
import { TopNavBar } from "./UIComponents/TopNavBar";
import { Viewer } from "./Viewer";

function App() {
	const mode = useStore((store) => store.mode);

	return (
		<div className="app">
			<div className="content">
				<TopNavBar />
				{mode === "realtime" && <Viewer />}
				{mode === "code" && <CodeCanvas />}
				{mode === "simulation" && <Simulation />}
				<ModalContainer />
			</div>
			<div className="sidebar">
				<RightSideBar />
			</div>
		</div>
	);
}

export default App;
