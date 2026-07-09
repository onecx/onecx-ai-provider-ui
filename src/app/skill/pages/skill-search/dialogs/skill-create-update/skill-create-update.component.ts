import { Component, EventEmitter, Input, OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { map } from 'rxjs'

import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/angular-accelerator'

import { Skill } from 'src/app/shared/generated'
import { SkillCreateUpdateViewModel } from './skill-create-update.viewmodel'

@Component({
  selector: 'app-skill-create-update',
  templateUrl: './skill-create-update.component.html',
  styleUrls: ['./skill-create-update.component.scss'],
  imports: [TranslateModule, ReactiveFormsModule, FloatLabelModule, InputTextModule]
})
export class SkillCreateUpdateComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Skill | undefined>,
    DialogButtonClicked<SkillCreateUpdateComponent>,
    OnInit
{
  @Input() public vm: SkillCreateUpdateViewModel = {
    itemToEdit: undefined
  }

  public formGroup: FormGroup

  // eslint-disable-next-line @typescript-eslint/consistent-generic-constructors
  primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()
  dialogResult: Skill | undefined = undefined

  constructor() {
    this.formGroup = new FormGroup({
      name: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
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
        ...this.vm.itemToEdit
      })
    }
  }
}
