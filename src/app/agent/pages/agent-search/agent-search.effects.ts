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
import { AgentService } from '../../../shared/generated'

import { Injectable, inject } from '@angular/core'
import equal from 'fast-deep-equal'

import { agentSearchActions } from './agent-search.actions'
import { AgentSearchComponent } from './agent-search.component'
import { agentSearchCriteriasSchema } from './agent-search.parameters'
import { agentSearchSelectors, selectAgentSearchViewModel } from './agent-search.selectors'

@Injectable()
export class AgentSearchEffects {
  private readonly actions$ = inject(Actions)
  private readonly route = inject(ActivatedRoute)
  private readonly agentService = inject(AgentService)
  private readonly router = inject(Router)
  private readonly store = inject(Store)
  private readonly messageService = inject(PortalMessageService)
  private readonly exportDataService = inject(ExportDataService)

  syncParamsToUrl$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(agentSearchActions.searchButtonClicked, agentSearchActions.resetButtonClicked),
        concatLatestFrom(() => [this.store.select(agentSearchSelectors.selectCriteria), this.route.queryParams]),
        tap(([, criteria, queryParams]) => {
          const results = agentSearchCriteriasSchema.safeParse(queryParams)
          if (!results.success || !equal(criteria, results.data)) {
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
        ofType(agentSearchActions.detailsButtonClicked),
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
      filterForNavigatedTo(this.router, AgentSearchComponent),
      filterOutQueryParamsHaveNotChanged(this.router, agentSearchCriteriasSchema, true),
      concatLatestFrom(() => this.store.select(agentSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  performSearch(searchCriteria: Record<string, string | number | boolean | Date | undefined>) {
    return this.agentService
      .findAgentBySearchCriteria({
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
          agentSearchActions.agentSearchResultsReceived({
            stream: (stream ?? []) as never,
            size: size ?? 0,
            number: number ?? 0,
            totalElements: totalElements ?? 0,
            totalPages: totalPages ?? 0
          })
        ),
        catchError((error) =>
          of(
            agentSearchActions.agentSearchResultsLoadingFailed({
              error
            })
          )
        )
      )
  }

  exportData$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(agentSearchActions.exportButtonClicked),
        concatLatestFrom(() => this.store.select(selectAgentSearchViewModel)),
        map(([, viewModel]) => {
          this.exportDataService.exportCsv(
            viewModel.resultComponentState?.displayedColumns ?? [],
            viewModel.results,
            'agent.csv'
          )
        })
      )
    },
    { dispatch: false }
  )

  errorMessages: { action: Action; key: string }[] = [
    {
      action: agentSearchActions.agentSearchResultsLoadingFailed,
      key: 'AGENT_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
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
