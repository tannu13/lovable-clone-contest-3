import "dotenv/config";
import cors from "cors";
import express, { Request, Response } from "express";
import { listProjectFiles } from "./projectFiles.js";
import type { Message, ProjectSnapshot } from "./types.js";
import { Harness } from "./openai.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const previewUrl = process.env.PROJECT_PREVIEW_URL ?? "http://localhost:5174";
const messageHistory: Message[] = [];

// update this prompt to be more efficient
const systemPrompt =
  "You are helping update the React project in the project folder.";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/project", async (_request, response) => {
  // you'll use this endpoint to show preview of your running react project , messages  , files , only one project for now is supported.
  // make sure the above state is synced with fe, even some changes are applied
  // return ProjectSnapshot type here

  const files = await listProjectFiles();
  const ps: ProjectSnapshot = {
    summary: "",
    messageHistory,
    files,
    updatedAt:
      messageHistory.length > 0
        ? messageHistory[messageHistory.length - 1].createdAt
        : "",
    previewUrl,
  };

  response.status(200).json(ps);
});

app.post("/api/messages", async (request: Request, response: Response) => {
  // read user message here and make changes to files present in projects folder in root dir
  // writeProjectFile(path, content). After writes, return a fresh project snapshot.
  const message = request.body.message as string;
  messageHistory.push({
    role: "user",
    content: message,
    createdAt: new Date().toISOString(),
  });

  const harness = new Harness();
  const finalResText = await harness.executeTask(messageHistory);

  messageHistory.push({
    role: "assistant",
    content: finalResText,
    createdAt: new Date().toISOString(),
  });

  const files = await listProjectFiles();
  const ps: ProjectSnapshot = {
    summary: "",
    messageHistory,
    files,
    updatedAt:
      messageHistory.length > 0
        ? messageHistory[messageHistory.length - 1].createdAt
        : "",
    previewUrl,
  };

  response.status(200).json(ps);
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
