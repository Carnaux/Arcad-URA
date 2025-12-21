import { CodeBlockShape } from "../UIComponents/BlockCoding/CodeCanvas";

type CodeStep = {
    m: string,
    t: number
}

export const ConvertCodeBlockToJSON = (blockOrder: number[], shapes: CodeBlockShape[]) => {
   const orderedCodeBlocks =  blockOrder.map((id) => shapes.find((s) => s.id === id))

   const finalJson: {mode: string, steps: CodeStep[]} = {
    mode: "code",
    steps: [],
   }

   orderedCodeBlocks.map((block) => {
    if(!block || block.type == "Start") return;

    finalJson.steps.push(
        {
            m: block.type[0].toUpperCase(),
            t: block.value
        }
    )
   });

   return finalJson;
}