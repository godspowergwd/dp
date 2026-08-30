import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../lib/errors.js';
import type {
  CreateProductInput,
  ProductQuery,
  UpdateProductInput,
} from './product.schema.js';
import type { ProductStatus } from '@pd/shared';

export async function listProducts(query: ProductQuery) {
  const where: Prisma.ProductWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.q) {
    where.OR = [{ title: { contains: query.q, mode: 'insensitive' } }];
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
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
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
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

export async function createProduct(input: CreateProductInput) {
  return prisma.product.create({ data: input });
}

export async function updateProduct(id: string, input: UpdateProductInput) {
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
