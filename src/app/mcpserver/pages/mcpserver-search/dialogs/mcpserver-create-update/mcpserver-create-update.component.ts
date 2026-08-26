import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { FloatLabelModule } from 'primeng/floatlabel'
import { map } from 'rxjs'

import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/angular-accelerator'

import { Tool } from 'src/app/shared/generated'
import { McpserverCreateUpdateViewModel } from './mcpserver-create-update.viewmodel'

@Component({
  selector: 'app-mcpserver-create-update',
  imports: [InputTextModule, TranslateModule, FloatLabelModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mcpserver-create-update.component.html',
  styleUrls: ['./mcpserver-create-update.component.scss']
})
export class McpserverCreateUpdateComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Tool | undefined>,
    DialogButtonClicked<McpserverCreateUpdateComponent>,
    OnInit
{
  @Input() public vm: McpserverCreateUpdateViewModel = {
    itemToEdit: undefined
  }

  public formGroup: FormGroup

  // eslint-disable-next-line @typescript-eslint/consistent-generic-constructors
  primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()
  dialogResult: Tool | undefined = undefined

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
