import { Injectable } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { filterForNavigatedTo, filterOutOnlyQueryParamsChanged, filterOutQueryParamsHaveNotChanged } from '@onecx/ngrx-accelerator'
import { DialogState, ExportDataService, PortalDialogService } from '@onecx/angular-accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { PrimeIcons } from 'primeng/api'
import equal from 'fast-deep-equal'
import { catchError, map, mergeMap, of, switchMap, tap } from 'rxjs'
import { CreateScaffoldRequest, Scaffold, ScaffoldService, UpdateScaffoldRequest } from 'src/app/shared/generated'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import { ScaffoldSearchActions } from './scaffold-search.actions'
import { scaffoldSearchCriteriasSchema } from './scaffold-search.parameters'
import { scaffoldSearchSelectors, selectScaffoldSearchViewModel } from './scaffold-search.selectors'
import { ScaffoldCreateUpdateComponent } from './dialogs/scaffold-create-update/scaffold-create-update.component'
import { ScaffoldSearchComponent } from './scaffold-search.component'

@Injectable()
export class ScaffoldSearchEffects {
  constructor(
    private readonly portalDialogService: PortalDialogService,
    private readonly actions$: Actions,
    private readonly route: ActivatedRoute,
    private readonly scaffoldService: ScaffoldService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly messageService: PortalMessageService,
    private readonly exportDataService: ExportDataService
  ) {}

  syncParamsToUrl$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ScaffoldSearchActions.searchButtonClicked, ScaffoldSearchActions.resetButtonClicked),
        concatLatestFrom(() => [this.store.select(scaffoldSearchSelectors.selectCriteria), this.route.queryParams]),
        tap(([, criteria, queryParams]) => {
          const results = scaffoldSearchCriteriasSchema.safeParse(queryParams)
          if (!results.success || !equal(criteria, results.data)) {
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { ...criteria },
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
        ofType(ScaffoldSearchActions.detailsButtonClicked),
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
      filterForNavigatedTo(this.router, ScaffoldSearchComponent),
      filterOutQueryParamsHaveNotChanged(this.router, scaffoldSearchCriteriasSchema, true),
      concatLatestFrom(() => this.store.select(scaffoldSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  performSearch(searchCriteria: Record<string, unknown>) {
    return this.scaffoldService
      .findScaffoldByCriteria({
        ...Object.entries(searchCriteria).reduce(
          (acc, [key, value]) => ({ ...acc, [key]: value instanceof Date ? value.toISOString() : value }),
          {}
        )
      })
      .pipe(
        map(({ stream, totalElements }) =>
          ScaffoldSearchActions.scaffoldSearchResultsReceived({
            results: stream ?? [],
            totalNumberOfResults: totalElements ?? 0
          })
        ),
        catchError((error) =>
          of(ScaffoldSearchActions.scaffoldSearchResultsLoadingFailed({ error }))
        )
      )
  }

  refreshSearchAfterCreateUpdate$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ScaffoldSearchActions.createScaffoldSucceeded, ScaffoldSearchActions.updateScaffoldSucceeded),
      concatLatestFrom(() => this.store.select(scaffoldSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  refreshSearchAfterDelete$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ScaffoldSearchActions.deleteScaffoldSucceeded),
      concatLatestFrom(() => this.store.select(scaffoldSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  editButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ScaffoldSearchActions.editScaffoldButtonClicked),
      concatLatestFrom(() => this.store.select(scaffoldSearchSelectors.selectResults)),
      map(([action, results]) => results.find((item) => item.id === action.id)),
      mergeMap((itemToEdit) => {
        return this.portalDialogService.openDialog<Scaffold | undefined>(
          'SCAFFOLD_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: ScaffoldCreateUpdateComponent,
            inputs: { vm: { itemToEdit } }
          },
          'SCAFFOLD_CREATE_UPDATE.UPDATE.FORM.SAVE',
          'SCAFFOLD_CREATE_UPDATE.UPDATE.FORM.CANCEL',
          { baseZIndex: 100 }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button === 'secondary') {
          return of(ScaffoldSearchActions.updateScaffoldCancelled())
        }
        if (!dialogResult.result?.id) {
          throw new Error('DialogResult was not set as expected!')
        }
        const itemToEditId = dialogResult.result.id
        const itemToEdit = { ...dialogResult.result } as UpdateScaffoldRequest
        return this.scaffoldService.updateScaffoldById(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({ summaryKey: 'SCAFFOLD_CREATE_UPDATE.UPDATE.SUCCESS' })
            return ScaffoldSearchActions.updateScaffoldSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({ summaryKey: 'SCAFFOLD_CREATE_UPDATE.UPDATE.ERROR' })
        return of(ScaffoldSearchActions.updateScaffoldFailed({ error }))
      })
    )
  })

  createButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ScaffoldSearchActions.createScaffoldButtonClicked),
      switchMap(() => {
        return this.portalDialogService.openDialog<Scaffold | undefined>(
          'SCAFFOLD_CREATE_UPDATE.CREATE.HEADER',
          {
            type: ScaffoldCreateUpdateComponent,
            inputs: { vm: { itemToEdit: {} } }
          },
          'SCAFFOLD_CREATE_UPDATE.CREATE.FORM.SAVE',
          'SCAFFOLD_CREATE_UPDATE.CREATE.FORM.CANCEL',
          { baseZIndex: 100 }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button === 'secondary') {
          return of(ScaffoldSearchActions.createScaffoldCancelled())
        }
        if (!dialogResult.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        const toCreate = { ...dialogResult.result } as CreateScaffoldRequest
        return this.scaffoldService.createScaffold(toCreate).pipe(
          map(() => {
            this.messageService.success({ summaryKey: 'SCAFFOLD_CREATE_UPDATE.CREATE.SUCCESS' })
            return ScaffoldSearchActions.createScaffoldSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({ summaryKey: 'SCAFFOLD_CREATE_UPDATE.CREATE.ERROR' })
        return of(ScaffoldSearchActions.createScaffoldFailed({ error }))
      })
    )
  })

  deleteButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ScaffoldSearchActions.deleteScaffoldButtonClicked),
      concatLatestFrom(() => this.store.select(scaffoldSearchSelectors.selectResults)),
      map(([action, results]) => results.find((item) => item.id === action.id)),
      mergeMap((itemToDelete) => {
        return this.portalDialogService
          .openDialog<unknown>(
            'SCAFFOLD_DELETE.HEADER',
            'SCAFFOLD_DELETE.MESSAGE',
            { key: 'SCAFFOLD_DELETE.CONFIRM', icon: PrimeIcons.CHECK },
            { key: 'SCAFFOLD_DELETE.CANCEL', icon: PrimeIcons.TIMES }
          )
          .pipe(map((state): [DialogState<unknown>, Scaffold | undefined] => [state, itemToDelete]))
      }),
      switchMap(([dialogResult, itemToDelete]) => {
        if (!dialogResult || dialogResult.button === 'secondary') {
          return of(ScaffoldSearchActions.deleteScaffoldCancelled())
        }
        if (!itemToDelete?.id) {
          throw new Error('Item to delete not found!')
        }
        return this.scaffoldService.deleteScaffoldById(itemToDelete.id).pipe(
          map(() => {
            this.messageService.success({ summaryKey: 'SCAFFOLD_DELETE.SUCCESS' })
            return ScaffoldSearchActions.deleteScaffoldSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({ summaryKey: 'SCAFFOLD_DELETE.ERROR' })
        return of(ScaffoldSearchActions.deleteScaffoldFailed({ error }))
      })
    )
  })

  rehydrateChartVisibility$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, ScaffoldSearchComponent),
      filterOutOnlyQueryParamsChanged(this.router),
      map(() =>
        ScaffoldSearchActions.chartVisibilityRehydrated({
          visible: localStorage.getItem('ScaffoldChartVisibility') === 'true'
        })
      )
    )
  })
  
  saveChartVisibility$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ScaffoldSearchActions.chartVisibilityToggled),
        concatLatestFrom(() => this.store.select(scaffoldSearchSelectors.selectChartVisible)),
        tap(([, chartVisible]) => {
          localStorage.setItem('ScaffoldChartVisibility', String(chartVisible))
        })
      )
    },
    { dispatch: false }
  )

  exportData$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ScaffoldSearchActions.exportButtonClicked),
        concatLatestFrom(() => this.store.select(selectScaffoldSearchViewModel)),
        map(([, viewModel]) => {
          this.exportDataService.exportCsv(
            viewModel.displayedColumns,
            viewModel.results,
            'Scaffold.csv'
          )
        })
      )
    },
    { dispatch: false }
  )

  errorMessages: { action: Action; key: string }[] = [
    {
      action: ScaffoldSearchActions.scaffoldSearchResultsLoadingFailed,
      key: 'SCAFFOLD_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
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
