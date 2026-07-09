import { ActivatedRoute, Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { ExportDataService, PortalDialogService } from '@onecx/angular-accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { filterForNavigatedTo, filterOutQueryParamsHaveNotChanged } from '@onecx/ngrx-accelerator'
import { catchError, map, mergeMap, of, switchMap, tap } from 'rxjs'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import { CreateScaffoldRequest, Scaffold, ScaffoldService, UpdateScaffoldRequest } from '../../../shared/generated'
import { ScaffoldCreateUpdateComponent } from './dialogs/scaffold-create-update/scaffold-create-update.component'

import { Injectable, inject } from '@angular/core'
import equal from 'fast-deep-equal'

import { scaffoldSearchActions } from './scaffold-search.actions'
import { ScaffoldSearchComponent } from './scaffold-search.component'
import { scaffoldSearchCriteriasSchema } from './scaffold-search.parameters'
import { scaffoldSearchSelectors, selectScaffoldSearchViewModel } from './scaffold-search.selectors'

@Injectable()
export class ScaffoldSearchEffects {
  private readonly actions$ = inject(Actions)
  private readonly route = inject(ActivatedRoute)
  private readonly scaffoldService = inject(ScaffoldService)
  private readonly portalDialogService = inject(PortalDialogService)
  private readonly router = inject(Router)
  private readonly store = inject(Store)
  private readonly messageService = inject(PortalMessageService)
  private readonly exportDataService = inject(ExportDataService)

  syncParamsToUrl$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(scaffoldSearchActions.searchButtonClicked, scaffoldSearchActions.resetButtonClicked),
        concatLatestFrom(() => [this.store.select(scaffoldSearchSelectors.selectCriteria), this.route.queryParams]),
        tap(([, criteria, queryParams]) => {
          const results = scaffoldSearchCriteriasSchema.safeParse(queryParams)
          if (results.success && !equal(criteria, results.data)) {
            const params = {
              ...criteria
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

  navigateToOrderDetailsPage$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(scaffoldSearchActions.detailsButtonClicked),
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
      ofType(scaffoldSearchActions.createScaffoldSucceeded, scaffoldSearchActions.updateScaffoldSucceeded),
      concatLatestFrom(() => this.store.select(scaffoldSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  editButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(scaffoldSearchActions.editScaffoldButtonClicked),
      concatLatestFrom(() => this.store.select(scaffoldSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id)
      }),
      mergeMap((itemToEdit) => {
        return this.portalDialogService.openDialog<Scaffold | undefined>(
          'SCAFFOLD_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: ScaffoldCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit
              }
            }
          },
          'SCAFFOLD_CREATE_UPDATE.UPDATE.FORM.SAVE',
          'SCAFFOLD_CREATE_UPDATE.UPDATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(scaffoldSearchActions.updateScaffoldCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        if (!dialogResult.result.id) {
          throw new Error('Item id was not set as expected!')
        }
        const itemToEditId = dialogResult.result.id
        const itemToEdit: UpdateScaffoldRequest = {
          modificationCount: dialogResult.result.modificationCount ?? 0,
          name: dialogResult.result.name
        }
        return this.scaffoldService.updateScaffoldById(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'SCAFFOLD_CREATE_UPDATE.UPDATE.SUCCESS'
            })
            return scaffoldSearchActions.updateScaffoldSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'SCAFFOLD_CREATE_UPDATE.UPDATE.ERROR'
        })
        return of(
          scaffoldSearchActions.updateScaffoldFailed({
            error
          })
        )
      })
    )
  })

  createButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(scaffoldSearchActions.createScaffoldButtonClicked),
      switchMap(() => {
        return this.portalDialogService.openDialog<Scaffold | undefined>(
          'SCAFFOLD_CREATE_UPDATE.CREATE.HEADER',
          {
            type: ScaffoldCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: {}
              }
            }
          },
          'SCAFFOLD_CREATE_UPDATE.CREATE.FORM.SAVE',
          'SCAFFOLD_CREATE_UPDATE.CREATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(scaffoldSearchActions.createScaffoldCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        const toCreateItem: CreateScaffoldRequest = {
          name: dialogResult.result.name
        }
        return this.scaffoldService.createScaffold(toCreateItem).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'SCAFFOLD_CREATE_UPDATE.CREATE.SUCCESS'
            })
            return scaffoldSearchActions.createScaffoldSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'SCAFFOLD_CREATE_UPDATE.CREATE.ERROR'
        })
        return of(
          scaffoldSearchActions.createScaffoldFailed({
            error
          })
        )
      })
    )
  })

  searchByUrl$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, ScaffoldSearchComponent),
      filterOutQueryParamsHaveNotChanged(this.router, scaffoldSearchCriteriasSchema, true),
      concatLatestFrom(() => this.store.select(scaffoldSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  performSearch(searchCriteria: Record<string, string | number | boolean | Date | undefined>) {
    return this.scaffoldService
      .findScaffoldByCriteria({
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
          scaffoldSearchActions.scaffoldSearchResultsReceived({
            stream: (stream ?? []) as never,
            size: size ?? 0,
            number: number ?? 0,
            totalElements: totalElements ?? 0,
            totalPages: totalPages ?? 0
          })
        ),
        catchError((error) =>
          of(
            scaffoldSearchActions.scaffoldSearchResultsLoadingFailed({
              error
            })
          )
        )
      )
  }

  exportData$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(scaffoldSearchActions.exportButtonClicked),
        concatLatestFrom(() => this.store.select(selectScaffoldSearchViewModel)),
        map(([, viewModel]) => {
          this.exportDataService.exportCsv(
            viewModel.resultComponentState?.displayedColumns ?? [],
            viewModel.results,
            'export_scaffold.csv'
          )
        })
      )
    },
    { dispatch: false }
  )

  errorMessages: { action: Action; key: string }[] = [
    {
      action: scaffoldSearchActions.scaffoldSearchResultsLoadingFailed,
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
