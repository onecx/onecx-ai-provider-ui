import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { filterForNavigatedTo } from '@onecx/ngrx-accelerator'
import { PortalMessageService } from '@onecx/portal-integration-angular'
import { catchError, map, of, switchMap, tap } from 'rxjs'
import { selectRouteParam } from 'src/app/shared/selectors/router.selectors'
import { ProviderDetailsActions } from './provider-details.actions'
import { ProviderDetailsComponent } from './provider-details.component'
import { ProviderService } from 'src/app/shared/generated'

@Injectable()
export class ProviderDetailsEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly providerService: ProviderService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly messageService: PortalMessageService
  ) { }

  navigatedToDetailsPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, ProviderDetailsComponent),
      concatLatestFrom(() => this.store.select(selectRouteParam('id'))),
      map(([, id]) => {
        return ProviderDetailsActions.navigatedToDetailsPage({
          id
        })
      })
    )
  })

  loadProviderById$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProviderDetailsActions.navigatedToDetailsPage),
      switchMap(({ id }) =>
        this.providerService.getProvider(id ?? '').pipe(
          map((resource) =>
            ProviderDetailsActions.providerDetailsReceived({
              details: resource
            })
          ),
          catchError((error) =>
            of(
              ProviderDetailsActions.providerDetailsLoadingFailed({
                error
              })
            )
          )
        )
      )
    )
  })

  errorMessages: { action: Action; key: string }[] = [
    {
      action: ProviderDetailsActions.providerDetailsLoadingFailed,
      key: 'PROVIDER_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
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
