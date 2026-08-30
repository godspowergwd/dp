import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../lib/errors.js';
import type { ProductQuery } from './product.schema.js';
import type { ProductStatus } from '@pd/shared';

export async function listProducts(query: ProductQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 25;
  const where: Prisma.ProductWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.q) {
    where.OR = [{ title: { contains: query.q, mode: 'insensitive' } }];
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        variants: true,
        sources: true,
        storeProducts: true,
        supplierProducts: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      sources: true,
      research: true,
      scores: true,
      storeProducts: true,
      supplierProducts: true,
    },
  });
  if (!product) throw notFound('Product not found');
  return product;
}

export async function createProduct(input: Prisma.ProductCreateInput) {
  return prisma.product.create({ data: input });
}

export async function updateProduct(id: string, input: Prisma.ProductUpdateInput) {
  await prisma.product.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw notFound('Product not found');
  });
  return prisma.product.update({ where: { id }, data: input });
}

export async function setProductStatus(id: string, status: string) {
  await prisma.product.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw notFound('Product not found');
  });
  return prisma.product.update({ where: { id }, data: { status: status as ProductStatus } });
}

export async function archiveProduct(id: string) {
  await prisma.product.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw notFound('Product not found');
  });
  return prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
