import { Injectable, SkipSelf } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import equal from 'fast-deep-equal'
import { catchError, map, mergeMap, of, switchMap, tap } from 'rxjs'

import { ExportDataService, PortalDialogService } from '@onecx/angular-accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { filterForNavigatedTo, filterOutQueryParamsHaveNotChanged } from '@onecx/ngrx-accelerator'

import { CreateToolRequest, Tool, ToolService, ToolType, UpdateToolRequest } from 'src/app/shared/generated'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import { McpserverCreateUpdateComponent } from './dialogs/mcpserver-create-update/mcpserver-create-update.component'
import { MCPServerSearchActions } from './mcpserver-search.actions'
import { MCPServerSearchComponent } from './mcpserver-search.component'
import { mcpserverSearchCriteriasSchema } from './mcpserver-search.parameters'
import { mcpserverSearchSelectors, selectMCPServerSearchViewModel } from './mcpserver-search.selectors'

@Injectable()
export class MCPServerSearchEffects {
  constructor(
    private readonly actions$: Actions,
    @SkipSelf() private readonly route: ActivatedRoute,
    private readonly toolService: ToolService,
    private readonly portalDialogService: PortalDialogService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly messageService: PortalMessageService,
    private readonly exportDataService: ExportDataService
  ) {}

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
              // FUTURE IMPROVEMENT: Move to docs to explain how to only put the date part in the URL in case you have date and not datetime
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

  refreshSearchAfterCreateUpdate$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MCPServerSearchActions.createMcpserverSucceeded, MCPServerSearchActions.updateMcpserverSucceeded),
      concatLatestFrom(() => this.store.select(mcpserverSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  editButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MCPServerSearchActions.editMcpserverButtonClicked),
      concatLatestFrom(() => this.store.select(mcpserverSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id)
      }),
      mergeMap((itemToEdit) => {
        return this.portalDialogService.openDialog<Tool | undefined>(
          'MCPSERVER_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: McpserverCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit
              }
            }
          },
          'MCPSERVER_CREATE_UPDATE.UPDATE.FORM.SAVE',
          'MCPSERVER_CREATE_UPDATE.UPDATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(MCPServerSearchActions.updateMcpserverCancelled())
        }
        if (!dialogResult.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        if (!dialogResult.result.id) {
          throw new Error('Item id was not set as expected!')
        }
        const itemToEditId = dialogResult.result.id
        const itemToEdit: UpdateToolRequest = {
          modificationCount: dialogResult.result.modificationCount ?? 0,
          name: dialogResult.result.name,
          description: dialogResult.result.description
        }
        return this.toolService.updateToolById(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'MCPSERVER_CREATE_UPDATE.UPDATE.SUCCESS'
            })
            return MCPServerSearchActions.updateMcpserverSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'MCPSERVER_CREATE_UPDATE.UPDATE.ERROR'
        })
        return of(
          MCPServerSearchActions.updateMcpserverFailed({
            error
          })
        )
      })
    )
  })

  createButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MCPServerSearchActions.createMcpserverButtonClicked),
      switchMap(() => {
        return this.portalDialogService.openDialog<Tool | undefined>(
          'MCPSERVER_CREATE_UPDATE.CREATE.HEADER',
          {
            type: McpserverCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: {}
              }
            }
          },
          'MCPSERVER_CREATE_UPDATE.CREATE.FORM.SAVE',
          'MCPSERVER_CREATE_UPDATE.CREATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(MCPServerSearchActions.createMcpserverCancelled())
        }
        if (!dialogResult.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        const toCreateItem: CreateToolRequest = {
          name: dialogResult.result.name,
          description: dialogResult.result.description,
          type: ToolType.Mcp
        }
        return this.toolService.createTool(toCreateItem).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'MCPSERVER_CREATE_UPDATE.CREATE.SUCCESS'
            })
            return MCPServerSearchActions.createMcpserverSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'MCPSERVER_CREATE_UPDATE.CREATE.ERROR'
        })
        return of(
          MCPServerSearchActions.createMcpserverFailed({
            error
          })
        )
      })
    )
  })

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
    return this.toolService
      .findToolByCriteria({
        type: ToolType.Mcp,
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
            stream: stream ?? [],
            size: size ?? 0,
            number: number ?? 0,
            totalElements: totalElements ?? 0,
            totalPages: totalPages ?? 0
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
