/*
A lightweight GraphQL client built on top of Apollo Client.

# Examples

export default {
  async asyncData({ app, params }) {
    const { data: { telcos } } = await app.$query("telcos");
    const { telcos } = await app.$q("telcos");
  }

  async mounted() {
    const [{ data: { telco } }, { data: { brand } }] = this.$query(["brand", "telco"], [{ id: 1 }, { id: 2 }]);
    const [{ data: { telco } }, { data: { brand } }] = this.$query({ brand: { id: 1 }, telco: { id: 2 } });
    const { telco, brand } = this.$q({ brand: { id: 1 }, telco: { id: 2 } });
  }
}
*/

import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';
import { createHttpLink } from 'apollo-link-http';
import fetch from 'node-fetch';
import { BatchHttpLink } from 'apollo-link-batch-http';
import { partial } from 'lodash';

const serverUri = '<%= options.serverUri %>';
const localUri = '<%= options.localUri %>';

const createBatchedPayloadGetter = results => async () => JSON.stringify(results.map(result => result.payload));

const batchFetch = async (uri, options) => {
  const response = await fetch(uri, options);
  const results = await response.json();
  const text = createBatchedPayloadGetter(results);
  return { text };
};

function createClient({ link, queries, mutations }) {
  const defaultLink = ApolloLink.split(
    () => process.server,
    createHttpLink({ uri: serverUri, fetch }),
    createHttpLink({ uri: localUri, fetch }),
    // new BatchHttpLink({ uri: localUri, fetch: batchFetch }),
  );

  const cache = new InMemoryCache();

  const client = new ApolloClient({
    link: link || defaultLink,
    cache,
  });

  const docs = {
    query: queries,
    mutation: mutations,
  };

  const executor = {
    query: 'query',
    mutation: 'mutate',
  };

  function exec(type, config, vars = {}) {
    const [name, variables] = Array.isArray(config) ? config : [config, vars];

    return new Promise((resolve) => {
      client[executor[type]]({ [type]: docs[type][name], fetchPolicy: 'no-cache', variables })
        .then((data) => {
          resolve({ data: data.data, errors: [] });
        })
        .catch((errors) => {
          console.error(errors); // eslint-disable-line
          resolve({ data: {}, errors: errors.graphQLErrors });
        });
    });
  }

  function execAll(type, configs) {
    const executor = partial(exec, type);
    return Promise.all(configs.map(executor));
  }

  function call(type, config, variables) {
    if (Array.isArray(config)) {
      return execAll(
        type,
        config.map((name, index) => [name, variables && variables[index]]),
      );
    } if (config === Object(config)) {
      return execAll(type, Object.entries(config));
    }
    return exec(type, config, variables);
  }

  async function c(type, config, variables) {
    const results = await call(type, config, variables);
    if (Array.isArray(results)) {
      return Object.assign({}, ...results.map(result => result.data));
    }
    this.$graphQLErrors = results.errors;

    const rootError = results.errors.find(error => error.path === undefined);
    this.$graphQLError = rootError && rootError.message;

    if (results.errors && this.$v) {
      this.$v.$touch();
      this.$v.$reset();
    }
    return results.data;
  }

  const query = partial(call, 'query');
  const q = partial(c, 'query');
  const mutate = partial(call, 'mutation');
  const m = partial(c, 'mutation');

  return {
    query, q, mutate, m,
  };
}

export { createClient };

export default async (_, inject) => {
  const queries = require('<%= options.graphqlFolder %>/queries').default;
  const mutations = require('<%= options.graphqlFolder %>/mutations').default;

  const {
    query, q, mutate, m,
  } = createClient({ queries, mutations });

  inject('query', query);
  inject('q', q);
  inject('mutate', mutate);
  inject('m', m);
};
