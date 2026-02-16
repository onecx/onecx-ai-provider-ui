import { bootstrapModule } from '@onecx/angular-webcomponents'
import { environment } from 'src/environments/environment'
import { OnecxAiUiProviderModule } from './app/onecx-ai-provider-ui-app.remote.module'

bootstrapModule(OnecxAiUiProviderModule, 'microfrontend', environment.production)
