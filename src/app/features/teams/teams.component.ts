/**
 * Displays the user's saved Pokémon team,
 * showing selected members, their stats, and allowing basic
 * actions like viewing details or managing the lineup.
*/

import { Component, inject } from '@angular/core';
import { TrainerStore } from '../../state/trainer.store';
import { toSignal } from '@angular/core/rxjs-interop';
import { Team } from '../../interface/team.model';

@Component({
  selector: 'app-teams',
  standalone: true,
  templateUrl: './teams.component.html'
})
export class TeamsComponent {

  private store = inject(TrainerStore);

  teams = toSignal(this.store.teams$, { initialValue: [] as Team[] });

  deleteTeam(id: number) {
    this.store.deleteTeam(id);
  }

  editTeam(team: Team) {
    const updated: Team = {
      ...team,
      name: prompt('New team name', team.name) || team.name
    };

    this.store.updateTeam(updated);
  }
}