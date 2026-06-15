import { Component, OnInit } from '@angular/core'
import { Store } from '@ngrx/store'
import { TranslateModule } from '@ngx-translate/core'
import { Action, AngularAcceleratorModule, BreadcrumbService } from '@onecx/angular-accelerator'
import { map, Observable } from 'rxjs'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { PrimeIcons } from 'primeng/api'
import { ScaffoldDetailsActions } from './scaffold-details.actions'
import { selectScaffoldDetailsViewModel } from './scaffold-details.selectors'
import { ScaffoldDetailsViewModel } from './scaffold-details.viewmodel'
import { CommonModule } from '@angular/common'
import { PortalPageComponent } from '@onecx/angular-utils'
import { FloatLabelModule } from 'primeng/floatlabel'
import { LetDirective } from '@ngrx/component'
import { InputTextModule } from 'primeng/inputtext'
import { TextareaModule } from 'primeng/textarea'

@Component({
  selector: 'app-scaffold-details',
  templateUrl: './scaffold-details.component.html',
  styleUrls: ['./scaffold-details.component.scss'],
  imports: [
    AngularAcceleratorModule,
    CommonModule,
    LetDirective,
    FloatLabelModule,
    TranslateModule,
    ReactiveFormsModule,
    PortalPageComponent,
    InputTextModule,
    TextareaModule
  ]
})
export class ScaffoldDetailsComponent implements OnInit {
  viewModel$!: Observable<ScaffoldDetailsViewModel>
    headerActions$!: Observable<Action[]>
    public formGroup: FormGroup

    constructor(
    private readonly store: Store,
    private readonly breadcrumbService: BreadcrumbService
    ) {
      this.formGroup = new FormGroup({
        name: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
        sourceProduct: new FormControl(null, [Validators.maxLength(255)]),
        systemPrompt: new FormControl(null, [Validators.maxLength(4096)])
      })
      this.formGroup.disable()
    }

    ngOnInit(): void {
      this.viewModel$ = this.store.select(selectScaffoldDetailsViewModel)
      
      this.headerActions$ = this.viewModel$.pipe(
        map((vm) => {
          const actions: Action[] = [
            {
              titleKey: 'SCAFFOLD_DETAILS.GENERAL.BACK',
              labelKey: 'SCAFFOLD_DETAILS.GENERAL.BACK',
              show: 'always',
              icon: PrimeIcons.ARROW_LEFT,
              conditional: true,
              showCondition: !vm.editMode,
              actionCallback: () => {
                globalThis.history.back()
              }
            },
            {
              titleKey: 'SCAFFOLD_DETAILS.GENERAL.EDIT',
              labelKey: 'SCAFFOLD_DETAILS.GENERAL.EDIT',
              show: 'always',
              icon: PrimeIcons.PENCIL,
              conditional: true,
              showCondition: !vm.editMode,
              actionCallback: () => {
                this.toggleEditMode(true)
              }
            },
            {
              titleKey: 'SCAFFOLD_DETAILS.GENERAL.CANCEL',
              labelKey: 'SCAFFOLD_DETAILS.GENERAL.CANCEL',
              show: 'always',
              icon: PrimeIcons.TIMES,
              conditional: true,
              showCondition: vm.editMode,
              actionCallback: () => {
                this.toggleEditMode(false)
              }
            },
            {
              titleKey: 'SCAFFOLD_DETAILS.GENERAL.SAVE',
              labelKey: 'SCAFFOLD_DETAILS.GENERAL.SAVE',
              show: 'always',
              icon: PrimeIcons.SAVE,
              conditional: true,
              showCondition: vm.editMode,
              actionCallback: () => {
                this.edit(vm.details?.id ?? '')
              }
            },
            {
              titleKey: 'SCAFFOLD_DETAILS.GENERAL.DELETE',
              labelKey: 'SCAFFOLD_DETAILS.GENERAL.DELETE',
              icon: PrimeIcons.TRASH,
              show: 'asOverflow',
              btnClass: '',
              conditional: true,
              showCondition: !vm.editMode,
              actionCallback: () => {
                this.delete(vm.details?.id ?? '')
              }
            }
          ]
          return actions
        })
      )

    this.viewModel$.subscribe((vm) => {
      this.formGroup.patchValue({
        name: vm.details?.name ?? '',
        sourceProduct: vm.details?.sourceProduct ?? '',
        systemPrompt: vm.details?.systemPrompt ?? ''
      })
    })
    this.formGroup.disable()

    this.breadcrumbService.setItems([
      {
        titleKey: 'SCAFFOLD_DETAILS.BREADCRUMB',
        labelKey: 'SCAFFOLD_DETAILS.BREADCRUMB',
        routerLink: '/scaffold'
      }
    ])
  }

  edit(id: string) {
    this.store.dispatch(ScaffoldDetailsActions.editScaffoldButtonClicked({ id }))
  }

  delete(id: string) {
    this.store.dispatch(ScaffoldDetailsActions.deleteScaffoldButtonClicked({ id }))
  }

  toggleEditMode(value: boolean) {
    this.store.dispatch(
      ScaffoldDetailsActions.scaffoldDetailsEditModeSet({ editMode: value })
    )
    if (value) {
      this.formGroup.enable()
      
      this.viewModel$.subscribe((vm) => {
        if (vm.details?.sourceProduct) {
          this.formGroup.get('sourceProduct')!.disable()
        } else {
          this.formGroup.get('sourceProduct')!.enable()
        }
      })
    } else {
      this.formGroup.disable()
    }
  }
}
