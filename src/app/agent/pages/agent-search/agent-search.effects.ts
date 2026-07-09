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
import { Agent, AgentService, CreateAgentRequest, UpdateAgentRequest } from '../../../shared/generated'

import { Injectable, inject } from '@angular/core'
import equal from 'fast-deep-equal'

import { agentSearchActions } from './agent-search.actions'
import { AgentSearchComponent } from './agent-search.component'
import { AgentCreateUpdateComponent } from './dialogs/agent-create-update/agent-create-update.component'
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
  private readonly portalDialogService = inject(PortalDialogService)

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

  refreshSearchAfterCreateUpdate$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(agentSearchActions.createAgentSucceeded, agentSearchActions.updateAgentSucceeded),
      concatLatestFrom(() => this.store.select(agentSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  createButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(agentSearchActions.createAgentButtonClicked),
      switchMap(() => {
        return this.portalDialogService.openDialog<Agent | undefined>(
          'AGENT_CREATE_UPDATE.CREATE.HEADER',
          {
            type: AgentCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: undefined
              }
            }
          },
          'AGENT_CREATE_UPDATE.CREATE.FORM.SAVE',
          'AGENT_CREATE_UPDATE.CREATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(agentSearchActions.createAgentCancelled())
        }
        if (!dialogResult?.result?.name) {
          throw new Error('DialogResult was not set as expected!')
        }
        const toCreateItem: CreateAgentRequest = {
          name: dialogResult.result.name,
          description: dialogResult.result.description
        }

        return this.agentService.createAgent(toCreateItem).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'AGENT_CREATE_UPDATE.CREATE.SUCCESS'
            })
            return agentSearchActions.createAgentSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'AGENT_CREATE_UPDATE.CREATE.ERROR'
        })
        return of(
          agentSearchActions.createAgentFailed({
            error
          })
        )
      })
    )
  })

  editButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(agentSearchActions.editAgentButtonClicked),
      concatLatestFrom(() => this.store.select(agentSearchSelectors.selectResults)),
      map(([action, results]) => results.find((item) => item.id == action.id)),
      mergeMap((itemToEdit) => {
        return this.portalDialogService.openDialog<Agent | undefined>(
          'AGENT_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: AgentCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit
              }
            }
          },
          'AGENT_CREATE_UPDATE.UPDATE.FORM.SAVE',
          'AGENT_CREATE_UPDATE.UPDATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(agentSearchActions.updateAgentCancelled())
        }
        if (!dialogResult?.result?.id || dialogResult.result.modificationCount == undefined) {
          throw new Error('DialogResult was not set as expected!')
        }
        const itemToEditId = dialogResult.result.id
        const itemToEdit: UpdateAgentRequest = {
          modificationCount: dialogResult.result.modificationCount,
          name: dialogResult.result.name,
          description: dialogResult.result.description
        }

        return this.agentService.updateAgent(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'AGENT_CREATE_UPDATE.UPDATE.SUCCESS'
            })
            return agentSearchActions.updateAgentSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'AGENT_CREATE_UPDATE.UPDATE.ERROR'
        })
        return of(
          agentSearchActions.updateAgentFailed({
            error
          })
        )
      })
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
