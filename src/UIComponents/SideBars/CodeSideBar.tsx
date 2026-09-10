import type { ChangeEvent } from "react";
import { ActionLabels } from "../../store/ActionsLabels";
import { useStore } from "../../store/Store";
import {
	type CodeStep,
	ConvertCodeBlockToJSON,
	ConvertJSONToCodeBlocks,
} from "../../utils/ConvertCodeBlock";

export const CodeSideBar = () => {
	const shapes = useStore((s) => s.codeBlocks);
	const blockOrder = useStore((s) => s.blockOrder);
	const setCodeBlocks = useStore((s) => s.setCodeBlocks);
	const setBlockOrder = useStore((s) => s.setBlockOrder);
	const triggerAction = useStore((s) => s.triggerAction);
	const mqttInstance = useStore((s) => s.mqttInstance);

	const HandleRunCode = () => {
		const json = ConvertCodeBlockToJSON(blockOrder, shapes);

		if (mqttInstance) {
			mqttInstance.publish("arcad/publish", JSON.stringify(json));
		}
	};

	const HandleImport = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];

		if (!file) {
			return;
		}

		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const jsonString = e.target?.result as string;
				const parsedData = JSON.parse(jsonString) as {
					mode: string;
					steps: CodeStep[];
				};

				if (parsedData.mode !== "code") {
					throw new Error("Invalid JSON mode. Expected 'code'.");
				}

				const { shapes, blockOrder } = ConvertJSONToCodeBlocks(parsedData);

				setCodeBlocks(shapes);
				setBlockOrder(blockOrder);
			} catch (error) {
				console.error("Failed to parse the code block JSON file", error);
			}
		};

		reader.onerror = () => {
			console.error("Failed to read the file");
		};

		reader.readAsText(file);

		// Clear the input so the user can import the same file again if they want
		event.target.value = "";
	};

	const HandleExport = () => {
		const code = ConvertCodeBlockToJSON(blockOrder, shapes);
		const jsonString = JSON.stringify(code, null, 2);
		const blob = new Blob([jsonString], { type: "application/json" });
		const url = URL.createObjectURL(blob);

		// Create a temporary anchor element to trigger the download
		const link = document.createElement("a");
		link.href = url;
		link.download = "oribotCode.json";

		// Append, click, and clean up the DOM
		document.body.appendChild(link);
		link.click();

		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	return (
		<div className="w-full h-screen bg-[#d9d9d9] flex flex-col pt-6 pb-4 px-4 font-sans text-black shadow-[-2px_0_5px_rgba(0,0,0,0.1)] z-10">
			<p className="text-center font-bold text-[18px] mb-6 tracking-tight">
				Program Flow
			</p>

			{/* Block List Section */}
			<div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
				{blockOrder.map((id) => {
					const s = shapes.find((shape) => {
						return shape.id === id;
					});

					if (!s || s.id === 0) {
						return null;
					}

					return (
						<div
							key={s.id}
							className="w-full flex items-center justify-between rounded-md p-3 shadow-sm border-2 border-dashed bg-[#d9d9d9]"
							style={{ borderColor: s.color }}
						>
							<div className="flex flex-col items-center justify-center w-full gap-1">
								<span className="font-bold text-[13px] tracking-wide text-black">
									{s.type.toUpperCase()}
								</span>

								<div className="flex items-center justify-center gap-1 bg-white rounded-full px-3 py-0.5 shadow-inner">
									<input
										type="number"
										className="w-12 text-center text-[12px] font-bold outline-none bg-transparent"
										value={s.value}
										onChange={(e) => {
											triggerAction(
												ActionLabels.UPDATE_CODE_BLOCK_VALUES,
												"canvasCode",
												{ id: s.id, val: parseInt(e.target.value, 10) || 0 },
											);
										}}
									/>
									<span className="text-[12px] font-bold text-gray-500">
										ms
									</span>
								</div>
							</div>

							<button
								type="button"
								className="absolute right-6 flex items-center justify-center w-6 h-6 hover:opacity-70 transition-opacity"
								onClick={() => {
									triggerAction(
										ActionLabels.DELETE_CODE_BLOCK,
										"canvasCode",
										s.id,
									);
								}}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="#ef4444"
									strokeWidth="2.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<title>TrashIcon</title>
									<path d="M3 6h18"></path>
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
								</svg>
							</button>
						</div>
					);
				})}
			</div>

			{/* Bottom Action Controls */}
			<div className="mt-4 flex flex-col gap-3 pt-4 border-t border-gray-400">
				<div className="flex justify-between gap-3">
					<label className="flex-1 border-2 border-black rounded-xl py-1.5 text-[11px] font-bold text-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors cursor-pointer text-center flex items-center justify-center">
						Import Code
						<input
							type="file"
							accept=".json"
							className="hidden"
							style={{ display: "none" }}
							onChange={(e) => {
								HandleImport(e);
							}}
						/>
					</label>
					<button
						type="button"
						className="flex-1 border-2 border-black rounded-xl py-1.5 text-[11px] font-bold text-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
						onClick={() => {
							HandleExport();
						}}
					>
						Export Code
					</button>
				</div>
				<button
					type="button"
					onClick={() => {
						HandleRunCode();
					}}
					className="w-full border-2 border-black rounded-xl py-2 text-[16px] font-bold text-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-0 hover:translate-y-[2px]"
				>
					Run Code
				</button>
			</div>
		</div>
	);
};
