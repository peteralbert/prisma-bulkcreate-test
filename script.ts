import { PrismaClient, sql } from "@prisma/client";

const prisma = new PrismaClient({});

const emptyDatabase = async () => {
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});
};

const range = (n: number): number[] =>
  Array.from({ length: n }, (value, key) => key);

const createUserWithPosts = async (postCount: number) => {
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

const createUserWithPosts2 = async (postCount: number) => {
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

  console.time("create user");
  await createUserWithPosts(postCount);
  console.timeEnd("create user");

  await emptyDatabase();

  console.time("create user - manual");
  await createUserWithPosts2(postCount);
  console.timeEnd("create user - manual");
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
