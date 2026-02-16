import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { filterForNavigatedTo } from '@onecx/ngrx-accelerator'
import { DialogState, PortalDialogService, PortalMessageService } from '@onecx/portal-integration-angular'
import { PrimeIcons } from 'primeng/api'
import { catchError, filter, map, mergeMap, of, switchMap, tap } from 'rxjs'
import { Configuration, ConfigurationService, McpServerService, ProviderService, UpdateConfigurationRequest } from 'src/app/shared/generated'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'
import { selectRouteParam, selectUrl } from 'src/app/shared/selectors/router.selectors'
import { ConfigurationDetailsActions } from './configuration-details.actions'
import { ConfigurationDetailsComponent } from './configuration-details.component'
import { configurationDetailsSelectors } from './configuration-details.selectors'

@Injectable()
export class ConfigurationDetailsEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly configurationService: ConfigurationService,
    private readonly providerService: ProviderService,
    private readonly mcpServerService: McpServerService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly messageService: PortalMessageService,
    private readonly portalDialogService: PortalDialogService
  ) { }

  navigatedToDetailsPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, ConfigurationDetailsComponent),
      concatLatestFrom(() => this.store.select(selectRouteParam('id'))),
      map(([, id]) => {
        return ConfigurationDetailsActions.navigatedToDetailsPage({
          id
        })
      })
    )
  })

  loadConfigurationById$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ConfigurationDetailsActions.navigatedToDetailsPage),
      switchMap(({ id }) =>
        this.configurationService.getConfiguration(id ?? '').pipe(
          map((result) =>
            ConfigurationDetailsActions.configurationDetailsReceived({
              details: result
            })
          ),
          catchError((error) =>
            of(
              ConfigurationDetailsActions.configurationDetailsLoadingFailed({
                error
              })
            )
          )
        )
      )
    )
  })

  loadMCPServers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ConfigurationDetailsActions.navigatedToDetailsPage),
      switchMap(() => {
        return this.mcpServerService.findMCPServerByCriteria({}).pipe(
          map(({ stream }) =>
            ConfigurationDetailsActions.configurationMCPServersReceived({
              MCPServers: stream
            })
          ),
          catchError((error) =>
            of(
              ConfigurationDetailsActions.configurationMCPServersLoadingFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  loadProviders$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ConfigurationDetailsActions.navigatedToDetailsPage),
      switchMap(() => {
        return this.providerService.findProviderBySearchCriteria({}).pipe(
          map(({ stream }) =>
            ConfigurationDetailsActions.configurationProvidersReceived({
              providers: stream
            })
          ),
          catchError((error) =>
            of(
              ConfigurationDetailsActions.configurationProvidersLoadingFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  cancelButtonNotDirty$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ConfigurationDetailsActions.cancelButtonClicked),
      filter((action) => !action.dirty),
      map(() => {
        return ConfigurationDetailsActions.cancelEditNotDirty()
      })
    )
  })

  cancelButtonClickedDirty$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ConfigurationDetailsActions.cancelButtonClicked),
      filter((action) => action.dirty),
      switchMap(() => {
        return this.portalDialogService.openDialog<Configuration | undefined>(
          'CONFIGURATION_DETAILS.CANCEL.HEADER',
          'CONFIGURATION_DETAILS.CANCEL.MESSAGE',
          'CONFIGURATION_DETAILS.CANCEL.CONFIRM'
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(ConfigurationDetailsActions.cancelEditBackClicked())
        }
        return of(ConfigurationDetailsActions.cancelEditConfirmClicked())
      })
    )
  })

  saveButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ConfigurationDetailsActions.saveButtonClicked),
      concatLatestFrom(() => this.store.select(configurationDetailsSelectors.selectDetails)),
      switchMap(([action, details]) => {
        const itemToEditId = details?.id
        const updatedItem = {
          ...details,
          ...action.details
        }

        if (!itemToEditId) {
          return of(ConfigurationDetailsActions.updateConfigurationCancelled())
        }
        const itemToEdit = {
          ...updatedItem
        } as UpdateConfigurationRequest
        return this.configurationService.updateConfiguration(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'CONFIGURATION_DETAILS.UPDATE.SUCCESS'
            })
            return ConfigurationDetailsActions.updateConfigurationSucceeded()
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'CONFIGURATION_DETAILS.UPDATE.ERROR'
            })
            return of(
              ConfigurationDetailsActions.updateConfigurationFailed({
                error
              })
            )
          })
        )
      })
    )
  })
  deleteButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ConfigurationDetailsActions.deleteButtonClicked),
      concatLatestFrom(() => this.store.select(configurationDetailsSelectors.selectDetails)),
      mergeMap(([, itemToDelete]) => {
        return this.portalDialogService
          .openDialog<unknown>(
            'CONFIGURATION_DETAILS.DELETE.HEADER',
            'CONFIGURATION_DETAILS.DELETE.MESSAGE',
            {
              key: 'CONFIGURATION_DETAILS.DELETE.CONFIRM',
              icon: PrimeIcons.CHECK
            },
            {
              key: 'CONFIGURATION_DETAILS.DELETE.CANCEL',
              icon: PrimeIcons.TIMES
            }
          )
          .pipe(
            map((state): [DialogState<unknown>, Configuration | undefined] => {
              return [state, itemToDelete]
            })
          )
      }),
      switchMap(([dialogResult, itemToDelete]) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(ConfigurationDetailsActions.deleteConfigurationCancelled())
        }

        if (!itemToDelete?.id) {
          throw new Error('Item to delete or its ID not found!')
        }

        return this.configurationService.deleteConfiguration(itemToDelete.id).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'CONFIGURATION_DETAILS.DELETE.SUCCESS'
            })
            return ConfigurationDetailsActions.deleteConfigurationSucceeded()
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'CONFIGURATION_DETAILS.DELETE.ERROR'
            })
            return of(
              ConfigurationDetailsActions.deleteConfigurationFailed({
                error
              })
            )
          })
        )
      })
    )
  })

  deleteConfigurationSucceeded$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ConfigurationDetailsActions.deleteConfigurationSucceeded),
        concatLatestFrom(() => this.store.select(selectUrl)),
        tap(([, currentUrl]) => {
          const urlTree = this.router.parseUrl(currentUrl)
          urlTree.queryParams = {}
          urlTree.fragment = null

          const targetUrl = urlTree.toString().split('/').slice(0, -2).join('/')
          this.router.navigate([targetUrl])
        })
      )
    },
    { dispatch: false }
  )

  errorMessages: { action: Action; key: string }[] = [
    {
      action: ConfigurationDetailsActions.configurationDetailsLoadingFailed,
      key: 'CONFIGURATION_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
    },
    {
      action: ConfigurationDetailsActions.configurationMCPServersLoadingFailed,
      key: 'MCPSERVER_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
    },
    {
      action: ConfigurationDetailsActions.configurationProvidersLoadingFailed,
      key: 'PROVIDER_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
    }
  ]

  displayError$ = createEffect(
    () => {
      return this.actions$.pipe(
        tap((action) => {
          const e = this.errorMessages.find((e) => e.action.type === action.type)
          if (e) {
            this.messageService.error({ summaryKey: e.key })
          }
        })
      )
    },
    { dispatch: false }
  )

  navigateBack$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ConfigurationDetailsActions.navigateBackButtonClicked),
      concatLatestFrom(() => [this.store.select(selectBackNavigationPossible)]),
      switchMap(([, backNavigationPossible]) => {
        if (!backNavigationPossible) {
          return of(ConfigurationDetailsActions.backNavigationFailed())
        }
        window.history.back()
        return of(ConfigurationDetailsActions.backNavigationStarted())
      })
    )
  })
}
