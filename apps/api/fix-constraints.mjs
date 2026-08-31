import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stmts = [
  `ALTER TABLE "AffiliateProduct" DROP CONSTRAINT IF EXISTS "AffiliateProduct_providerId_providerProductId_key"`,
  `ALTER TABLE "AffiliateProduct" ADD CONSTRAINT "AffiliateProduct_providerId_providerProductId_key" UNIQUE ("providerId", "providerProductId")`,
  `ALTER TABLE "SocialAccount" DROP CONSTRAINT IF EXISTS "SocialAccount_userId_provider_providerAccountId_key"`,
  `ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_userId_provider_providerAccountId_key" UNIQUE ("userId", "provider", "providerAccountId")`,
  `ALTER TABLE "Commission" DROP CONSTRAINT IF EXISTS "Commission_providerTransactionId_affiliateProviderId_key"`,
  `ALTER TABLE "Commission" ADD CONSTRAINT "Commission_providerTransactionId_affiliateProviderId_key" UNIQUE ("providerTransactionId", "affiliateProviderId")`,
];

for (const s of stmts) {
  try {
    await prisma.$executeRawUnsafe(s);
    console.log('OK:', s.slice(0, 70));
  } catch (e) {
    console.log('ERR:', e.message.slice(0, 160));
  }
}

await prisma.$disconnect();
