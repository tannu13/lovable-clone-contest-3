import {
  listProjectFiles,
  readProjectFile,
  writeProjectFile,
} from "./projectFiles.js";
import { Tool } from "openai/resources/responses/responses.mjs";

// put your tools here

export const listFileTool: Tool = {
  type: "function",
  name: "list_files",
  description:
    "This tool will read and give you a list of files and their content in the project which are to be changed",
  strict: true,
  parameters: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  },
};

export const readFileTool: Tool = {
  type: "function",
  name: "read_file",
  description:
    "Reads the content of a file from the local file system given its path.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description:
          "The absolute path to the file. Do not add the starting path separator, i.e. slash. This'll be run inside a project folder whose path will be prepended to the file path, so start with the file path that are given to you in the list of file paths.",
      },
    },
    required: ["path"],
    additionalProperties: false,
  },
  strict: true,
};

export const writeFileTool: Tool = {
  type: "function",
  name: "write_file",
  description:
    "Overwrites content to a specified file path. Provide full content for the file",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description:
          "The path where the file should be saved. Do not add the starting path separator, i.e. slash. This'll be run inside a project folder whose path will be prepended to the file path, so start with the file path that are given to you in the list of file paths.",
      },
      content: {
        type: "string",
        description: "The text content to write into the file.",
      },
    },
    required: ["path", "content"],
    additionalProperties: false,
  },
  strict: true,
};

export const tools: {
  name: string;
  def: Tool;
  execute: Function;
}[] = [
  {
    name: "list_files",
    def: listFileTool,
    execute: async () => {
      const list = await listProjectFiles();
      return list;
    },
  },
  {
    name: "read_file",
    def: writeFileTool,
    execute: async (args: { path: string }) => {
      const content = await readProjectFile(args.path);
      return {
        fileWritten: args.path,
        content,
      };
    },
  },
  {
    name: "write_file",
    def: readFileTool,
    execute: async (args: { path: string; content: string }) => {
      await writeProjectFile(args.path, args.content);
      return {
        file: args.path,
        write: true,
      };
    },
  },
];
