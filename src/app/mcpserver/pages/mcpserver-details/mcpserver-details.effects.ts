import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { filterForNavigatedTo } from '@onecx/ngrx-accelerator'
import { DialogState, PortalDialogService, PortalMessageService } from '@onecx/portal-integration-angular'
import { PrimeIcons } from 'primeng/api'
import { catchError, filter, map, mergeMap, of, switchMap, tap } from 'rxjs'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'
import { selectRouteParam, selectUrl } from 'src/app/shared/selectors/router.selectors'
import { MCPServer, McpServerService, UpdateMCPServerRequest } from '../../../shared/generated'
import { MCPServerDetailsActions } from './mcpserver-details.actions'
import { MCPServerDetailsComponent } from './mcpserver-details.component'
import { mcpserverDetailsSelectors } from './mcpserver-details.selectors'

@Injectable()
export class MCPServerDetailsEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly mcpserverService: McpServerService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly messageService: PortalMessageService,
    private readonly portalDialogService: PortalDialogService
  ) { }

  navigatedToDetailsPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, MCPServerDetailsComponent),
      concatLatestFrom(() => this.store.select(selectRouteParam('id'))),
      map(([, id]) => {
        return MCPServerDetailsActions.navigatedToDetailsPage({
          id
        })
      })
    )
  })

  loadMCPServerById$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MCPServerDetailsActions.navigatedToDetailsPage),
      switchMap(({ id }) =>
        this.mcpserverService.getMCPServerById(id ?? '').pipe(
          map((resource) =>
            MCPServerDetailsActions.mCPServerDetailsReceived({
              details: resource
            })
          ),
          catchError((error) =>
            of(
              MCPServerDetailsActions.mCPServerDetailsLoadingFailed({
                error
              })
            )
          )
        )
      )
    )
  })

  cancelButtonClickedDirty$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MCPServerDetailsActions.cancelButtonClicked),
      filter((action) => action.dirty),
      switchMap(() => {
        return this.portalDialogService.openDialog<MCPServer | undefined>(
          'MCPSERVER_DETAILS.CANCEL.HEADER',
          'MCPSERVER_DETAILS.CANCEL.MESSAGE',
          'MCPSERVER_DETAILS.CANCEL.CONFIRM'
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(MCPServerDetailsActions.cancelEditBackClicked())
        }
        return of(MCPServerDetailsActions.cancelEditConfirmClicked())
      })
    )
  })

  saveButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MCPServerDetailsActions.saveButtonClicked),
      concatLatestFrom(() => this.store.select(mcpserverDetailsSelectors.selectDetails)),
      switchMap(([action, details]) => {
        const itemToEditId = details?.id
        const updatedItem = {
          ...details,
          ...action.details
        }

        if (!itemToEditId) {
          return of(MCPServerDetailsActions.updateMCPServerCancelled())
        }
        const itemToEdit = {
          ...updatedItem
        } as UpdateMCPServerRequest
        return this.mcpserverService.updateMCPServerById(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'MCPSERVER_DETAILS.UPDATE.SUCCESS'
            })
            return MCPServerDetailsActions.updateMCPServerSucceeded()
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'MCPSERVER_DETAILS.UPDATE.ERROR'
            })
            return of(
              MCPServerDetailsActions.updateMCPServerFailed({
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
      ofType(MCPServerDetailsActions.deleteButtonClicked),
      concatLatestFrom(() => this.store.select(mcpserverDetailsSelectors.selectDetails)),
      mergeMap(([, itemToDelete]) => {
        return this.portalDialogService
          .openDialog<unknown>(
            'MCPSERVER_DETAILS.DELETE.HEADER',
            'MCPSERVER_DETAILS.DELETE.MESSAGE',
            {
              key: 'MCPSERVER_DETAILS.DELETE.CONFIRM',
              icon: PrimeIcons.CHECK
            },
            {
              key: 'MCPSERVER_DETAILS.DELETE.CANCEL',
              icon: PrimeIcons.TIMES
            }
          )
          .pipe(
            map((state): [DialogState<unknown>, MCPServer | undefined] => {
              return [state, itemToDelete]
            })
          )
      }),
      switchMap(([dialogResult, itemToDelete]) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(MCPServerDetailsActions.deleteMCPServerCancelled())
        }
        if (!itemToDelete?.id) {
          throw new Error('Item to delete not found!')
        }

        return this.mcpserverService.deleteMCPServerById(itemToDelete.id).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'MCPSERVER_DETAILS.DELETE.SUCCESS'
            })
            return MCPServerDetailsActions.deleteMCPServerSucceeded()
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'MCPSERVER_DETAILS.DELETE.ERROR'
            })
            return of(
              MCPServerDetailsActions.deleteMCPServerFailed({
                error
              })
            )
          })
        )
      })
    )
  })

  deleteMCPServerSucceeded$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(MCPServerDetailsActions.deleteMCPServerSucceeded),
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
      action: MCPServerDetailsActions.mCPServerDetailsLoadingFailed,
      key: 'MCPSERVER_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
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
      ofType(MCPServerDetailsActions.navigateBackButtonClicked),
      concatLatestFrom(() => [this.store.select(selectBackNavigationPossible)]),
      switchMap(([, backNavigationPossible]) => {
        if (!backNavigationPossible) {
          return of(MCPServerDetailsActions.backNavigationFailed())
        }
        window.history.back()
        return of(MCPServerDetailsActions.backNavigationStarted())
      })
    )
  })
}
