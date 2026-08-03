import { Component, EventEmitter, Input, OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { map } from 'rxjs'

import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/angular-accelerator'

import { Provider } from 'src/app/shared/generated'
import { ProviderCreateUpdateViewModel } from './provider-create-update.viewmodel'

@Component({
  selector: 'app-provider-create-update',
  imports: [TranslateModule, ReactiveFormsModule, FloatLabelModule, InputTextModule],
  templateUrl: './provider-create-update.component.html',
  styleUrls: ['./provider-create-update.component.scss']
})
export class ProviderCreateUpdateComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Provider | undefined>,
    DialogButtonClicked<ProviderCreateUpdateComponent>,
    OnInit
{
  @Input() public vm: ProviderCreateUpdateViewModel = {
    itemToEdit: undefined
  }

  public formGroup: FormGroup

  primaryButtonEnabled = new EventEmitter<boolean>()
  dialogResult: Provider | undefined = undefined

  constructor() {
    this.formGroup = new FormGroup({
      name: new FormControl(null, [Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.maxLength(255)]),
      modelName: new FormControl(null, [Validators.maxLength(255)]),
      llmUrl: new FormControl(null, [Validators.maxLength(255)]),
      apiKey: new FormControl(null, [Validators.maxLength(255)])
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
        ...this.vm.itemToEdit
      })
    }
  }
}
