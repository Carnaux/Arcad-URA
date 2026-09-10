import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { useEffect } from "react";
import { Color, DoubleSide, Mesh, MeshBasicMaterial, Object3D } from "three";
import { ActionLabels } from "../store/ActionsLabels";
import { useStore } from "../store/Store";

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

	// Subscribe to sensor history and configurations
	const sensorHistory = useStore((store) => store.sensorHistory);
	const sensorConfigs = useStore((store) => store.sensorConfigs);

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

				// Define material inside the loop so each select layer has its own material
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

	// Color changing effect based on Sensor data Lerp
	useEffect(() => {
		if (!UraModelParts) {
			return;
		}

		Object.keys(sensorHistory).forEach((sensorId) => {
			const config = sensorConfigs[sensorId];

			if (config) {
				const historyArray = sensorHistory[sensorId];

				if (historyArray && historyArray.length > 0) {
					const latestData = historyArray[historyArray.length - 1];
					const value = Number(latestData.value);
					const part = UraModelParts[config.partName];

					if (part && !Number.isNaN(value)) {
						// Calculate Lerp percentage
						let alpha =
							(value - config.minValue) / (config.maxValue - config.minValue);

						// Clamp the alpha between 0 and 1
						if (alpha < 0) {
							alpha = 0;
						}
						if (alpha > 1) {
							alpha = 1;
						}

						const colorMin = new Color(config.minColor);
						const colorMax = new Color(config.maxColor);
						const lerpedColor = new Color().lerpColors(
							colorMin,
							colorMax,
							alpha,
						);

						// Apply color to the main mesh (ignoring the _select overlays)
						part.traverse((child) => {
							if (child instanceof Mesh) {
								if (child.name?.includes("_select")) {
									return;
								}

								// Ensure the material is unique to this mesh, otherwise changing it colors the whole gltf
								if (!child.userData.hasUniqueMaterial) {
									if (Array.isArray(child.material)) {
										child.material = child.material.map((m) => m.clone());
									} else {
										child.material = child.material.clone();
									}
									child.userData.hasUniqueMaterial = true;
								}

								// Apply color changes depending on if material is an array or single instance
								if (Array.isArray(child.material)) {
									child.material.forEach((mat) => {
										if (mat.color) {
											mat.color.copy(lerpedColor);
										}
									});
								} else {
									if (child.material.color) {
										child.material.color.copy(lerpedColor);
									}
								}
							}
						});
					}
				}
			}
		});
	}, [sensorHistory, sensorConfigs, UraModelParts]);

	return <primitive {...props} object={gltf.scene} />;
};
