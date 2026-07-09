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
import { ProviderDetailsActions } from './provider-details.actions'
import { ProviderDetailsComponent } from './provider-details.component'
import { ModelService, ProviderService, UpdateProviderRequest } from 'src/app/shared/generated'
import { ProviderDetailsSelectors } from './provider-details.selectors'

@Injectable()
export class ProviderDetailsEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly providerService: ProviderService,
    private readonly modelService: ModelService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly messageService: PortalMessageService
  ) {}

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

  loadProviderModelsOnNavigation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProviderDetailsActions.navigatedToDetailsPage),
      map(({ id }) =>
        ProviderDetailsActions.providerModelsLoadRequested({
          providerId: id
        })
      )
    )
  })

  loadProviderModels$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProviderDetailsActions.providerModelsLoadRequested),
      switchMap(({ providerId }) => {
        if (!providerId) {
          return of(
            ProviderDetailsActions.providerModelsLoadingFailed({
              error: 'Missing provider id'
            })
          )
        }
        return this.modelService.findModelByCriteria({ providerId }).pipe(
          map(({ stream }) =>
            ProviderDetailsActions.providerModelsReceived({
              models: stream ?? []
            })
          ),
          catchError((error) =>
            of(
              ProviderDetailsActions.providerModelsLoadingFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  updateProvider$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProviderDetailsActions.providerUpdateRequested),
      concatLatestFrom(() => this.store.select(ProviderDetailsSelectors.selectDetails)),
      switchMap(([{ details }, existingDetails]) => {
        const providerId = existingDetails?.id
        if (!providerId) {
          return of(
            ProviderDetailsActions.providerUpdateFailed({
              error: 'Missing provider id'
            })
          )
        }
        const updateRequest: UpdateProviderRequest = {
          modificationCount: existingDetails.modificationCount ?? 0,
          name: details.name,
          description: details.description,
          type: details.type,
          llmUrl: details.llmUrl,
          apiKey: details.apiKey,
          authMode: details.authMode
        }
        return this.providerService.updateProvider(providerId, updateRequest).pipe(
          map((resource) =>
            ProviderDetailsActions.providerUpdateSucceeded({
              details: resource
            })
          ),
          catchError((error) =>
            of(
              ProviderDetailsActions.providerUpdateFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  createProviderModel$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProviderDetailsActions.providerModelCreateClicked),
      concatLatestFrom(() => this.store.select(ProviderDetailsSelectors.selectDetails)),
      switchMap(([{ modelIdentifier }, details]) => {
        if (!details?.id) {
          return of(
            ProviderDetailsActions.providerModelCreateFailed({
              error: 'Missing provider id'
            })
          )
        }

        return this.modelService
          .createModel({
            name: modelIdentifier,
            modelIdentifier,
            provider: details
          })
          .pipe(
            map(() => ProviderDetailsActions.providerModelCreateSucceeded()),
            catchError((error) =>
              of(
                ProviderDetailsActions.providerModelCreateFailed({
                  error
                })
              )
            )
          )
      })
    )
  })

  deleteProviderModel$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProviderDetailsActions.providerModelDeleteClicked),
      switchMap(({ modelId }) => {
        return this.modelService.deleteModelById(modelId).pipe(
          map(() => ProviderDetailsActions.providerModelDeleteSucceeded()),
          catchError((error) =>
            of(
              ProviderDetailsActions.providerModelDeleteFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  refreshModelsAfterMutation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProviderDetailsActions.providerModelCreateSucceeded, ProviderDetailsActions.providerModelDeleteSucceeded),
      concatLatestFrom(() => this.store.select(ProviderDetailsSelectors.selectDetails)),
      map(([, details]) =>
        ProviderDetailsActions.providerModelsLoadRequested({
          providerId: details?.id
        })
      )
    )
  })

  displaySuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        tap((action) => {
          if (action.type === ProviderDetailsActions.providerUpdateSucceeded.type) {
            this.messageService.success({ summaryKey: 'PROVIDER_DETAILS.SUCCESS_MESSAGES.UPDATE_SUCCEEDED' })
          }
          if (action.type === ProviderDetailsActions.providerModelCreateSucceeded.type) {
            this.messageService.success({ summaryKey: 'PROVIDER_DETAILS.SUCCESS_MESSAGES.MODEL_CREATE_SUCCEEDED' })
          }
          if (action.type === ProviderDetailsActions.providerModelDeleteSucceeded.type) {
            this.messageService.success({ summaryKey: 'PROVIDER_DETAILS.SUCCESS_MESSAGES.MODEL_DELETE_SUCCEEDED' })
          }
        })
      )
    },
    { dispatch: false }
  )

  errorMessages: { action: Action; key: string }[] = [
    {
      action: ProviderDetailsActions.providerDetailsLoadingFailed,
      key: 'PROVIDER_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
    },
    {
      action: ProviderDetailsActions.providerUpdateFailed,
      key: 'PROVIDER_DETAILS.ERROR_MESSAGES.UPDATE_FAILED'
    },
    {
      action: ProviderDetailsActions.providerModelsLoadingFailed,
      key: 'PROVIDER_DETAILS.ERROR_MESSAGES.MODELS_LOADING_FAILED'
    },
    {
      action: ProviderDetailsActions.providerModelCreateFailed,
      key: 'PROVIDER_DETAILS.ERROR_MESSAGES.MODEL_CREATE_FAILED'
    },
    {
      action: ProviderDetailsActions.providerModelDeleteFailed,
      key: 'PROVIDER_DETAILS.ERROR_MESSAGES.MODEL_DELETE_FAILED'
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
