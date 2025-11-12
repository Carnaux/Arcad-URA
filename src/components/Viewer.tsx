import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

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
    </Canvas>
  );
};
