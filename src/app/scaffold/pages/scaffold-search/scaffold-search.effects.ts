import { ActivatedRoute, Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { ExportDataService } from '@onecx/angular-accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { filterForNavigatedTo, filterOutQueryParamsHaveNotChanged } from '@onecx/ngrx-accelerator'
import { catchError, map, of, switchMap, tap } from 'rxjs'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import { ScaffoldService } from '../../../shared/generated'

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

  navigateToOrderDetailsPage$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(scaffoldSearchActions.detailsButtonClicked),
        concatLatestFrom(() => this.store.select(selectUrl)),
        tap(([action, currentUrl]) => {
          const urlTree = this.router.parseUrl(currentUrl as string)
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
