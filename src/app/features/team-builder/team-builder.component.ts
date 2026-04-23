/**
 * Handles creating and managing a Pokémon team,
 * including adding/removing Pokémon, validating team rules,
 * and storing the selected lineup for battles.
*/

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

import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray
} from '@angular/cdk/drag-drop';

import { TrainerStore } from '../../state/trainer.store';
import { PokemonStore } from '../../state/pokemon.store';
import { selectPokemonSearch } from '../../state/pokemon.selectors';

@Component({
  selector: 'app-team-builder',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, DragDropModule],
  templateUrl: './team-builder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamBuilderComponent {

  private fb = inject(FormBuilder);
  public trainerStore = inject(TrainerStore);
  private pokemonStore = inject(PokemonStore);

  // TYPE COLORS
  readonly typeColors: Record<string, string> = {
    fire: 'bg-red-500',
    water: 'bg-blue-500',
    grass: 'bg-green-500',
    electric: 'bg-yellow-400 text-black',
    ice: 'bg-cyan-300 text-black',
    fighting: 'bg-orange-700',
    poison: 'bg-purple-500',
    ground: 'bg-yellow-600',
    flying: 'bg-indigo-400',
    psychic: 'bg-pink-500',
    bug: 'bg-lime-500',
    rock: 'bg-stone-500',
    ghost: 'bg-violet-700',
    dragon: 'bg-indigo-700',
    dark: 'bg-gray-800',
    steel: 'bg-gray-400 text-black',
    fairy: 'bg-pink-300 text-black'
  };

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

  // SEARCH LOGIC
  debouncedSearch$ = toObservable(this.search).pipe(debounceTime(300));

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

  // ADD POKEMON
  addPokemon(p: any) {
    if (!p || this.pokemonArray.length >= 6) return;

    this.pokemonArray.push(
      this.fb.group({
        id: [p.id],
        name: [p.name],
        types: [p.types],
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
    if (index >= 0 && index < this.pokemonArray.length) {
      this.pokemonArray.removeAt(index);
    }
  }

  // DRAG & DROP

  drop(event: CdkDragDrop<any[]>) {

    // 🔁 Reorder inside team
    if (event.previousContainer === event.container) {
      moveItemInArray(
        this.pokemonArray.controls,
        event.previousIndex,
        event.currentIndex
      );
      return;
    }

    //  From suggestions → team
    const p = event.previousContainer.data[event.previousIndex];

    if (!p) return;
    if (this.pokemonArray.length >= 6) return;

    this.addPokemon(p);
  }

  dropToRemove(event: CdkDragDrop<any[]>) {

    // Only remove if dragged from team → trash
    if (event.previousContainer !== event.container) {
      this.removePokemon(event.previousIndex);
    }
  }

  // VALIDATORS

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

  typeWarning = computed(() => {
    const team = this.pokemonArray.value;
    if (!team.length) return null;

    const hasFire = team.some((p: any) => p.types?.includes('fire'));
    const hasWater = team.some((p: any) => p.types?.includes('water'));

    if (!hasFire) return 'No Fire coverage ⚠️';
    if (!hasWater) return 'No Water coverage ⚠️';

    return null;
  });

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