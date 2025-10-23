import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Match Judge0 IDs with database IDs
const programmingLanguages = [
  {
    id: 54,
    name: 'C++ (GCC 9.2.0)',
    version: '9.2.0',
    isSupported: true,
  },
  {
    id: 62,
    name: 'Java (OpenJDK 13.0.1)',
    version: '13.0.1',
    isSupported: true,
  },
  {
    id: 63,
    name: 'JavaScript (Node.js 12.14.0)',
    version: '12.14.0',
    isSupported: true,
  },
  {
    id: 71,
    name: 'Python (3.8.1)',
    version: '3.8.1',
    isSupported: true,
  },
  {
    id: 74,
    name: 'TypeScript (3.7.4)',
    version: '3.7.4',
    isSupported: true,
  },
  {
    id: 93,
    name: 'JavaScript (Node.js 18.15.0)',
    version: '18.15.0',
    isSupported: true,
  },
  {
    id: 94,
    name: 'Python (3.11.2)',
    version: '3.11.2',
    isSupported: true,
  },
];

async function seedLanguages() {
  console.log('🌱 Seeding programming languages...\n');

  for (const lang of programmingLanguages) {
    try {
      const language = await prisma.programmingLanguage.upsert({
        where: { id: lang.id },
        update: {
          name: lang.name,
          version: lang.version,
          isSupported: lang.isSupported,
        },
        create: lang,
      });

      console.log(`✅ ${language.name} (ID: ${language.id})`);
    } catch (error) {
      console.error(`❌ Error with ${lang.name}:`, error.message);
    }
  }

  console.log('\n✨ Language seeding completed!');

  // Verify
  const count = await prisma.programmingLanguage.count();
  const supportedCount = await prisma.programmingLanguage.count({
    where: { isSupported: true }
  });
  
  console.log(`\n📊 Total languages in database: ${count}`);
  console.log(`✅ Supported languages: ${supportedCount}`);
}

seedLanguages()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });