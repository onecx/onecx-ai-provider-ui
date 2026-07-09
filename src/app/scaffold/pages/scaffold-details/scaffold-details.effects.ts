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
import { Scaffold, ScaffoldService, SkillService, Tool, ToolService, UpdateScaffoldRequest } from '../../../shared/generated'
import { scaffoldDetailsActions } from './scaffold-details.actions'
import { ScaffoldDetailsComponent } from './scaffold-details.component'
import { scaffoldDetailsSelectors } from './scaffold-details.selectors'

type ScaffoldWithTools = Scaffold & { tools?: Tool[] }

@Injectable()
export class ScaffoldDetailsEffects {
  private readonly actions$ = inject(Actions)
  private readonly scaffoldService = inject(ScaffoldService)
  private readonly skillService = inject(SkillService)
  private readonly toolService = inject(ToolService)
  private readonly router = inject(Router)
  private readonly store = inject(Store)
  private readonly messageService = inject(PortalMessageService)
  private readonly portalDialogService = inject(PortalDialogService)

  navigatedToDetailsPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, ScaffoldDetailsComponent),
      concatLatestFrom(() => this.store.select(selectRouteParam('id'))),
      map(([, id]) => {
        return scaffoldDetailsActions.navigatedToDetailsPage({ id })
      })
    )
  })

  loadScaffoldById$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(scaffoldDetailsActions.navigatedToDetailsPage),
      switchMap(({ id }) => {
        if (!id) {
          return of(scaffoldDetailsActions.scaffoldDetailsLoadingFailedMissingId({ error: 'Missing ID' }))
        }
        return this.scaffoldService.getScaffoldById(id).pipe(
          map((resource) =>
            scaffoldDetailsActions.scaffoldDetailsReceived({
              details: resource
            })
          ),
          catchError((error) =>
            of(
              scaffoldDetailsActions.scaffoldDetailsLoadingFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  loadSkills$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(scaffoldDetailsActions.navigatedToDetailsPage),
      switchMap(() => {
        return this.skillService.findSkillByCriteria({}).pipe(
          map(({ stream }) =>
            scaffoldDetailsActions.scaffoldSkillsReceived({
              skills: stream ?? []
            })
          ),
          catchError((error) =>
            of(
              scaffoldDetailsActions.scaffoldSkillsLoadingFailed({
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
      ofType(scaffoldDetailsActions.navigatedToDetailsPage),
      switchMap(() => {
        return this.toolService.findToolByCriteria({}).pipe(
          map(({ stream }) =>
            scaffoldDetailsActions.scaffoldToolsReceived({
              tools: stream ?? []
            })
          ),
          catchError((error) =>
            of(
              scaffoldDetailsActions.scaffoldToolsLoadingFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  cancelButtonNotDirty$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(scaffoldDetailsActions.cancelButtonClicked),
      filter((action) => !action.dirty),
      map(() => {
        return scaffoldDetailsActions.cancelEditNotDirty()
      })
    )
  })

  cancelButtonClickedDirty$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(scaffoldDetailsActions.cancelButtonClicked),
      filter((action) => action.dirty),
      switchMap(() => {
        return this.portalDialogService.openDialog<Scaffold | undefined>(
          'SCAFFOLD_DETAILS.CANCEL.HEADER',
          'SCAFFOLD_DETAILS.CANCEL.MESSAGE',
          'SCAFFOLD_DETAILS.CANCEL.CONFIRM'
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(scaffoldDetailsActions.cancelEditBackClicked())
        }
        return of(scaffoldDetailsActions.cancelEditConfirmClicked())
      })
    )
  })

  saveButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(scaffoldDetailsActions.saveButtonClicked),
      concatLatestFrom(() => this.store.select(scaffoldDetailsSelectors.selectDetails)),
      switchMap(([action, details]) => {
        const itemToEditId = details?.id
        const updatedItem: ScaffoldWithTools = {
          ...details,
          ...action.details
        }

        if (!itemToEditId) {
          return of(scaffoldDetailsActions.updateScaffoldCancelled())
        }
        const itemToEdit: UpdateScaffoldRequest = {
          modificationCount: updatedItem.modificationCount ?? 0,
          name: updatedItem.name,
          systemPrompt: updatedItem.systemPrompt,
          sourceProduct: updatedItem.sourceProduct,
          skills: updatedItem.skills,
          ...(updatedItem.tools ? { tools: updatedItem.tools } : {})
        }
        return this.scaffoldService.updateScaffoldById(itemToEditId, itemToEdit).pipe(
          map((response) => {
            this.messageService.success({
              summaryKey: 'SCAFFOLD_DETAILS.UPDATE.SUCCESS'
            })
            return scaffoldDetailsActions.updateScaffoldSucceeded({
              details: { ...response, ...(updatedItem.tools ? { tools: updatedItem.tools } : {}) }
            })
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'SCAFFOLD_DETAILS.UPDATE.ERROR'
            })
            return of(
              scaffoldDetailsActions.updateScaffoldFailed({
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
      ofType(scaffoldDetailsActions.deleteButtonClicked),
      concatLatestFrom(() => this.store.select(scaffoldDetailsSelectors.selectDetails)),
      mergeMap(([, itemToDelete]) => {
        return this.portalDialogService
          .openDialog<unknown>(
            'SCAFFOLD_DETAILS.DELETE.HEADER',
            'SCAFFOLD_DETAILS.DELETE.MESSAGE',
            {
              key: 'SCAFFOLD_DETAILS.DELETE.CONFIRM',
              icon: PrimeIcons.CHECK
            },
            {
              key: 'SCAFFOLD_DETAILS.DELETE.CANCEL',
              icon: PrimeIcons.TIMES
            }
          )
          .pipe(
            map((state): [DialogState<unknown>, Scaffold | undefined] => {
              return [state, itemToDelete]
            })
          )
      }),
      switchMap(([dialogResult, itemToDelete]) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(scaffoldDetailsActions.deleteScaffoldCancelled())
        }
        if (!itemToDelete || !itemToDelete.id) {
          throw new Error('Item to delete not found!')
        }

        return this.scaffoldService.deleteScaffoldById(itemToDelete.id).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'SCAFFOLD_DETAILS.DELETE.SUCCESS'
            })
            return scaffoldDetailsActions.deleteScaffoldSucceeded()
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'SCAFFOLD_DETAILS.DELETE.ERROR'
            })
            return of(
              scaffoldDetailsActions.deleteScaffoldFailed({
                error
              })
            )
          })
        )
      })
    )
  })

  deleteScaffoldSucceeded$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(scaffoldDetailsActions.deleteScaffoldSucceeded),
        concatLatestFrom(() => this.store.select(selectUrl)),
        tap(([, currentUrl]) => {
          const urlTree = this.router.parseUrl(currentUrl as string)
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
      action: scaffoldDetailsActions.scaffoldDetailsLoadingFailed,
      key: 'SCAFFOLD_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
    },
    {
      action: scaffoldDetailsActions.scaffoldSkillsLoadingFailed,
      key: 'SCAFFOLD_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
    },
    {
      action: scaffoldDetailsActions.scaffoldToolsLoadingFailed,
      key: 'SCAFFOLD_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
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
      ofType(scaffoldDetailsActions.navigateBackButtonClicked),
      concatLatestFrom(() => [this.store.select(selectBackNavigationPossible)]),
      switchMap(([, backNavigationPossible]) => {
        if (!backNavigationPossible) {
          return of(scaffoldDetailsActions.backNavigationFailed())
        }
        globalThis.history.back()
        return of(scaffoldDetailsActions.backNavigationStarted())
      })
    )
  })
}
