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
import { Skill, SkillService, UpdateSkillRequest } from '../../../shared/generated'
import { skillDetailsActions } from './skill-details.actions'
import { SkillDetailsComponent } from './skill-details.component'
import { skillDetailsSelectors } from './skill-details.selectors'

@Injectable()
export class SkillDetailsEffects {
  private readonly actions$ = inject(Actions)
  private readonly skillService = inject(SkillService)
  private readonly router = inject(Router)
  private readonly store = inject(Store)
  private readonly messageService = inject(PortalMessageService)
  private readonly portalDialogService = inject(PortalDialogService)

  navigatedToDetailsPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, SkillDetailsComponent),
      concatLatestFrom(() => this.store.select(selectRouteParam('id'))),
      map(([, id]) => {
        return skillDetailsActions.navigatedToDetailsPage({ id })
      })
    )
  })

  loadSkillById$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(skillDetailsActions.navigatedToDetailsPage),
      switchMap(({ id }) => {
        if (!id) {
          return of(skillDetailsActions.skillDetailsLoadingFailedMissingId({ error: 'Missing ID' }))
        }
        return this.skillService.getSkillById(id).pipe(
          map((resource) =>
            skillDetailsActions.skillDetailsReceived({
              details: resource
            })
          ),
          catchError((error) =>
            of(
              skillDetailsActions.skillDetailsLoadingFailed({
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
      ofType(skillDetailsActions.cancelButtonClicked),
      filter((action) => !action.dirty),
      map(() => {
        return skillDetailsActions.cancelEditNotDirty()
      })
    )
  })

  cancelButtonClickedDirty$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(skillDetailsActions.cancelButtonClicked),
      filter((action) => action.dirty),
      switchMap(() => {
        return this.portalDialogService.openDialog<Skill | undefined>(
          'SKILL_DETAILS.CANCEL.HEADER',
          'SKILL_DETAILS.CANCEL.MESSAGE',
          'SKILL_DETAILS.CANCEL.CONFIRM'
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(skillDetailsActions.cancelEditBackClicked())
        }
        return of(skillDetailsActions.cancelEditConfirmClicked())
      })
    )
  })

  saveButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(skillDetailsActions.saveButtonClicked),
      concatLatestFrom(() => this.store.select(skillDetailsSelectors.selectDetails)),
      switchMap(([action, details]) => {
        const itemToEditId = details?.id
        const updatedItem = {
          ...details,
          ...action.details
        }

        if (!itemToEditId) {
          return of(skillDetailsActions.updateSkillCancelled())
        }
        const itemToEdit: UpdateSkillRequest = {
          modificationCount: details?.modificationCount ?? 0,
          name: updatedItem.name,
          description: updatedItem.description,
          instruction: updatedItem.instruction
        }
        return this.skillService.updateSkillById(itemToEditId, itemToEdit).pipe(
          map((details) => {
            this.messageService.success({
              summaryKey: 'SKILL_DETAILS.UPDATE.SUCCESS'
            })
            return skillDetailsActions.updateSkillSucceeded({
              details
            })
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'SKILL_DETAILS.UPDATE.ERROR'
            })
            return of(
              skillDetailsActions.updateSkillFailed({
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
      ofType(skillDetailsActions.deleteButtonClicked),
      concatLatestFrom(() => this.store.select(skillDetailsSelectors.selectDetails)),
      mergeMap(([, itemToDelete]) => {
        return this.portalDialogService
          .openDialog<unknown>(
            'SKILL_DETAILS.DELETE.HEADER',
            'SKILL_DETAILS.DELETE.MESSAGE',
            {
              key: 'SKILL_DETAILS.DELETE.CONFIRM',
              icon: PrimeIcons.CHECK
            },
            {
              key: 'SKILL_DETAILS.DELETE.CANCEL',
              icon: PrimeIcons.TIMES
            }
          )
          .pipe(
            map((state): [DialogState<unknown>, Skill | undefined] => {
              return [state, itemToDelete]
            })
          )
      }),
      switchMap(([dialogResult, itemToDelete]) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(skillDetailsActions.deleteSkillCancelled())
        }
        if (!itemToDelete?.id) {
          throw new Error('Item to delete not found!')
        }

        return this.skillService.deleteSkillById(itemToDelete.id).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'SKILL_DETAILS.DELETE.SUCCESS'
            })
            return skillDetailsActions.deleteSkillSucceeded()
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'SKILL_DETAILS.DELETE.ERROR'
            })
            return of(
              skillDetailsActions.deleteSkillFailed({
                error
              })
            )
          })
        )
      })
    )
  })

  deleteSkillSucceeded$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(skillDetailsActions.deleteSkillSucceeded),
        concatLatestFrom(() => this.store.select(selectUrl)),
        tap(([, currentUrl]) => {
          const urlTree = this.router.parseUrl(currentUrl ?? '')
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
      action: skillDetailsActions.skillDetailsLoadingFailed,
      key: 'SKILL_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
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
      ofType(skillDetailsActions.navigateBackButtonClicked),
      concatLatestFrom(() => [this.store.select(selectBackNavigationPossible)]),
      switchMap(([, backNavigationPossible]) => {
        if (!backNavigationPossible) {
          return of(skillDetailsActions.backNavigationFailed())
        }
        globalThis.history.back()
        return of(skillDetailsActions.backNavigationStarted())
      })
    )
  })
}
