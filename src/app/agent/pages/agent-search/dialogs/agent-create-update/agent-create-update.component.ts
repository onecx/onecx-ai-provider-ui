import { Component, EventEmitter, Input, OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { SelectModule } from 'primeng/select'
import { map } from 'rxjs'

import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/angular-accelerator'

import { Agent, AgentStatus } from 'src/app/shared/generated'
import { AgentCreateUpdateViewModel } from './agent-create-update.viewmodel'

@Component({
  selector: 'app-agent-create-update',
  imports: [TranslateModule, ReactiveFormsModule, FloatLabelModule, InputTextModule, SelectModule],
  templateUrl: './agent-create-update.component.html',
  styleUrls: ['./agent-create-update.component.scss']
})
export class AgentCreateUpdateComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Agent | undefined>,
    DialogButtonClicked<AgentCreateUpdateComponent>,
    OnInit
{
  @Input() public vm: AgentCreateUpdateViewModel = {
    itemToEdit: undefined
  }

  public formGroup: FormGroup
  public readonly statusOptions = Object.values(AgentStatus)

  primaryButtonEnabled = new EventEmitter<boolean>()
  dialogResult: Agent | undefined = undefined

  constructor() {
    this.formGroup = new FormGroup({
      name: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.maxLength(255)]),
      status: new FormControl(AgentStatus.Draft, [Validators.required])
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
        description: this.vm.itemToEdit.description,
        status: this.vm.itemToEdit.status ?? AgentStatus.Draft
      })
    }
  }
}
