import { Canvas } from "@react-three/fiber";
import { GizmoHelper, GizmoViewcube, OrbitControls } from "@react-three/drei";
import { UraRobot } from "./components/UraRobot";

export const Viewer = () => {
  return (
    <Canvas id="viewerCanvas" camera={{ position: [0, 15, 30] }}>
      {/* Scene Setup */}
      <color attach={"background"} args={["#f1f1f1"]} />
      <OrbitControls target={[0, 0, 0]} />
      <gridHelper args={[30, 30]} />
      {/* Lights */}
      <ambientLight />
      <pointLight position={[10, 10, 10]} />

      <UraRobot
        scale={0.05}
        position={[0, 0.9, 0]}
        rotation={[-0.05, Math.PI / 2, 0]}
      />

      <GizmoHelper alignment="bottom-left" margin={[80, 80]}>
        <GizmoViewcube />
      </GizmoHelper>
    </Canvas>
  );
};
