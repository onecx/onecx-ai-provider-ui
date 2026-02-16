import { Injectable, SkipSelf } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import {
  filterForNavigatedTo,
  filterOutOnlyQueryParamsChanged,
  filterOutQueryParamsHaveNotChanged
} from '@onecx/ngrx-accelerator'
import {
  DialogState,
  ExportDataService,
  PortalDialogService,
  PortalMessageService
} from '@onecx/portal-integration-angular'
import equal from 'fast-deep-equal'
import { PrimeIcons } from 'primeng/api'
import { catchError, map, mergeMap, of, switchMap, tap } from 'rxjs'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import { ProviderSearchActions } from './provider-search.actions'
import { ProviderSearchComponent } from './provider-search.component'
import { ProviderSearchCriteriasSchema } from './provider-search.parameters'
import { ProviderSearchSelectors, selectProviderSearchViewModel } from './provider-search.selectors'
import { ProviderCreateUpdateComponent } from './dialogs/provider-create-update/provider-create-update.component'
import { CreateProviderRequest, Provider, ProviderService, UpdateProviderRequest } from 'src/app/shared/generated'

@Injectable()
export class ProviderSearchEffects {
  constructor(
    private readonly portalDialogService: PortalDialogService,
    private readonly actions$: Actions,
    @SkipSelf() private readonly route: ActivatedRoute,
    private readonly providerService: ProviderService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly messageService: PortalMessageService,
    private readonly exportDataService: ExportDataService
  ) { }

  syncParamsToUrl$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ProviderSearchActions.searchButtonClicked, ProviderSearchActions.resetButtonClicked),
        concatLatestFrom(() => [this.store.select(ProviderSearchSelectors.selectCriteria), this.route.queryParams]),
        tap(([, criteria, queryParams]) => {
          const results = ProviderSearchCriteriasSchema.safeParse(queryParams)
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
        ofType(ProviderSearchActions.detailsButtonClicked),
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

  refreshSearchAfterCreateUpdate$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProviderSearchActions.createProviderSucceeded, ProviderSearchActions.updateProviderSucceeded),
      concatLatestFrom(() => this.store.select(ProviderSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  editButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProviderSearchActions.editProviderButtonClicked),
      concatLatestFrom(() => this.store.select(ProviderSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id)
      }),
      mergeMap((itemToEdit) => {
        return this.portalDialogService.openDialog<Provider | undefined>(
          'PROVIDER_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: ProviderCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit
              }
            }
          },
          'PROVIDER_CREATE_UPDATE.UPDATE.FORM.SAVE',
          'PROVIDER_CREATE_UPDATE.UPDATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(ProviderSearchActions.updateProviderCancelled())
        }
        if (!dialogResult?.result?.id) {
          throw new Error('DialogResult was not set as expected!')
        }
        const itemToEditId = dialogResult.result.id
        const itemToEdit = {
          ...dialogResult.result
        } as UpdateProviderRequest
        return this.providerService.updateProvider(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'PROVIDER_CREATE_UPDATE.UPDATE.SUCCESS'
            })
            return ProviderSearchActions.updateProviderSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'PROVIDER_CREATE_UPDATE.UPDATE.ERROR'
        })
        return of(
          ProviderSearchActions.updateProviderFailed({
            error
          })
        )
      })
    )
  })

  createButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProviderSearchActions.createProviderButtonClicked),
      switchMap(() => {
        return this.portalDialogService.openDialog<Provider | undefined>(
          'PROVIDER_CREATE_UPDATE.CREATE.HEADER',
          {
            type: ProviderCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: {}
              }
            }
          },
          'PROVIDER_CREATE_UPDATE.CREATE.FORM.SAVE',
          'PROVIDER_CREATE_UPDATE.CREATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(ProviderSearchActions.createProviderCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        const toCreateItem = {
          ...dialogResult.result
        } as CreateProviderRequest
        return this.providerService.createProvider(toCreateItem).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'PROVIDER_CREATE_UPDATE.CREATE.SUCCESS'
            })
            return ProviderSearchActions.createProviderSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'PROVIDER_CREATE_UPDATE.CREATE.ERROR'
        })
        return of(
          ProviderSearchActions.createProviderFailed({
            error
          })
        )
      })
    )
  })

  editDetailsButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProviderSearchActions.editProviderDetailsButtonClicked),
      concatLatestFrom(() => this.store.select(ProviderSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id)
      }),
      switchMap((result) => {
        if (!result) {
          throw new Error('DialogResult was not set as expected!')
        }
        const itemToEditId = result.id ?? ""
        const itemToEdit = {
          ...result
        } as UpdateProviderRequest
        return this.providerService.updateProvider(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'PROVIDER_CREATE_UPDATE.UPDATE.SUCCESS'
            })
            return ProviderSearchActions.updateProviderSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'PROVIDER_CREATE_UPDATE.UPDATE.ERROR'
        })
        return of(
          ProviderSearchActions.updateProviderFailed({
            error
          })
        )
      })
    )
  })

  refreshSearchAfterDelete$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProviderSearchActions.deleteProviderSucceeded),
      concatLatestFrom(() => this.store.select(ProviderSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  deleteButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProviderSearchActions.deleteProviderButtonClicked),
      concatLatestFrom(() => this.store.select(ProviderSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id)
      }),
      mergeMap((itemToDelete) => {
        return this.portalDialogService
          .openDialog<unknown>(
            'PROVIDER_DELETE.HEADER',
            'PROVIDER_DELETE.MESSAGE',
            {
              key: 'PROVIDER_DELETE.CONFIRM',
              icon: PrimeIcons.CHECK
            },
            {
              key: 'PROVIDER_DELETE.CANCEL',
              icon: PrimeIcons.TIMES
            }
          )
          .pipe(
            map((state): [DialogState<unknown>, Provider | undefined] => {
              return [state, itemToDelete]
            })
          )
      }),
      switchMap(([dialogResult, itemToDelete]) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(ProviderSearchActions.deleteProviderCancelled())
        }
        if (!itemToDelete?.id) {
          throw new Error('Item to delete not found!')
        }

        return this.providerService.deleteProvider(itemToDelete.id).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'PROVIDER_DELETE.SUCCESS'
            })
            return ProviderSearchActions.deleteProviderSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'PROVIDER_DELETE.ERROR'
        })
        return of(
          ProviderSearchActions.deleteProviderFailed({
            error
          })
        )
      })
    )
  })

  searchByUrl$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, ProviderSearchComponent),
      filterOutQueryParamsHaveNotChanged(this.router, ProviderSearchCriteriasSchema, true),
      concatLatestFrom(() => this.store.select(ProviderSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  performSearch(searchCriteria: Record<string, any>) {
    return this.providerService.findProviderBySearchCriteria({
      ...Object.entries(searchCriteria).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value instanceof Date ? value.toISOString() : value
        }),
        {}
      )
    }).pipe(
      map(({ stream, totalElements }) =>
        ProviderSearchActions.providerSearchResultsReceived({
          results: stream,
          totalNumberOfResults: totalElements
        })
      ),
      catchError((error) =>
        of(
          ProviderSearchActions.providerSearchResultsLoadingFailed({
            error
          })
        )
      )
    )
  }

  rehydrateChartVisibility$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, ProviderSearchComponent),
      filterOutOnlyQueryParamsChanged(this.router),
      map(() =>
        ProviderSearchActions.chartVisibilityRehydrated({
          visible: localStorage.getItem('ProviderChartVisibility') === 'true'
        })
      )
    )
  })

  saveChartVisibility$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ProviderSearchActions.chartVisibilityToggled),
        concatLatestFrom(() => this.store.select(ProviderSearchSelectors.selectChartVisible)),
        tap(([, chartVisible]) => {
          localStorage.setItem('ProviderChartVisibility', String(chartVisible))
        })
      )
    },
    { dispatch: false }
  )

  exportData$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ProviderSearchActions.exportButtonClicked),
        concatLatestFrom(() => this.store.select(selectProviderSearchViewModel)),
        map(([, viewModel]) => {
          this.exportDataService.exportCsv(viewModel.displayedColumns, viewModel.results, 'Provider.csv')
        })
      )
    },
    { dispatch: false }
  )

  errorMessages: { action: Action; key: string }[] = [
    {
      action: ProviderSearchActions.providerSearchResultsLoadingFailed,
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
}
