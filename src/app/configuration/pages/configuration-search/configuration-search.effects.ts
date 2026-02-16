import { Injectable } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { filterForNavigatedTo, filterOutQueryParamsHaveNotChanged } from '@onecx/ngrx-accelerator'
import { ExportDataService, PortalMessageService, PortalDialogService, DialogState } from '@onecx/portal-integration-angular'
import equal from 'fast-deep-equal'
import { catchError, map, mergeMap, of, switchMap, tap } from 'rxjs'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import { ConfigurationSearchActions } from './configuration-search.actions'
import { ConfigurationSearchComponent } from './configuration-search.component'
import { configurationSearchCriteriasSchema } from './configuration-search.parameters'
import { configurationSearchSelectors, selectConfigurationSearchViewModel } from './configuration-search.selectors'
import { ConfigurationCreateUpdateComponent } from './dialogs/configuration-create-update/configuration-create-update.component'
import { PrimeIcons } from 'primeng/api'
import { Configuration, ConfigurationService, CreateConfigurationRequest, UpdateConfigurationRequest } from 'src/app/shared/generated'

@Injectable()
export class ConfigurationSearchEffects {
  constructor(
    private readonly portalDialogService: PortalDialogService,
    private readonly actions$: Actions,
    private readonly route: ActivatedRoute,
    private readonly configurationService: ConfigurationService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly messageService: PortalMessageService,
    private readonly exportDataService: ExportDataService
  ) { }

  syncParamsToUrl$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ConfigurationSearchActions.searchButtonClicked, ConfigurationSearchActions.resetButtonClicked),
        concatLatestFrom(() => [this.store.select(configurationSearchSelectors.selectCriteria), this.route.queryParams]),
        tap(([, criteria, queryParams]) => {
          const results = configurationSearchCriteriasSchema.safeParse(queryParams)
          if (!results.success || !equal(criteria, results.data)) {
            const params = {
              ...criteria
              //TODO: Move to docs to explain how to only put the date part in the URL in case you have date and not datetime
              //exampleDate: criteria.exampleDate?.toISOString()?.slice(0, 10)
            }
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: params,
              replaceUrl: true,
              onSameUrlNavigation: 'ignore'
            })
          }
        })
      )
    },
    { dispatch: false }
  )

  detailsButtonClicked$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ConfigurationSearchActions.detailsButtonClicked),
        concatLatestFrom(() => this.store.select(selectUrl)),
        tap(([action, currentUrl]) => {
          const urlTree = this.router.parseUrl(currentUrl)
          urlTree.queryParams = {}
          urlTree.fragment = null
          this.router.navigate([urlTree.toString(), 'details', action.id])
        })
      )
    },
    { dispatch: false }
  )

  searchByUrl$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, ConfigurationSearchComponent),
      filterOutQueryParamsHaveNotChanged(this.router, configurationSearchCriteriasSchema, false),
      concatLatestFrom(() => this.store.select(configurationSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  refreshSearchAfterCreateUpdate$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ConfigurationSearchActions.createConfigurationSucceeded, ConfigurationSearchActions.updateConfigurationSucceeded),
      concatLatestFrom(() => this.store.select(configurationSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  editButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ConfigurationSearchActions.editConfigurationButtonClicked),
      concatLatestFrom(() => this.store.select(configurationSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id)
      }),
      mergeMap((itemToEdit) => {
        return this.portalDialogService.openDialog<Configuration | undefined>(
          'CONFIGURATION_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: ConfigurationCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit
              }
            }
          },
          'CONFIGURATION_CREATE_UPDATE.UPDATE.FORM.SAVE',
          'CONFIGURATION_CREATE_UPDATE.UPDATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(ConfigurationSearchActions.updateConfigurationCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        const itemToEditId = dialogResult.result.id
        if (!itemToEditId) {
          throw new Error('Item ID is required for update!')
        }
        const itemToEdit = {
          ...dialogResult.result
        } as UpdateConfigurationRequest
        return this.configurationService.updateConfiguration(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'CONFIGURATION_CREATE_UPDATE.UPDATE.SUCCESS'
            })
            return ConfigurationSearchActions.updateConfigurationSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'CONFIGURATION_CREATE_UPDATE.UPDATE.ERROR'
        })
        return of(
          ConfigurationSearchActions.updateConfigurationFailed({
            error
          })
        )
      })
    )
  })

  createButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ConfigurationSearchActions.createConfigurationButtonClicked),
      switchMap(() => {
        return this.portalDialogService.openDialog<Configuration | undefined>(
          'CONFIGURATION_CREATE_UPDATE.CREATE.HEADER',
          {
            type: ConfigurationCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: {}
              }
            }
          },
          'CONFIGURATION_CREATE_UPDATE.CREATE.FORM.SAVE',
          'CONFIGURATION_CREATE_UPDATE.CREATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(ConfigurationSearchActions.createConfigurationCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        const toCreateItem = {
          ...dialogResult.result
        } as CreateConfigurationRequest
        return this.configurationService.createConfiguration(toCreateItem).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'CONFIGURATION_CREATE_UPDATE.CREATE.SUCCESS'
            })
            return ConfigurationSearchActions.createConfigurationSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'CONFIGURATION_CREATE_UPDATE.CREATE.ERROR'
        })
        return of(
          ConfigurationSearchActions.createConfigurationFailed({
            error
          })
        )
      })
    )
  })

  refreshSearchAfterDelete$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ConfigurationSearchActions.deleteConfigurationSucceeded),
      concatLatestFrom(() => this.store.select(configurationSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  deleteButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ConfigurationSearchActions.deleteConfigurationButtonClicked),
      concatLatestFrom(() => this.store.select(configurationSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id)
      }),
      mergeMap((itemToDelete) => {
        return this.portalDialogService
          .openDialog<unknown>(
            'CONFIGURATION_DELETE.HEADER',
            'CONFIGURATION_DELETE.MESSAGE',
            {
              key: 'CONFIGURATION_DELETE.CONFIRM',
              icon: PrimeIcons.CHECK
            },
            {
              key: 'CONFIGURATION_DELETE.CANCEL',
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
          return of(ConfigurationSearchActions.deleteConfigurationCancelled())
        }
        if (!itemToDelete?.id) {
          this.messageService.error({
            summaryKey: 'CONFIGURATION_DELETE.ERROR'
          })
          return of(ConfigurationSearchActions.deleteConfigurationFailed({
            error: 'Item to delete or its ID not found!'
          }))
        }

        return this.configurationService.deleteConfiguration(itemToDelete.id).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'CONFIGURATION_DELETE.SUCCESS'
            })
            return ConfigurationSearchActions.deleteConfigurationSucceeded()
          }),
          catchError((error) => {            
            this.messageService.error({
              summaryKey: 'CONFIGURATION_DELETE.ERROR'
            })
            return of(
              ConfigurationSearchActions.deleteConfigurationFailed({
                error
              })
            )
          })
        )
      })
    )
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  performSearch(searchCriteria: Record<string, any>) {
    return this.configurationService
      .findConfigurationBySearchCriteria({
        ...Object.entries(searchCriteria).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: value instanceof Date ? value.toISOString() : value
          }),
          {}
        )
      })
      .pipe(
        map(({ stream, size, number, totalElements, totalPages }) =>
          ConfigurationSearchActions.configurationSearchResultsReceived({
            stream,
            size,
            number,
            totalElements,
            totalPages
          })
        ),
        catchError((error) =>
          of(
            ConfigurationSearchActions.configurationSearchResultsLoadingFailed({
              error
            })
          )
        )
      )
  }

  exportData$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ConfigurationSearchActions.exportButtonClicked),
        concatLatestFrom(() => this.store.select(selectConfigurationSearchViewModel)),
        map(([, viewModel]) => {
          this.exportDataService.exportCsv(
            viewModel.resultComponentState?.displayedColumns ?? [],
            viewModel.results,
            'Configuration.csv'
          )
        })
      )
    },
    { dispatch: false }
  )

  errorMessages: { action: Action; key: string }[] = [
    {
      action: ConfigurationSearchActions.configurationSearchResultsLoadingFailed,
      key: 'CONFIGURATION_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
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
}
