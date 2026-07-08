import { Injectable, inject } from '@angular/core'
import { Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { PrimeIcons } from 'primeng/api'
import { catchError, filter, map, mergeMap, of, switchMap, tap } from 'rxjs'

import { DialogState, PortalDialogService } from '@onecx/angular-accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { filterForNavigatedTo } from '@onecx/ngrx-accelerator'

import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'
import { selectRouteParam, selectUrl } from 'src/app/shared/selectors/router.selectors'
import {
  Agent,
  AgentGroupService,
  AgentService,
  ModelService,
  ProviderService,
  ScaffoldService,
  ToolService,
  UpdateAgentRequest
} from '../../../shared/generated'
import { agentDetailsActions } from './agent-details.actions'
import { AgentDetailsComponent } from './agent-details.component'
import { agentDetailsSelectors } from './agent-details.selectors'

@Injectable()
export class AgentDetailsEffects {
  private readonly actions$ = inject(Actions)
  private readonly agentService = inject(AgentService)
  private readonly providerService = inject(ProviderService)
  private readonly modelService = inject(ModelService)
  private readonly scaffoldService = inject(ScaffoldService)
  private readonly toolService = inject(ToolService)
  private readonly agentGroupService = inject(AgentGroupService)
  private readonly router = inject(Router)
  private readonly store = inject(Store)
  private readonly messageService = inject(PortalMessageService)
  private readonly portalDialogService = inject(PortalDialogService)

  navigatedToDetailsPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, AgentDetailsComponent),
      concatLatestFrom(() => this.store.select(selectRouteParam('id'))),
      map(([, id]) => {
        return agentDetailsActions.navigatedToDetailsPage({ id })
      })
    )
  })

  loadAgentById$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(agentDetailsActions.navigatedToDetailsPage),
      switchMap(({ id }) => {
        if (!id) {
          return of(agentDetailsActions.agentDetailsLoadingFailedMissingId({ error: 'Missing ID' }))
        }
        return this.agentService.getAgent(id).pipe(
          map((resource) =>
            agentDetailsActions.agentDetailsReceived({
              details: resource
            })
          ),
          catchError((error) =>
            of(
              agentDetailsActions.agentDetailsLoadingFailed({
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
      ofType(agentDetailsActions.navigatedToDetailsPage),
      switchMap(() => {
        return this.providerService.findProviderBySearchCriteria({}).pipe(
          map(({ stream }) =>
            agentDetailsActions.agentProvidersReceived({
              providers: stream ?? []
            })
          ),
          catchError((error) =>
            of(
              agentDetailsActions.agentProvidersLoadingFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  loadModels$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(agentDetailsActions.navigatedToDetailsPage),
      switchMap(() => {
        return this.modelService.findModelByCriteria({}).pipe(
          map(({ stream }) =>
            agentDetailsActions.agentModelsReceived({
              models: stream ?? []
            })
          ),
          catchError((error) =>
            of(
              agentDetailsActions.agentModelsLoadingFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  loadScaffolds$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(agentDetailsActions.navigatedToDetailsPage),
      switchMap(() => {
        return this.scaffoldService.findScaffoldByCriteria({}).pipe(
          map(({ stream }) =>
            agentDetailsActions.agentScaffoldsReceived({
              scaffolds: stream ?? []
            })
          ),
          catchError((error) =>
            of(
              agentDetailsActions.agentScaffoldsLoadingFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  loadTools$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(agentDetailsActions.navigatedToDetailsPage),
      switchMap(() => {
        return this.toolService.findToolByCriteria({}).pipe(
          map(({ stream }) =>
            agentDetailsActions.agentToolsReceived({
              tools: stream ?? []
            })
          ),
          catchError((error) =>
            of(
              agentDetailsActions.agentToolsLoadingFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  loadGroups$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(agentDetailsActions.navigatedToDetailsPage),
      switchMap(() => {
        return this.agentGroupService.findAgentGroupByCriteria({}).pipe(
          map(({ stream }) =>
            agentDetailsActions.agentGroupsReceived({
              groups: stream ?? []
            })
          ),
          catchError((error) =>
            of(
              agentDetailsActions.agentGroupsLoadingFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  createGroupInPlace$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(agentDetailsActions.createGroupInPlaceClicked),
      switchMap(({ name }) => {
        return this.agentGroupService.createAgentGroup({ name }).pipe(
          map((group) => {
            this.messageService.success({
              summaryKey: 'AGENT_DETAILS.ASSIGNMENTS.CREATE_GROUP_SUCCESS'
            })
            return agentDetailsActions.createGroupInPlaceSucceeded({ group })
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'AGENT_DETAILS.ASSIGNMENTS.CREATE_GROUP_FAILED'
            })
            return of(agentDetailsActions.createGroupInPlaceFailed({ error }))
          })
        )
      })
    )
  })

  cancelButtonNotDirty$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(agentDetailsActions.cancelButtonClicked),
      filter((action) => !action.dirty),
      map(() => {
        return agentDetailsActions.cancelEditNotDirty()
      })
    )
  })

  cancelButtonClickedDirty$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(agentDetailsActions.cancelButtonClicked),
      filter((action) => action.dirty),
      switchMap(() => {
        return this.portalDialogService.openDialog<Agent | undefined>(
          'AGENT_DETAILS.CANCEL.HEADER',
          'AGENT_DETAILS.CANCEL.MESSAGE',
          'AGENT_DETAILS.CANCEL.CONFIRM'
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(agentDetailsActions.cancelEditBackClicked())
        }
        return of(agentDetailsActions.cancelEditConfirmClicked())
      })
    )
  })

  saveButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(agentDetailsActions.saveButtonClicked),
      concatLatestFrom(() => this.store.select(agentDetailsSelectors.selectDetails)),
      switchMap(([action, details]) => {
        const itemToEditId = details?.id
        const updatedItem = {
          ...details,
          ...action.details
        }

        if (!itemToEditId) {
          return of(agentDetailsActions.updateAgentCancelled())
        }
        const itemToEdit: UpdateAgentRequest = {
          modificationCount: details?.modificationCount ?? 0,
          ...updatedItem
        }
        return this.agentService.updateAgent(itemToEditId, itemToEdit).pipe(
          map((response) => {
            this.messageService.success({
              summaryKey: 'AGENT_DETAILS.UPDATE.SUCCESS'
            })
            return agentDetailsActions.updateAgentSucceeded({
              details: response
            })
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'AGENT_DETAILS.UPDATE.ERROR'
            })
            return of(
              agentDetailsActions.updateAgentFailed({
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
      ofType(agentDetailsActions.deleteButtonClicked),
      concatLatestFrom(() => this.store.select(agentDetailsSelectors.selectDetails)),
      mergeMap(([, itemToDelete]) => {
        return this.portalDialogService
          .openDialog<unknown>(
            'AGENT_DETAILS.DELETE.HEADER',
            'AGENT_DETAILS.DELETE.MESSAGE',
            {
              key: 'AGENT_DETAILS.DELETE.CONFIRM',
              icon: PrimeIcons.CHECK
            },
            {
              key: 'AGENT_DETAILS.DELETE.CANCEL',
              icon: PrimeIcons.TIMES
            }
          )
          .pipe(
            map((state): [DialogState<unknown>, Agent | undefined] => {
              return [state, itemToDelete]
            })
          )
      }),
      switchMap(([dialogResult, itemToDelete]) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(agentDetailsActions.deleteAgentCancelled())
        }
        if (!itemToDelete?.id) {
          throw new Error('Item to delete not found!')
        }

        return this.agentService.deleteAgent(itemToDelete.id).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'AGENT_DETAILS.DELETE.SUCCESS'
            })
            return agentDetailsActions.deleteAgentSucceeded()
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'AGENT_DETAILS.DELETE.ERROR'
            })
            return of(
              agentDetailsActions.deleteAgentFailed({
                error
              })
            )
          })
        )
      })
    )
  })

  deleteAgentSucceeded$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(agentDetailsActions.deleteAgentSucceeded),
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
      action: agentDetailsActions.agentDetailsLoadingFailed,
      key: 'AGENT_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
    },
    {
      action: agentDetailsActions.agentProvidersLoadingFailed,
      key: 'PROVIDER_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
    },
    {
      action: agentDetailsActions.agentModelsLoadingFailed,
      key: 'AGENT_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
    },
    {
      action: agentDetailsActions.agentScaffoldsLoadingFailed,
      key: 'AGENT_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
    },
    {
      action: agentDetailsActions.agentToolsLoadingFailed,
      key: 'AGENT_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
    },
    {
      action: agentDetailsActions.agentGroupsLoadingFailed,
      key: 'AGENT_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
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
      ofType(agentDetailsActions.navigateBackButtonClicked),
      concatLatestFrom(() => [this.store.select(selectBackNavigationPossible)]),
      switchMap(([, backNavigationPossible]) => {
        if (!backNavigationPossible) {
          return of(agentDetailsActions.backNavigationFailed())
        }
        globalThis.history.back()
        return of(agentDetailsActions.backNavigationStarted())
      })
    )
  })
}
