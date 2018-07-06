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

import ApolloClient from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link";
import { createHttpLink } from "apollo-link-http";
import fetch from "node-fetch";
import { BatchHttpLink } from "apollo-link-batch-http";

const serverUri = "<%= options.serverUri %>";
const localUri = "<%= options.localUri %>";

const createBatchedPayloadGetter = results => async () =>
  JSON.stringify(results.map(result => result.payload));

const batchFetch = async (uri, options) => {
  const response = await fetch(uri, options);
  const results = await response.json();
  const text = createBatchedPayloadGetter(results);
  return { text };
};

function createClient({ link, queries }) {
  const defaultLink = ApolloLink.split(
    () => process.server,
    createHttpLink({ uri: serverUri, fetch }),
    new BatchHttpLink({ uri: localUri, fetch: batchFetch })
  );
  console.log(serverUri);
  console.log(localUri);
  const cache = new InMemoryCache();

  const client = new ApolloClient({
    link: link || defaultLink,
    cache
  });

  function execQuery(config, vars = {}) {
    const [name, variables] = Array.isArray(config) ? config : [config, vars];

    return new Promise(resolve => {
      client
        .query({ query: queries[name], fetchPolicy: "no-cache", variables })
        .then(data => {
          resolve({ data: data.data, errors: [] });
        })
        .catch(errors => {
          console.error(errors); // eslint-disable-line
          resolve({ data: null, errors });
        });
    });
  }

  function execQueries(configs) {
    return Promise.all(configs.map(execQuery));
  }

  function query(config, variables) {
    if (Array.isArray(config)) {
      return execQueries(
        config.map((name, index) => [name, variables && variables[index]])
      );
    } else if (config === Object(config)) {
      return execQueries(Object.entries(config));
    }
    return execQuery(config, variables);
  }

  async function q(config, variables) {
    const results = await query(config, variables);
    if (Array.isArray(results)) {
      return Object.assign({}, ...results.map(result => result.data));
    } else {
      return results.data;
    }
  }

  return { query, q };
}

export { createClient };

export default async (_, inject) => {
  const queries = require('./../graphql/queries').default
  // const subscriptions = require("../../graphql/queries").default;
  // const mutations = require("../../graphql/queries").default;
  const { query, q } = createClient({ queries });

  inject("query", query);
  inject("q", q);
};
