import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'pokedex',
    pathMatch: 'full'
  },

  {
    path: 'pokedex',
    loadComponent: () =>
      import('./features/pokedex/pokedex.component')
        .then(m => m.PokedexComponent)
  },

  {
    path: 'team',
    loadComponent: () =>
      import('./features/team-builder/team-builder.component')
        .then(m => m.TeamBuilderComponent)
  },

  {
    path: 'battle',
    loadComponent: () =>
      import('./features/battle-dashboard/battle-dashboard.component')
        .then(m => m.BattleDashboardComponent)
  },

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  },
];