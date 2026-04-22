import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';

import {
  FormBuilder,
  Validators,
  FormArray,
  ReactiveFormsModule,
  AsyncValidatorFn,
  AbstractControl
} from '@angular/forms';

import {
  debounceTime,
  map,
  take,
  of
} from 'rxjs';

import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { TrainerStore } from '../../state/trainer.store';
import { PokemonStore } from '../../state/pokemon.store';
import { selectPokemonSearch } from '../../state/pokemon.selectors';

/**
 * Handles creating and managing a Pokémon team,
 * including adding/removing Pokémon, validating team rules,
 * and storing the selected lineup for battles.
 */

@Component({
  selector: 'app-team-builder',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './team-builder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamBuilderComponent {

  private fb = inject(FormBuilder);
  public trainerStore = inject(TrainerStore);
  private pokemonStore = inject(PokemonStore);

  // SIGNALS

  search = signal('');
  competitiveMode = signal(false);

  // FORM

  form = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(30)],
      [this.uniqueNameValidator()]
    ],
    pokemon: this.fb.array([], [
      Validators.minLength(1),
      Validators.maxLength(6)
    ]),
    competitive: [false],
    tier: ['OU']
  });

  get pokemonArray(): FormArray {
    return this.form.get('pokemon') as FormArray;
  }

  // AUTOCOMPLETE

  debouncedSearch$ = toObservable(this.search).pipe(
    debounceTime(300)
  );

  filteredPokemon$ = selectPokemonSearch(
    this.pokemonStore.pokemon$,
    this.debouncedSearch$
  );

  filteredPokemon = toSignal(this.filteredPokemon$, { initialValue: [] });

  suggestions = computed(() =>
    this.filteredPokemon()
      .slice(0, 8)
      .filter(p =>
        !this.pokemonArray.value.some((s: any) => s.id === p.id)
      )
  );

  // ADD / REMOVE POKEMON

  addPokemon(p: any) {
    if (this.pokemonArray.length >= 6) return;

    this.pokemonArray.push(
      this.fb.group({
        id: [p.id],
        name: [p.name],
        nickname: [''],
        item: [''],
        evs: this.fb.group({
          hp: [0],
          atk: [0],
          def: [0],
          spa: [0],
          spd: [0],
          spe: [0]
        })
      })
    );

    this.search.set('');
  }

  removePokemon(index: number) {
    this.pokemonArray.removeAt(index);
  }

  // VALIDATOR

  uniqueNameValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return of(null);

      return this.trainerStore.teams$.pipe(
        take(1),
        map(teams =>
          teams.some(t => t.name === control.value)
            ? { nameTaken: true }
            : null
        )
      );
    };
  }

  // TYPE WARNING

  typeWarning = computed(() => {
    const team = this.pokemonArray.value;
    if (!team.length) return null;

    const hasFire = team.some((p: any) => p.types?.includes('fire'));
    const hasWater = team.some((p: any) => p.types?.includes('water'));

    if (!hasFire) return 'No Fire coverage ⚠️';
    if (!hasWater) return 'No Water coverage ⚠️';

    return null;
  });

  // EV VALIDATION

  evError = computed(() => {
    if (!this.competitiveMode()) return null;

    for (const p of this.pokemonArray.value) {
      const total = Object.values(p.evs as Record<string, number>)
        .reduce((a, b) => a + b, 0);

      if (total > 510) return 'EV total cannot exceed 510';
    }

    return null;
  });

  // SUBMIT

  submit() {
    if (this.form.invalid || this.evError()) return;

    const value = this.form.value;

    this.trainerStore.createTeam({
      id: 0,
      name: value.name!,
      pokemon_ids: value.pokemon!.map((p: any) => p.id),
      trainer_id: 1,
      created_at: new Date().toISOString()
    });

    this.form.reset();
    this.pokemonArray.clear();
    this.search.set('');
  }

  // INIT

  constructor() {
    this.pokemonStore.fetchPokemon(100, 0);

    effect(() => {
      console.log('Team size:', this.pokemonArray.length);
    });
  }
}