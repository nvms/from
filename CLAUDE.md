# @prsm/from

fluent query builder for arrays of objects. filter, transform, project, sort, paginate, aggregate - all in one composable pipeline.

## structure

```
src/
  index.ts           - public exports
  query.ts           - Query class and from() entrypoint
  types.ts           - path utility types
  operators/         - all operator functions (eq, gt, includes, add, etc.)
  utils/             - clone, path access, type guards
tests/
  filtering.test.ts  - where, operators, predicates
  projection.test.ts - select, omit, map
  sorting.test.ts    - sortBy, skip, take, count, first, groupBy
  mutation.test.ts   - update, updateMut, remove, removeMut
  aggregation.test.ts - add, sub, mul, div, computed fields
  edge-cases.test.ts - empty arrays, immutability, missing paths
```

## dev

```
make test      # run tests
make build     # compile typescript
```

## key details

- typescript (types are the feature here - fluent chain with inference)
- zero dependencies
- immutable by default (update clones, updateMut opts in to mutation)
- operators are plain functions, not magic object keys
- aggregate computed fields can reference each other in declaration order
- query instances are immutable - each chain method returns a new Query
