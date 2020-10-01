This is an SSCEE for (this issue)[https://github.com/prisma/prisma/issues/3835]. It is based one [Prisma's example](https://github.com/prisma/prisma-examples/tree/latest/typescript/script)

## Problem

In our production schema, we have multiple nested entries (think of spreadsheet with cells, comments, etc.). When a new spreadsheet is created, for multiple reasons we need to initialize/create a lot of cells, comments, etc. As a consequence, `prisma.sheet.create()` leads to >1,000 (sometimes 10,000!) records that need to be created in different tables. This single statement takes **15-20seconds**!

## Suggested solution

Under the hood the Prisma Engine creates one `INSERT` statement for each record, i.e. a lot of statements must be executed - and as the records are related, this must be done sequentially as the parentIDs are required for the next statement. So if for instance 1 parent with 2 children and 3 child-childs respectively need to be created, 9 `INSERT`s must be executed:

1. parent
2. child1
3. child-child 1.1
4. child-child 1.2
5. child-child 1.3
6. child2
7. child-child 2.1
8. child-child 2.2
9. child-child 2.3

Instead, running one `INSERT` with multiple `VALUES` will reduce the number of `INSERT`statements and improve performance a lot when dealing with multiple entries. In the above example, there would be 3 inserts:

1. parent
2. child1, child2
3. child-child 1.1, child-child 1.2, child-child 1.3, child-child 2.1, child-child 2.2, child-child 2.3

## Demo

I create a small [sample repo](https://github.com/peteralbert/prisma-bulkcreate-test) that reproduces this and measures the execution time for both approaches based on the number of records. While the Prisma approach in this specific example is faster for about 500 records, the manual approach is relatively faster the more records there are:

- 10 records: Prisma: 21ms, Bulk: 87ms
- 100 records: Prisma: 33ms, Bulk: 85ms
- 1,000 records: Prisma: 132ms, Bulk: 87ms
- 10,000 records: Prisma: 1,041ms, Bulk: 173ms
- 100,000 records: Prisma: 10,313ms, Bulk: 893ms

The demo uses SQLLite, but we have the same issue with PostgreSQL in production.
