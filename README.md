# onecx-ai-provider-ui
OneCX AI Provider UI

## OpenAI model settings

Model edits retain the provider, communication mode, and unrelated configuration fields required by the replacement update API.
OpenAI settings support only `api` (`chat-completions` or `responses`) and string `reasoningEffort`. An absent API defaults to Chat Completions; effort is trimmed and omitted when blank. Serialized settings must fit within 255 characters.
Unsupported legacy JSON, including duplicate decoded keys, shows a warning and uses unset/default settings. Saving replaces it with supported JSON. Escaped keys are decoded before checking duplicates; non-OpenAI configuration is preserved without interpretation.
