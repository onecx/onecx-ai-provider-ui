import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { filterForNavigatedTo } from '@onecx/ngrx-accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { catchError, map, of, switchMap, tap } from 'rxjs'
import { selectRouteParam } from 'src/app/shared/selectors/router.selectors'
import { ScaffoldService, UpdateScaffoldRequest } from 'src/app/shared/generated'
import { ScaffoldDetailsActions } from './scaffold-details.actions'
import { ScaffoldDetailsComponent } from './scaffold-details.component'
import { scaffoldDetailsSelectors } from './scaffold-details.selectors'

@Injectable()
export class ScaffoldDetailsEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly scaffoldService: ScaffoldService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly messageService: PortalMessageService
  ) {}

  navigatedToDetailsPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, ScaffoldDetailsComponent),
      concatLatestFrom(() => this.store.select(selectRouteParam('id'))),
      map(([, id]) => ScaffoldDetailsActions.navigatedToDetailsPage({ id }))
    )
  })

  loadScaffoldById$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ScaffoldDetailsActions.navigatedToDetailsPage),
      switchMap(({ id }) =>
        this.scaffoldService.getScaffoldById(id ?? '').pipe(
          map((resource) => ScaffoldDetailsActions.scaffoldDetailsReceived({ details: resource })),
          catchError((error) => of(ScaffoldDetailsActions.scaffoldDetailsLoadingFailed({ error })))
        )
      )
    )
  })

  editButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ScaffoldDetailsActions.editScaffoldButtonClicked),
      concatLatestFrom(() =>
        this.store.select(scaffoldDetailsSelectors.selectDetails)
      ),
      map(([action, details]) => {
        if (!details || details.id !== action.id) {
          throw new Error('Item to update not found!')
        }
        return details
      }),
      switchMap((result) => {
        const itemToEditId = result.id ?? ''
        const itemToEdit = { ...result } as UpdateScaffoldRequest
        return this.scaffoldService.updateScaffoldById(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'SCAFFOLD_CREATE_UPDATE.UPDATE.SUCCESS'
            })
            return ScaffoldDetailsActions.updateScaffoldSucceeded()
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'SCAFFOLD_CREATE_UPDATE.UPDATE.ERROR'
            })
            return of(ScaffoldDetailsActions.updateScaffoldFailed({ error }))
          })
        )
      })
    )
  })

  deleteButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ScaffoldDetailsActions.deleteButtonClicked),
      concatLatestFrom(() =>
        this.store.select(scaffoldDetailsSelectors.selectDetails)
      ),
      switchMap(([, details]) => {
        if (!details?.id) {
          return of(
            ScaffoldDetailsActions.deleteScaffoldFailed({
              error: 'Missing id'
            })
          )
        }

        return this.scaffoldService.deleteScaffoldById(details.id).pipe(
          map(() => ScaffoldDetailsActions.deleteScaffoldSucceeded()),
          catchError((error) =>
            of(ScaffoldDetailsActions.deleteScaffoldFailed({ error }))
          )
        )
      })
    )
  })
  
  errorMessages: { action: Action; key: string }[] = [
    {
      action: ScaffoldDetailsActions.scaffoldDetailsLoadingFailed,
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
}
