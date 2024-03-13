import { ApiDefinitions } from "./get-api-definitions"

export interface ContextHelpers {
  api: ApiDefinitions
  is_interactive: boolean
}
