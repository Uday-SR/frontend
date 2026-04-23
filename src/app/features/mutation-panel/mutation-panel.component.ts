/**
 * Handles UI and logic for applying
 * and previewing Pokémon mutations, including stat changes,
 * type changes, and transformation effects.
*/

import { Component, inject } from '@angular/core';
import { TrainerStore } from '../../state/trainer.store';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mutations-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mutation-panel.component.html'
})
export class MutationsPanelComponent {

  private store = inject(TrainerStore);

  // TRAINER
  trainerName = '';
  region = '';

  // TEAM
  teamName = '';

  // BATTLE
  opponent = '';

  updateTrainer() {
    const trainer = {
      id: 1,
      name: this.trainerName,
      region: this.region,
      badge_count: 3
    };

    //this.store.updateTrainer(trainer);
  }

  createTeam() {
    this.store.createTeam({
      id: 0,
      name: this.teamName,
      trainer_id: 1,
      pokemon_ids: [],
      created_at: new Date().toISOString()
    });
  }

  logBattle() {
    this.store.createBattle({
      id: 0,
      trainer_id: 1,
      team_id: 1,
      opponent_name: this.opponent,
      result: 'win',
      date: new Date().toISOString(),
      score_trainer: 3,
      score_opponent: 1
    });
  }
}