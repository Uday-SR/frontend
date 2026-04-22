import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { PokemonStore } from '../../state/pokemon.store';
import { selectFilteredSortedPokemon } from '../../state/pokemon.selectors';

import { Pokemon } from '../../interface/pokemon.model';
import { POKEMON_VIDEO_MAP } from './videoMap.component';

/**
 * Manages Pokémon listing logic,
 * including fetching data, search, filtering, sorting,
 * pagination, and selecting a Pokémon for detailed view.
*/

@Component({
  selector: 'app-pokedex',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './pokedex.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokedexComponent {

  private store = inject(PokemonStore);
  private sanitizer = inject(DomSanitizer);

  readonly search = signal('');
  readonly sortBy = signal<'name' | 'id'>('name');
  readonly typeFilter = signal<string | null>(null);

  readonly page = signal(1);
  readonly pageSize = signal(10);

  readonly selectedPokemon = signal<Pokemon | null>(null);

  readonly loading = toSignal(this.store.loading$, { initialValue: false });

  private filtered$ = selectFilteredSortedPokemon(
    this.store.pokemon$,
    toObservable(this.search),
    toObservable(this.sortBy),
    toObservable(this.typeFilter)
  );

  readonly filteredPokemon = toSignal(this.filtered$, { initialValue: [] });

  readonly totalPages = computed(() =>
    Math.ceil(this.filteredPokemon().length / this.pageSize())
  );

  readonly paginatedPokemon = computed(() => {
    const list = this.filteredPokemon();
    const start = (this.page() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  readonly radarData = computed<ChartData<'radar'> | undefined>(() => {
    const p = this.selectedPokemon();
    if (!p) return undefined;

    return {
      labels: p.stats.map(s => s.name.toUpperCase()),
      datasets: [
        {
          data: p.stats.map(s => s.value),
          label: p.name
        }
      ]
    };
  });

  readonly radarOptions: ChartOptions<'radar'> = {
    responsive: true,
    scales: {
      r: {
        beginAtZero: true
      }
    }
  };

  readonly videoUrl = computed<SafeResourceUrl | null>(() => {
    const p = this.selectedPokemon();
    if (!p) return null;

    const url = POKEMON_VIDEO_MAP[p.id];
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  constructor() {
    this.store.fetchPokemon(50, 0);

    effect(() => {
      this.search();
      this.sortBy();
      this.typeFilter();
      this.page.set(1);
    });
  }

  selectPokemon(p: Pokemon) {
    this.selectedPokemon.set(p);
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update(v => v + 1);
    }
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update(v => v - 1);
    }
  }
}