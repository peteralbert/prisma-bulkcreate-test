import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
// { log: ["query"] }

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
    // include: { posts: true },
  });
};
async function main() {
  await emptyDatabase();
  console.time("create user");
  const user = await createUserWithPosts(5000);
  console.timeEnd("create user");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
