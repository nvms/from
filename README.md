<p align="center">
  <img src=".github/logo.svg" width="80" height="80" alt="from logo">
</p>

<h1 align="center">@prsm/from</h1>

Fluent query builder for filtering, transforming, and aggregating arrays of objects. Zero dependencies.

## Installation

```bash
npm install @prsm/from
```

## Usage

```ts
import { from, lt, eq, oneOf } from "@prsm/from"

const result = from(users)
  .where("age", lt(30))
  .where("role", eq("admin"))
  .sortBy("name", "asc")
  .skip(10)
  .take(5)
  .select(["name", "email"])
  .value()
```

## Operators

```ts
// comparison
from(items).where("score", gt(90))
from(items).where("score", between(80, 100))

// strings and arrays
from(items).where("name", includes("test"))
from(items).where("name", startsWith("A"))
from(items).where("tags", lengthGt(2))
from(items).where("tags", empty())

// existence
from(items).where("deletedAt", missing())
from(items).where("email", exists())

// collection
from(items).where("status", oneOf(["active", "pending"]))

// custom predicate
from(items).where((item) => item.score > item.threshold)

// wildcard paths - match if any element satisfies the operator
from(items).where("tags.*", eq("featured"))
from(items).where("departments.*.members.*.skill", eq("rust"))
```

## Projection

```ts
from(items).select(["name", "email"])           // keep only these fields
from(items).omit(["password", "internal"])       // exclude these fields
from(items).map((item) => ({ label: item.name })) // transform
```

## Aggregation

Computed fields are added in order and can reference each other:

```ts
from(students)
  .aggregate({
    total: add("math", "english", "science"),
    average: div("total", 3),
  })
  .omit(["total"])
  .value()
```

Operators: `add`, `sub`, `mul`, `div`. Accept field paths, literal numbers, or other aggregate operators.

## Updates

Immutable by default:

```ts
// returns cloned array, original untouched
from(items).where("id", eq(1)).update("score", 100).value()

// wildcard maps array elements
from(items).update("tags.*", (t) => t.toUpperCase()).value()
```

Opt in to mutation:

```ts
from(items).where("id", eq(1)).updateMut("score", 100).value()
```

## Sorting and Pagination

```ts
from(items).sortBy("score", "desc").skip(10).take(5).value()
```

## Other

```ts
from(items).first()              // first match or undefined
from(items).count()              // number of results
from(items).groupBy("category")  // Record<string, T[]>
from(items).where(...).remove()  // returns matched items
from(items).where(...).removeMut().value()  // mutates in place
```

## License

Apache-2.0
