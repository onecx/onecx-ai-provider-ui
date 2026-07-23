import { Component, EventEmitter, Input, OnInit } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { map } from 'rxjs'

import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/angular-accelerator'

import { Scaffold, Skill } from 'src/app/shared/generated'
import { ScaffoldCreateUpdateViewModel } from './scaffold-create-update.viewmodel'

@Component({
  selector: 'app-scaffold-create-update',
  templateUrl: './scaffold-create-update.component.html',
  styleUrls: ['./scaffold-create-update.component.scss'],
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class ScaffoldCreateUpdateComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Scaffold | undefined>,
    DialogButtonClicked<ScaffoldCreateUpdateComponent>,
    OnInit
{
  @Input() public vm: ScaffoldCreateUpdateViewModel = {
    itemToEdit: undefined,
    skills: []
  }

  public formGroup: FormGroup

  // eslint-disable-next-line @typescript-eslint/consistent-generic-constructors
  primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()
  dialogResult: Scaffold | undefined = undefined

  constructor() {
    this.formGroup = new FormGroup({
      name: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      systemPrompt: new FormControl(null, [Validators.maxLength(4000)]),
      skills: new FormControl<Skill[]>([])
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
        ...this.vm.itemToEdit,
        skills: this.vm.itemToEdit.skills ?? []
      })
    }
  }
}
