import { Injectable, SkipSelf } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { filterForNavigatedTo, filterOutQueryParamsHaveNotChanged } from '@onecx/ngrx-accelerator'
import { ExportDataService, PortalMessageService } from '@onecx/portal-integration-angular'
import equal from 'fast-deep-equal'
import { catchError, map, of, switchMap, tap } from 'rxjs'
import { McpServerService } from 'src/app/shared/generated'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import { MCPServerSearchActions } from './mcpserver-search.actions'
import { MCPServerSearchComponent } from './mcpserver-search.component'
import { mcpserverSearchCriteriasSchema } from './mcpserver-search.parameters'
import { mcpserverSearchSelectors, selectMCPServerSearchViewModel } from './mcpserver-search.selectors'

@Injectable()
export class MCPServerSearchEffects {
  constructor(
    private readonly actions$: Actions,
    @SkipSelf() private readonly route: ActivatedRoute,
    private readonly mcpserverService: McpServerService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly messageService: PortalMessageService,
    private readonly exportDataService: ExportDataService
  ) { }

  syncParamsToUrl$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(MCPServerSearchActions.searchButtonClicked, MCPServerSearchActions.resetButtonClicked),
        concatLatestFrom(() => [this.store.select(mcpserverSearchSelectors.selectCriteria), this.route.queryParams]),
        tap(([, criteria, queryParams]) => {
          const results = mcpserverSearchCriteriasSchema.safeParse(queryParams)
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
        ofType(MCPServerSearchActions.detailsButtonClicked),
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
      filterForNavigatedTo(this.router, MCPServerSearchComponent),
      filterOutQueryParamsHaveNotChanged(this.router, mcpserverSearchCriteriasSchema, true),
      concatLatestFrom(() => this.store.select(mcpserverSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  performSearch(searchCriteria: Record<string, any>) {
    return this.mcpserverService
      .findMCPServerByCriteria({
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
          MCPServerSearchActions.mcpserverSearchResultsReceived({
            stream,
            size,
            number,
            totalElements,
            totalPages
          })
        ),
        catchError((error) =>
          of(
            MCPServerSearchActions.mcpserverSearchResultsLoadingFailed({
              error
            })
          )
        )
      )
  }

  exportData$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(MCPServerSearchActions.exportButtonClicked),
        concatLatestFrom(() => this.store.select(selectMCPServerSearchViewModel)),
        map(([, viewModel]) => {
          this.exportDataService.exportCsv(
            viewModel.resultComponentState?.displayedColumns ?? [],
            viewModel.results,
            'MCPServer.csv'
          )
        })
      )
    },
    { dispatch: false }
  )

  errorMessages: { action: Action; key: string }[] = [
    {
      action: MCPServerSearchActions.mcpserverSearchResultsLoadingFailed,
      key: 'MCPSERVER_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
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
