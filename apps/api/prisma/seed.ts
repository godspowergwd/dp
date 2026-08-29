/**
 * Seed script — creates the initial operator (owner) account.
 * Run via: npm run db:seed -w @pd/api
 *
 * Reads ADMIN_EMAIL + ADMIN_PASSWORD from the environment (see .env.example).
 * Skips creation if an owner already exists (registration is closed).
 */
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'owner@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'change-me-strong-password';
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Owner';

async function main(): Promise<void> {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log('An owner account already exists; skipping seed.');
    return;
  }

  const passwordHash = await argon2.hash(ADMIN_PASSWORD);
  const user = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL.toLowerCase(),
      name: ADMIN_NAME,
      passwordHash,
      role: 'owner',
    },
  });

  // Baseline settings
  await prisma.setting.createMany({
    data: [
      { key: 'ai.monthly_budget_usd', value: { amount: 50 } },
      { key: 'ai.per_day_budget_usd', value: { amount: 5 } },
      { key: 'ai.per_job_max_usd', value: { amount: 1 } },
      { key: 'require_approval.publish', value: { enabled: true } },
      { key: 'require_approval.supplier_change', value: { enabled: true } },
    ],
  });

  console.log(`Seeded owner account: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
