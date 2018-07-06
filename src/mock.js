import gql from 'graphql-tag';
import { MockList } from 'graphql-tools';
import { SchemaLink } from 'apollo-link-schema';
import { makeExecutableSchema, addMockFunctionsToSchema } from 'graphql-tools';
import { createClient } from '../../plugins/graphql/graphql';

const createMockLink = ({ typeDefs, mocks }) => {
  // Disable Apollo's Object freezing by changing NODE_ENV to something else then development or test
  process.env.NODE_ENV = 'DISABLE_APOLLO_FREEZE';

  const schema = makeExecutableSchema({ typeDefs });
  addMockFunctionsToSchema({ schema, mocks });

  return new SchemaLink({ schema });
};

const createMockClient = ({ queries, typeDefs, mocks }) => {
  const link = createMockLink({ typeDefs, mocks });
  return createClient({ link, queries });
};


const queries = {
  products: gql`
    query {
      products {
        id
        name
      }
    }`,
  product: gql`
    query($id: Int!) {
      product(id: $id) {
        id
        name
      }
    }
  `,
  brands: gql`
    query {
      brands {
        id
        name
      }
    }`,
  brand: gql`
    query($id: Int!) {
      brand(id: $id) {
        id
        name
      }
    }
  `,
};

const typeDefs = `
  type Query {
    brands: [Brand]
    brand(id: Int!): Brand
    products: [Product]
    product(id: Int!): Product
  }

  type Brand {
    id: Int
    name: String
  }

  type Product {
    id: Int
    name: String
  }
`;

const mocks = {
  Query: () => ({
    products: () => new MockList(3),
    brands: () => new MockList(1),
  }),
  Brand: () => ({
    id: 1,
    name: 'Apple',
  }),
  Product: () => ({
    id: 1,
    name: 'iPhone 8',
  }),
};

export const { query, q } = createMockClient({ queries, typeDefs, mocks });
