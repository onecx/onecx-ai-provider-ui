import { ModuleFederationConfig } from '@nx/module-federation'
import { getOneCXSharedRecommendations } from '@onecx/accelerator'

const config: ModuleFederationConfig = {
  name: 'onecx-ai-provider-ui',
  exposes: {
    './OneCXAiProviderModule': './src/bootstrap.ts',
    './OneCXAiConnectorComponent': './src/app/remotes/ai-connector/onecx-ai-connector.component.main.ts',
    './OneCXAiAgentProviderConnectorComponent':
      './src/app/remotes/ai-agent-provider-connector/onecx-ai-agent-provider-connector.component.main.ts'
  },
  shared: (libraryName, sharedConfig) => {
    const config = getOneCXSharedRecommendations(libraryName, sharedConfig)
    return config
  }
}

export default config