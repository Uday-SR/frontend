/**
 * Handles all trainer-related logic like
 * creating, updating, and fetching trainer data from API or store.
*/


import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable, catchError, of } from 'rxjs';

import { Team } from '../../interface/team.model';
import { Battle } from '../../interface/battle.model';
import { Trainer } from '../../interface/trainer.model';

/* Queries */

const GET_TRAINER = gql`
  query {
    allTrainers {
      id
      name
      badge_count
      region
      avatar_url
      rank
    }
  }
`;

const GET_TEAMS = gql`
  query {
    allTeams {
      id
      name
      pokemon_ids
      created_at
      trainer_id
    }
  }
`;

const GET_BATTLES = gql`
  query {
    allBattles {
      id
      opponent_name
      result
      date
      score_trainer
      score_opponent
      team_id
      trainer_id
    }
  }
`;

const GET_BATTLE_LOGS = gql`
  query {
    allBattleLogs {
      id
      message
      timestamp
      severity
      battle_id
    }
  }
`;


// Mutations

const CREATE_TEAM = gql`
  mutation (
    $name: String!
    $pokemon_ids: [Int]!
    $trainer_id: ID!
    $created_at: String!
  ) {
    createTeam(
      name: $name
      pokemon_ids: $pokemon_ids
      trainer_id: $trainer_id
      created_at: $created_at
    ) {
      id
      name
      pokemon_ids
      trainer_id
      created_at
    }
  }
`;

const UPDATE_TEAM = gql`
  mutation UpdateTeam(
    $id: ID!
    $name: String!
    $pokemon_ids: [Int]!
  ) {
    updateTeam(
      id: $id
      name: $name
      pokemon_ids: $pokemon_ids
    ) {
      id
      name
      pokemon_ids
      trainer_id
      created_at
    }
  }
`;

const DELETE_TEAM = gql`
  mutation ($id: ID!) {
    deleteTeam(id: $id)
  }
`;

const CREATE_BATTLE = gql`
  mutation (
    $trainer_id: ID!
    $team_id: ID!
    $opponent_name: String!
    $result: String!
    $date: String!
    $score_trainer: Int!
    $score_opponent: Int!
  ) {
    createBattle(
      trainer_id: $trainer_id
      team_id: $team_id
      opponent_name: $opponent_name
      result: $result
      date: $date
      score_trainer: $score_trainer
      score_opponent: $score_opponent
    ) {
      id
    }
  }
`;

const UPDATE_TRAINER = gql`
  mutation UpdateTrainer(
    $id: ID!
    $name: String!
    $badge_count: Int!
    $region: String!
  ) {
    updateTrainer(
      id: $id
      name: $name
      badge_count: $badge_count
      region: $region
    ) {
      id
      name
      badge_count
      region
    }
  }
`;

/**
 * TrainerService
 * Handles all trainer-related GraphQL operations:
 * - Trainer profile
 * - Teams CRUD
 * - Battles
 * - Battle logs
 *
 * Acts as a bridge between Angular app and GraphQL backend.
 */

@Injectable({ providedIn: 'root' })
export class TrainerService {

  constructor(private apollo: Apollo) {}

  private uri = 'http://localhost:4000/graphql';

  /**
   * Fetch single trainer profile
   */
  getTrainer(id: number): Observable<Trainer | null> {
    return this.apollo.query<{ allTrainers: Trainer[] }>({
      query: GET_TRAINER,
      variables: { id },
      context: { uri: this.uri }
    }).pipe(
      map(res => res.data?.allTrainers?.[0] ?? null),
      catchError(err => {
        console.error('Failed to fetch trainer:', err);
        return of(null);
      })
    );
  }

  /**
   * Fetch all teams for a trainer
   */
  getTeams(trainerId: number): Observable<Team[]> {
    return this.apollo.query<{ allTeams: Team[] }>({
      query: GET_TEAMS,
      variables: { trainerId },
      context: { uri: this.uri }
    }).pipe(
      map(res => res.data?.allTeams ?? []),
      map(teams => teams.filter(t => t.trainer_id === trainerId)),
      catchError(err => {
        console.error('Failed to fetch teams:', err);
        return of([]);
      })
    );
  }

  /**
   * Create a new team
   */
  createTeam(team: Team): Observable<Team | null> {
    return this.apollo.mutate<{ createTeam: Team }>({
      mutation: CREATE_TEAM,
      variables: {
        name: team.name,
        pokemon_ids: team.pokemon_ids,
        trainer_id: team.trainer_id,
        created_at: team.created_at
      },
      context: { uri: this.uri }
    }).pipe(
      map(res => res.data?.createTeam || null),
      catchError(err => {
        console.error('Create team failed:', err);
        return of(null);
      })
    );
  }

  /**
   * Update existing team
   */
  updateTeam(team: Team) {
    return this.apollo.mutate<{ updateTeam: Team }>({
      mutation: UPDATE_TEAM,
      variables: {
        id: team.id,
        name: team.name,
        pokemon_ids: team.pokemon_ids
      },
      context: { uri: this.uri }
    }).pipe(
      map(res => res.data?.updateTeam ?? null)
    );
  }

  /**
   * Delete a team
   */
  deleteTeam(id: number): Observable<boolean> {
    return this.apollo.mutate<{ deleteTeam: boolean }>({
      mutation: DELETE_TEAM,
      variables: { id },
      context: { uri: this.uri }
    }).pipe(
      map(res => !!res.data?.deleteTeam),
      catchError(err => {
        console.error('Delete team failed:', err);
        return of(false);
      })
    );
  }

  /**
   * Fetch battles for a trainer
   */
  getBattles(trainerId: number): Observable<Battle[]> {
    return this.apollo.query<{ allBattles: Battle[] }>({
      query: GET_BATTLES,
      context: { uri: this.uri }
    }).pipe(
      map(res => res.data?.allBattles ?? []),
      map(battles => battles.filter(b => b.trainer_id === trainerId)),
      catchError(err => {
        console.error('Failed to fetch battles:', err);
        return of([]);
      })
    );
  }

  /**
   * Create a battle record
   */
  createBattle(battle: Battle): Observable<boolean> {
    return this.apollo.mutate({
      mutation: CREATE_BATTLE,
      variables: battle,
      context: { uri: this.uri }
    }).pipe(
      map(() => true),
      catchError(err => {
        console.error('Create battle failed:', err);
        return of(false);
      })
    );
  }

  /**
   * Fetch live battle logs
   */
  getBattleLogs(): Observable<any[]> {
    return this.apollo.query<{ allBattleLogs: any[] }>({
      query: GET_BATTLE_LOGS,
      context: { uri: this.uri },
      fetchPolicy: 'network-only'
    }).pipe(
      map(res => res.data?.allBattleLogs ?? []),
      catchError(err => {
        console.error('Failed to fetch logs:', err);
        return of([]);
      })
    );
  }

  /**
   * Update trainer profile
   */
  updateTrainer(trainer: Trainer) {
    return this.apollo.mutate<{ updateTrainer: Trainer }>({
      mutation: UPDATE_TRAINER,
      variables: {
        id: trainer.id,
        name: trainer.name,
        badge_count: trainer.badge_count,
        region: trainer.region
      },
      context: { uri: this.uri }
    }).pipe(
      map(res => res.data?.updateTrainer ?? null)
    );
  }
}