import { ApplicationConfig } from '@angular/core';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client/core';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

/**
 * Configures Apollo Client for GraphQL,
 * including API endpoint, caching strategy, and auth headers.
*/

export const apolloConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),

    provideApollo(() => {
      const httpClient = inject(HttpClient);

      const httpLink = new HttpLink(httpClient);

      return {
        link: httpLink.create({
          uri: 'https://beta.pokeapi.co/graphql/v1beta'
        }),
        cache: new InMemoryCache()
      };
    })
  ]
};