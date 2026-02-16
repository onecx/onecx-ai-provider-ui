import { bootstrapModule } from '@onecx/angular-webcomponents'
import { environment } from 'src/environments/environment'
import { OnecxAiUiManagementModule } from './app/onecx-ai-management-ui-app.remote.module'

bootstrapModule(OnecxAiUiManagementModule, 'microfrontend', environment.production)
