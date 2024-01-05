import { PromptObject } from "prompts";
import { ApiDefinitions } from "./get-api-definitions";

export interface ContextHelpers {
  api: ApiDefinitions;
  prompts: {} | PromptObject<string>;
}
