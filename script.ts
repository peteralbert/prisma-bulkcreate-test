import { PrismaClient, sql } from "@prisma/client";

const prisma = new PrismaClient({});

const emptyDatabase = async () => {
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});
};

const range = (n: number): number[] =>
  Array.from({ length: n }, (value, key) => key);

const createWithPrisma = async (postCount: number) => {
  return prisma.user.create({
    data: {
      email: "alice@prisma.io",
      name: "Alice",
      posts: {
        create: range(postCount).map((n) => ({
          title: "1",
          content: "1",
          published: true,
        })),
      },
    },
  });
};

const createWithManualSQL = async (postCount: number) => {
  await prisma.$executeRaw`INSERT INTO User (email, name) VALUES (${"alice@prisma.io"}, ${"Alice"})`;
  const userId = (
    await prisma.user.findOne({
      where: { email: "alice@prisma.io" },
    })
  )?.id;
  await prisma.$executeRaw(
    `INSERT INTO Post (title, content, published, authorId) VALUES ` +
      range(postCount)
        .map((n) => `("1", "1", true, ${userId})`)
        .join(",")
  );
};
async function main() {
  const postCount = 100000;

  await emptyDatabase();

  console.time(`Prisma: create user with ${postCount} posts`);
  await createWithPrisma(postCount);
  console.timeEnd(`Prisma: create user with ${postCount} posts`);

  await emptyDatabase();

  console.time(`executeRaw$: create user with ${postCount} posts`);
  await createWithManualSQL(postCount);
  console.timeEnd(`executeRaw$: create user with ${postCount} posts`);
  await emptyDatabase();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
