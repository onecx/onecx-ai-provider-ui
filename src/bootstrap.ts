import { bootstrapModule } from '@onecx/angular-webcomponents'
import { environment } from 'src/environments/environment'
import { OneCXAiProviderModule } from './app/onecx-ai-provider.remote.module'

bootstrapModule(OneCXAiProviderModule, 'microfrontend', environment.production)
