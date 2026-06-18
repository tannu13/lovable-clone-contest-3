import OpenAI from "openai";
import { listFileTool, readFileTool, tools, writeFileTool } from "./tools.js";
import { Message } from "./types.js";
import { ResponseOutputText } from "openai/resources/responses/responses.mjs";

export class Harness {
  private maxIterations = 8;
  private openai: OpenAI;
  private llmChat: any = [];

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async executeTask(messages: Message[]): Promise<string> {
    let finalResponse = "";
    let iteration = 0;
    let processing = true;
    this.llmChat.push(
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    );
    console.log("this.llmChat", this.llmChat);

    while (processing && iteration < this.maxIterations) {
      iteration++;

      let response = await this.openai.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-5.1",
        tools: tools.map((t) => t.def),
        input: this.llmChat,
      });

      this.llmChat.push(...response.output);

      for (const item of response.output) {
        if (item.type === "function_call") {
          const tool = tools.find((t) => t.name === item.name);
          if (!tool) continue;

          console.log(tool.name, item.arguments);

          const response = await tool.execute(JSON.parse(item.arguments));
          console.log(tool.name, response);

          this.llmChat.push({
            type: "function_call_output",
            call_id: item.call_id,
            output: JSON.stringify(response),
          });
        } else {
          finalResponse = response.output_text;
          processing = false;
        }
      }
    }

    return finalResponse;
  }
}
