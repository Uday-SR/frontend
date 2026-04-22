import {
  Component,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { TrainerStore } from '../../state/trainer.store';

/**
 * Displays and manages trainer details,
 * including profile info, stats, achievements, and progress history.
*/

@Component({
  selector: 'app-trainer-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trainer-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainerProfileComponent {

  private store = inject(TrainerStore);

  trainer = toSignal(this.store.trainer$, { initialValue: null });

  constructor() {
    this.store.loadTrainer(1);
  }
}