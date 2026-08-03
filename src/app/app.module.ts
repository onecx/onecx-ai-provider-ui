import { CommonModule } from '@angular/common'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { isDevMode, NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreRouterConnectingModule } from '@ngrx/router-store'
import { StoreModule } from '@ngrx/store'
import { provideStoreDevtools, StoreDevtoolsModule } from '@ngrx/store-devtools'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'

import {
  createTranslateLoader,
  provideTranslationPathFromMeta,
  provideThemeConfig,
  provideTranslationConnectionService
} from '@onecx/angular-utils'
import { AngularAuthModule } from '@onecx/angular-auth'
import { AngularAcceleratorModule, providePortalDialogService } from '@onecx/angular-accelerator'
import { APP_CONFIG, AppStateService, ConfigurationService } from '@onecx/angular-integration-interface'
import { StandaloneShellModule } from '@onecx/angular-standalone-shell'

import { environment } from 'src/environments/environment'
import { APIConfiguration } from 'src/app/shared/generated'
import { apiConfigProvider } from 'src/app/shared/utils/apiConfigProvider.utils'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { metaReducers, reducers } from './app.reducers'

export const commonImports = [CommonModule]

@NgModule({
  imports: [
    ...commonImports,
    AngularAuthModule,
    AppComponent,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    LetDirective,
    StandaloneShellModule,
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
    AngularAcceleratorModule,
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
    ...provideTranslationConnectionService(),
    provideTranslationPathFromMeta(import.meta.url, 'assets/i18n/'),
    provideThemeConfig(),

    provideStoreDevtools({
      maxAge: 25, // Retains last 25 states
      logOnly: !isDevMode(), // Restrict extension to log-only mode
      autoPause: true, // Pauses recording actions and state changes when the extension window is not open
      trace: false, //  If set to true, will include stack trace for every dispatched action, so you can see it in trace tab jumping directly to that part of code
      traceLimit: 75, // maximum stack trace frames to be stored (in case trace option was provided as true)
      connectInZone: true // If set to true, the connection is established within the Angular zone
    })
  ]
})
export class AppModule {}
