import { PrismaClient, QuestionDifficulty, TagCategory, Role, UserStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// --- FUNCTION TO DETERMINE TAG CATEGORY ---
function getTagCategory(tag: string): TagCategory {
  const companyTags = ['google', 'amazon', 'microsoft', 'accenture', 'tcs', 'capgemini', 'startup'];
  const skillTags = ['string', 'two-pointers', 'array', 'hash-table', 'stack', 'dynamic-programming', 'linked-list', 'recursion', 'math'];
  const topicTags = ['quantitative', 'speed & distance', 'number theory', 'averages', 'pipes & cisterns', 'work & time', 'profit & loss', 'permutations', 'geometry', 'technical'];
  const languageTags = ['javascript', 'python', 'java', 'typescript', 'c++'];
  const frameworkTags = ['spring boot', 'react', 'angular'];

  const lowerCaseTag = tag.toLowerCase();

  if (companyTags.includes(lowerCaseTag)) return TagCategory.COMPANY;
  if (skillTags.includes(lowerCaseTag)) return TagCategory.SKILL;
  if (topicTags.includes(lowerCaseTag)) return TagCategory.APTITUDE_TOPIC;
  if (languageTags.includes(lowerCaseTag)) return TagCategory.LANGUAGE;
  if (frameworkTags.includes(lowerCaseTag)) return TagCategory.FRAMEWORK;
  return TagCategory.OTHER;
}

async function main() {
  console.log(`🧹 Cleaning up the database...`);
  // Order is important to respect foreign key constraints
  await prisma.machineTestProblemTag.deleteMany({});
  await prisma.aptitudeQuestion.deleteMany({});
  await prisma.machineTestProblem.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.institution.deleteMany({});
  console.log(`🗑️ Database cleaned.`);

  console.log(`\n🌱 Start seeding ...`);

  // Seed Institutions
  console.log(`\n🏫 Seeding institutions...`);
  const pvppcoe = await prisma.institution.create({
    data: {
      name: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering",
      domain: 'pvppcoe.ac.in',
      logoUrl: 'https://th.bing.com/th/id/ODF.pAUbQ1kQaXuxXJk-Mw9KTg?w=32&h=32&qlt=90&pcl=fffffc&o=6&cb=12&pid=1.2',
    },
  });
  console.log(`✅ Created institution: ${pvppcoe.name}`);

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('Prathamesh@1407', 10);

  // Seed Users
  console.log(`\n👥 Seeding users...`);
  
  // Student - using 84
  const student = await prisma.user.create({
    data: {
      email: 'vu1f2223084@pvppcoe.ac.in',
      hashedPassword,
      role: Role.STUDENT,
      status: UserStatus.PENDING_PROFILE_COMPLETION,
      institutionId: pvppcoe.id,
      profile: {
        create: {
          fullName: 'Student User',
        },
      },
    },
  });
  console.log(`✅ Created student user: ${student.email}`);

  // Institution Admin - using 74
  const institutionAdmin = await prisma.user.create({
    data: {
      email: 'vu1f2223074@pvppcoe.ac.in',
      hashedPassword,
      role: Role.INSTITUTION_ADMIN,
      status: UserStatus.ACTIVE,
      institutionId: pvppcoe.id,
      profile: {
        create: {
          fullName: 'Institution Admin',
        },
      },
    },
  });
  console.log(`✅ Created institution admin user: ${institutionAdmin.email}`);

  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'prathameshgaikwad964006@gmail.com',
      hashedPassword,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          fullName: 'Prathamesh Gaikwad',
        },
      },
    },
  });
  console.log(`✅ Created super admin user: ${superAdmin.email}`);

  // Read JSON files
  const aptiQuestionsPath = path.join(__dirname, 'seed-data', 'aptiquestions.json');
  const codingProblemsPath = path.join(__dirname, 'seed-data', 'codingproblems.json');

  const aptiQuestionsData = JSON.parse(fs.readFileSync(aptiQuestionsPath, 'utf-8'));
  const codingProblemsData = JSON.parse(fs.readFileSync(codingProblemsPath, 'utf-8'));

  // Seed tags first to ensure they exist
  console.log(`\n🏷️ Seeding tags...`);
  const allTags = [
    ...new Set([
      ...codingProblemsData.flatMap(p => p.tags),
      ...aptiQuestionsData.flatMap(q => q.tags),
    ]),
  ];
  for (const tagName of allTags) {
    await prisma.tag.upsert({
      where: {
        name_category: {
          name: tagName,
          category: getTagCategory(tagName),
        },
      },
      update: {},
      create: {
        name: tagName,
        category: getTagCategory(tagName),
      },
    });
  }
  console.log(`✅ ${allTags.length} tags seeded.`);

  // Seed machine test problems
  console.log(`\n🧩 Seeding machine test problems...`);
  for (const p of codingProblemsData) {
    const problem = await prisma.machineTestProblem.create({
      data: {
        title: p.title,
        description: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: p.description }],
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: `**Input Format**: ${p.inputFormat}` }],
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: `**Output Format**: ${p.outputFormat}` }],
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: `**Constraints**: ${p.constraints.join(', ')}`,
                },
              ],
            },
          ],
        },
        difficulty: p.difficulty.toUpperCase() as QuestionDifficulty,
        testCases: {
          sample: p.sampleTestCases,
          hidden: p.hiddenTestCases,
        },
        isPublic: true,
        tags: {
          create: p.tags.map(tagName => ({
            tag: {
              connect: {
                name_category: {
                  name: tagName,
                  category: getTagCategory(tagName),
                },
              },
            },
          })),
        },
      },
    });
    console.log(`✅ Created machine test problem: ${problem.title}`);
  }

  // Seed aptitude questions
  console.log(`\n📚 Seeding aptitude questions...`);
  for (const q of aptiQuestionsData) {
    const question = await prisma.aptitudeQuestion.create({
      data: {
        sourceQuestionId: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty.toUpperCase() as QuestionDifficulty,
        tags: {
          connect: q.tags.map(tagName => ({
            name_category: {
              name: tagName,
              category: getTagCategory(tagName),
            },
          })),
        },
      },
    });
    console.log(`✅ Created aptitude question: ${question.question.substring(0, 40)}...`);
  }

  console.log(`\n🎉 Seeding finished.`);
  console.log(`\n📋 Summary of seeded users:`);
  console.log(`  - Student: vu1f2223084@pvppcoe.ac.in (Password: Prathamesh@1407)`);
  console.log(`  - Institution Admin: vu1f2223074@pvppcoe.ac.in (Password: Prathamesh@1407)`);
  console.log(`  - Super Admin: prathameshgaikwad964006@gmail.com (Password: Prathamesh@1407)`);
}

main()
  .catch((e) => {
    console.error('❌ An error occurred during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });