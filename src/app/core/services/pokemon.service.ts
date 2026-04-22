import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import gql from 'graphql-tag';
import { Pokemon } from '../../interface/pokemon.model';

/**
 * Service for fetching Pokémon data using GraphQL (Apollo).
 * Converts raw API response into frontend-ready models.
 */
const GET_POKEMON = gql`
  query GetPokemon($limit: Int, $offset: Int) {
    pokemon_v2_pokemon(limit: $limit, offset: $offset) {
      id
      name
      height
      weight

      pokemon_v2_pokemontypes {
        pokemon_v2_type {
          name
        }
      }

      pokemon_v2_pokemonstats {
        base_stat
        pokemon_v2_stat {
          name
        }
      }

      pokemon_v2_pokemonsprites {
        sprites
      }
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class PokemonService {

  constructor(private apollo: Apollo) {}

  /**
   * Fetches paginated Pokémon list.
   * @param limit number of Pokémon per page
   * @param offset pagination offset
   */
  getPokemon(limit: number, offset: number): Observable<Pokemon[]> {
    return this.apollo.query<any>({
      query: GET_POKEMON,
      variables: { limit, offset }
    }).pipe(
      map(res => res.data.pokemon_v2_pokemon),
      map(list => list.map((p: any) => this.mapPokemon(p)))
    );
  }

  /**
   * Maps raw GraphQL Pokémon data to Pokemon model.
   */
  private mapPokemon(api: any): Pokemon {
    return {
      id: api.id,
      name: api.name,
      height: api.height,
      weight: api.weight,

      types: api.pokemon_v2_pokemontypes.map(
        (t: any) => t.pokemon_v2_type.name
      ),

      stats: api.pokemon_v2_pokemonstats.map(
        (s: any) => ({
          name: s.pokemon_v2_stat.name,
          value: s.base_stat
        })
      ),

      sprite: this.extractSprite(api.pokemon_v2_pokemonsprites ?? [])
    };
  }

  /**
   * Extracts Pokémon sprite safely from API response.
   */
  private extractSprite(sprites: any[]): string {
    try {
      const raw = sprites?.[0]?.sprites;
      if (!raw) return '';

      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return parsed?.front_default || '';
    } catch {
      return '';
    }
  }
}