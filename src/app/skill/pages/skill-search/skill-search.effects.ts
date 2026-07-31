import { Injectable, inject } from '@angular/core'
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

import { CreateSkillRequest, Skill, SkillService, UpdateSkillRequest } from 'src/app/shared/generated'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import { SkillCreateUpdateComponent } from './dialogs/skill-create-update/skill-create-update.component'
import { skillSearchActions } from './skill-search.actions'
import { SkillSearchComponent } from './skill-search.component'
import { skillSearchCriteriasSchema } from './skill-search.parameters'
import { selectSkillSearchViewModel, skillSearchSelectors } from './skill-search.selectors'

@Injectable()
export class SkillSearchEffects {
  private readonly actions$ = inject(Actions)
  private readonly portalDialogService = inject(PortalDialogService)

  private readonly route = inject(ActivatedRoute)
  private readonly skillService = inject(SkillService)
  private readonly router = inject(Router)
  private readonly store = inject(Store)
  private readonly messageService = inject(PortalMessageService)
  private readonly exportDataService = inject(ExportDataService)

  syncParamsToUrl$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(skillSearchActions.searchButtonClicked, skillSearchActions.resetButtonClicked),
        concatLatestFrom(() => [this.store.select(skillSearchSelectors.selectCriteria), this.route.queryParams]),
        tap(([, criteria, queryParams]) => {
          const results = skillSearchCriteriasSchema.safeParse(queryParams)
          if (results.success && !equal(criteria, results.data)) {
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
        ofType(skillSearchActions.detailsButtonClicked),
        concatLatestFrom(() => this.store.select(selectUrl)),
        tap(([action, currentUrl]) => {
          const urlTree = this.router.parseUrl(currentUrl ?? '')
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
      ofType(skillSearchActions.createSkillSucceeded, skillSearchActions.updateSkillSucceeded),
      concatLatestFrom(() => this.store.select(skillSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  editButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(skillSearchActions.editSkillButtonClicked),
      concatLatestFrom(() => this.store.select(skillSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id)
      }),
      mergeMap((itemToEdit) => {
        return this.portalDialogService.openDialog<Skill | undefined>(
          'SKILL_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: SkillCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit
              }
            }
          },
          'SKILL_CREATE_UPDATE.UPDATE.FORM.SAVE',
          'SKILL_CREATE_UPDATE.UPDATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(skillSearchActions.updateSkillCancelled())
        }
        if (!dialogResult.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        if (!dialogResult.result.id || dialogResult.result.modificationCount == undefined) {
          throw new Error('Item id or modificationCount was not set as expected!')
        }
        const itemToEditId = dialogResult.result.id
        const itemToEdit: UpdateSkillRequest = {
          modificationCount: dialogResult.result.modificationCount,
          name: dialogResult.result.name,
          description: dialogResult.result.description,
          instruction: dialogResult.result.instruction
        }
        return this.skillService.updateSkillById(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'SKILL_CREATE_UPDATE.UPDATE.SUCCESS'
            })
            return skillSearchActions.updateSkillSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'SKILL_CREATE_UPDATE.UPDATE.ERROR'
        })
        return of(
          skillSearchActions.updateSkillFailed({
            error
          })
        )
      })
    )
  })

  createButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(skillSearchActions.createSkillButtonClicked),
      switchMap(() => {
        return this.portalDialogService.openDialog<Skill | undefined>(
          'SKILL_CREATE_UPDATE.CREATE.HEADER',
          {
            type: SkillCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: {}
              }
            }
          },
          'SKILL_CREATE_UPDATE.CREATE.FORM.SAVE',
          'SKILL_CREATE_UPDATE.CREATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(skillSearchActions.createSkillCancelled())
        }
        if (!dialogResult.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        const toCreateItem: CreateSkillRequest = {
          name: dialogResult.result.name,
          description: dialogResult.result.description,
          instruction: dialogResult.result.instruction
        }
        return this.skillService.createSkill(toCreateItem).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'SKILL_CREATE_UPDATE.CREATE.SUCCESS'
            })
            return skillSearchActions.createSkillSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'SKILL_CREATE_UPDATE.CREATE.ERROR'
        })
        return of(
          skillSearchActions.createSkillFailed({
            error
          })
        )
      })
    )
  })

  searchByUrl$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, SkillSearchComponent),
      filterOutQueryParamsHaveNotChanged(this.router, skillSearchCriteriasSchema, true),
      concatLatestFrom(() => this.store.select(skillSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  performSearch(searchCriteria: Record<string, string | number | boolean | Date | undefined>) {
    return this.skillService
      .findSkillByCriteria({
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
          skillSearchActions.skillSearchResultsReceived({
            stream: stream ?? [],
            size: size ?? 0,
            number: number ?? 0,
            totalElements: totalElements ?? 0,
            totalPages: totalPages ?? 0
          })
        ),
        catchError((error) =>
          of(
            skillSearchActions.skillSearchResultsLoadingFailed({
              error
            })
          )
        )
      )
  }

  exportData$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(skillSearchActions.exportButtonClicked),
        concatLatestFrom(() => this.store.select(selectSkillSearchViewModel)),
        map(([, viewModel]) => {
          this.exportDataService.exportCsv(
            viewModel.resultComponentState?.displayedColumns ?? [],
            viewModel.results,
            'export_skill.csv'
          )
        })
      )
    },
    { dispatch: false }
  )

  errorMessages: { action: Action; key: string }[] = [
    {
      action: skillSearchActions.skillSearchResultsLoadingFailed,
      key: 'SKILL_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
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
