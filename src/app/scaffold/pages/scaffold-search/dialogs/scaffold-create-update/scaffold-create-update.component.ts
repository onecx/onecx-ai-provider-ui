import { Component, EventEmitter, Input, OnInit } from '@angular/core'
import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/angular-accelerator'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { map } from 'rxjs'
import { Scaffold } from 'src/app/shared/generated'
import { ScaffoldCreateUpdateViewModel } from './scaffold-create-update.viewmodel'
import { TranslateModule } from '@ngx-translate/core'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { TextareaModule } from 'primeng/textarea'

@Component({
  selector: 'app-scaffold-create-update',
  templateUrl: './scaffold-create-update.component.html',
  styleUrls: ['./scaffold-create-update.component.scss'],
  imports: [TranslateModule, ReactiveFormsModule, FloatLabelModule, InputTextModule, TextareaModule]
})
export class ScaffoldCreateUpdateComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Scaffold | undefined>,
    DialogButtonClicked<ScaffoldCreateUpdateComponent>,
    OnInit
{
  @Input() public vm: ScaffoldCreateUpdateViewModel = {
    itemToEdit: undefined
  }

  public formGroup: FormGroup

  primaryButtonEnabled = new EventEmitter<boolean>()
  dialogResult: Scaffold | undefined = undefined

  constructor() {
    this.formGroup = new FormGroup({
      name: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      systemPrompt: new FormControl(null, [Validators.maxLength(4096)]),
      sourceProduct: new FormControl(null, [Validators.maxLength(255)])
    })
    this.formGroup.statusChanges
      .pipe(map((status) => status === 'VALID'))
      .subscribe(value => this.primaryButtonEnabled.emit(value))
  }

  ocxDialogButtonClicked() {
    const formValue = this.formGroup.getRawValue()
    this.dialogResult = {
        ...this.vm.itemToEdit,
        ...formValue
      }
  }

  ngOnInit() {
    if (this.vm.itemToEdit) {
      this.formGroup.patchValue({ ...this.vm.itemToEdit })
    }

    if (this.vm.itemToEdit?.sourceProduct) {
      this.formGroup.get('sourceProduct')!.disable()
    }
  }
}
