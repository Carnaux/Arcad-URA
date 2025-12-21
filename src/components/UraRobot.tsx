import { useGLTF } from "@react-three/drei";
import { ThreeElements } from "@react-three/fiber";
import { useEffect } from "react";
import { Color, DoubleSide, Mesh, MeshBasicMaterial, Object3D } from "three";
import { useStore } from "../store/Store";
import { ActionLabels } from "../store/ActionsLabels";

export type UraModelParts = {
  [key: string | number]: Object3D;
  rightWheel: Object3D;
  leftWheel: Object3D;
  backWheel: Object3D;
  rightMotor: Object3D;
  leftMotor: Object3D;
  ultrasonic: Object3D;
};

export type UraModelProps = ThreeElements["mesh"] & {};

export const UraRobot = (props: UraModelProps) => {
  const addAction = useStore((store) => store.addAction);
  const UraModelParts = useStore((store) => store.uraModelParts);
  const setUraModelParts = useStore((store) => store.setUraModelParts);
  const gltf = useGLTF("./uraRobot.glb");

  // Subscribe to payload history
  const history = useStore((store) => store.payloadHistory);

  // This is so we can access those parts more easily outside of this component for whatever reason.
  useEffect(() => {
    if (gltf && !UraModelParts) {
      const parts = {} as UraModelParts;

      gltf.scene.traverse((child) => {
        switch (child.name) {
          case "Cube004":
            parts.leftMotor = child;
            break;
          case "Cube001":
            parts.rightMotor = child;
            break;
          case "P01":
            parts.leftWheel = child;
            break;
          case "P02":
            parts.rightWheel = child;
            break;
          case "BackWheel":
            parts.backWheel = child;
            break;
          case "ultrasonic_cover":
            parts.ultrasonic = child;
            break;
        }
      });

      const partNames = Object.keys(parts);
      partNames.forEach((part) => {
        const select = new Object3D();
        select.name = `${part}_select`;
        select.visible = false;
        const mat = new MeshBasicMaterial({ color: new Color("green") });
        mat.side = DoubleSide;
        mat.transparent = true;
        mat.opacity = 0.2;
        parts[part].traverse((child) => {
          if (child instanceof Mesh) {
            const childSelectMesh = new Mesh(child.geometry, mat);
            select.add(childSelectMesh);
          }
        });
        select.scale.setScalar(1.1);
        parts[part].add(select);
      });

      setUraModelParts(parts);
    }
  }, [UraModelParts, gltf, setUraModelParts]);

  // Actions
  useEffect(() => {
    // Show selected
    addAction({
      target: "realtimeList",
      trigger: ActionLabels.TOGGLE_SELECT_FROM_REALTIME_LIST,
      cb: (e) => {
        if (!UraModelParts) {
          return;
        }

        const part = UraModelParts[e.selected];
        part.traverse((child) => {
          if (child.name === `${e.selected}_select`) {
            child.visible = !child.visible;
          }
        });
      },
    });

    // Hide selected
    addAction({
      target: "realtimeList",
      trigger: ActionLabels.DESELECT_FROM_REALTIME_LIST,
      cb: (e) => {
        if (!UraModelParts) {
          return;
        }

        const part = UraModelParts[e.selected];
        part.traverse((child) => {
          if (child.name === `${e.selected}_select`) {
            child.visible = false;
          }
        });
      },
    });
  }, [UraModelParts, addAction]);

  // Move this to an scripts/ProcessPayload function
  useEffect(() => {
    if (history && history.length > 0) {
      const lastMessageStr = history[history.length - 1];
      console.log(lastMessageStr);
      // const lastMessage = JSON.parse(lastMessageStr);

      // Object.keys(lastMessage).forEach((key) => {
      //   if (key === "motorDir") {
      //     console.log(lastMessage[key]);
      //   }
      // });
    }
  }, [history]);

  return <primitive {...props} object={gltf.scene} />;
};
