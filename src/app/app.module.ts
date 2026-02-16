import { CommonModule } from '@angular/common'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { APP_INITIALIZER, isDevMode, NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreRouterConnectingModule } from '@ngrx/router-store'
import { StoreModule } from '@ngrx/store'
import { provideStoreDevtools, StoreDevtoolsModule } from '@ngrx/store-devtools'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { KeycloakAuthModule } from '@onecx/keycloak-auth'
import {
  APP_CONFIG,
  AppStateService,
  ConfigurationService,
  createTranslateLoader,
  PortalCoreModule,
  providePortalDialogService,
  translateServiceInitializer,
  UserService
} from '@onecx/portal-integration-angular'
import { environment } from 'src/environments/environment'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { metaReducers, reducers } from './app.reducers'

import { APIConfiguration } from './shared/generated'
import { apiConfigProvider } from './shared/utils/apiConfigProvider.utils'

export const commonImports = [CommonModule]

@NgModule({
  declarations: [AppComponent],
  imports: [
    ...commonImports,
    KeycloakAuthModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    LetDirective,
    StoreRouterConnectingModule.forRoot(),
    StoreModule.forRoot(reducers, { metaReducers }),

    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75
    }),
    EffectsModule.forRoot([]),
    PortalCoreModule.forRoot('onecx-ai-management-ui-app'),
    TranslateModule.forRoot({
      extend: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient, AppStateService]
      }
    })
  ],
  providers: [
    providePortalDialogService(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: APP_CONFIG, useValue: environment },
    {
      provide: APIConfiguration,
      useFactory: apiConfigProvider,
      deps: [ConfigurationService, AppStateService]
    },
    {
      provide: APP_INITIALIZER,
      useFactory: translateServiceInitializer,
      multi: true,
      deps: [UserService, TranslateService]
    },

    provideStoreDevtools({
      maxAge: 25, // Retains last 25 states
      logOnly: !isDevMode(), // Restrict extension to log-only mode
      autoPause: true, // Pauses recording actions and state changes when the extension window is not open
      trace: false, //  If set to true, will include stack trace for every dispatched action, so you can see it in trace tab jumping directly to that part of code
      traceLimit: 75, // maximum stack trace frames to be stored (in case trace option was provided as true)
      connectInZone: true // If set to true, the connection is established within the Angular zone
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
