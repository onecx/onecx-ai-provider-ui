import { Component, EventEmitter, Input, OnInit } from '@angular/core'
import {
  AngularAcceleratorModule,
  DialogButtonClicked,
  DialogPrimaryButtonDisabled,
  DialogResult
} from '@onecx/angular-accelerator'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { map } from 'rxjs'
import { Configuration } from 'src/app/shared/generated'
import { ConfigurationCreateUpdateViewModel } from './configuration-create-update.viewmodel'
import { TranslateModule } from '@ngx-translate/core'
import { CommonModule } from '@angular/common'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'
import { FloatLabelModule } from 'primeng/floatlabel'

@Component({
  selector: 'app-configuration-create-update',
  templateUrl: './configuration-create-update.component.html',
  styleUrls: ['./configuration-create-update.component.scss'],
  imports: [
    AngularAcceleratorModule,
    CommonModule,
    TranslateModule,
    FormsModule,
    FloatLabelModule,
    ReactiveFormsModule,
    InputTextModule,
    TooltipModule
  ]
})
export class ConfigurationCreateUpdateComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Configuration | undefined>,
    DialogButtonClicked<ConfigurationCreateUpdateComponent>,
    OnInit
{
  @Input() public vm: ConfigurationCreateUpdateViewModel = {
    itemToEdit: undefined
  }

  public formGroup: FormGroup

  primaryButtonEnabled = new EventEmitter<boolean>()
  dialogResult: Configuration | undefined = undefined

  constructor() {
    this.formGroup = new FormGroup({
      name: new FormControl(null, [Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.maxLength(255)])
    })
    this.formGroup.statusChanges
      .pipe(
        map((status) => {
          return status === 'VALID'
        })
      )
      .subscribe(this.primaryButtonEnabled)
  }

  ocxDialogButtonClicked() {
    this.dialogResult = {
      ...this.vm.itemToEdit,
      ...this.formGroup.value
    }
  }

  ngOnInit() {
    if (this.vm.itemToEdit) {
      this.formGroup.patchValue({
        name: this.vm.itemToEdit.name,
        description: this.vm.itemToEdit.description
      })
    }
  }
}
