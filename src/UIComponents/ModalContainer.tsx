import { useEffect, useState } from "react";
import { ActionLabels } from "../store/ActionsLabels";
import { useStore } from "../store/Store";
import { MqttConnectionModal } from "./modals/MqttConnectionModal";

export const ModalContainer = () => {
	const [showMqttConnectionModal, setShowMqttConnectionModal] = useState(false);
	const addAction = useStore((store) => store.addAction);

	useEffect(() => {
		addAction({
			target: "mqttConnectionModal",
			trigger: ActionLabels.TOGGLE_MQTT_CONNECTION_MODAL,
			cb: () => {
				setShowMqttConnectionModal(!showMqttConnectionModal);
			},
		});
	}, [addAction, showMqttConnectionModal]);

	return (
		<div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none">
			{showMqttConnectionModal ? <MqttConnectionModal /> : null}
		</div>
	);
};
