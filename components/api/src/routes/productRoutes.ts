import { Router } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';

const router = Router();

function toNumber(value: Decimal | null | undefined): number | undefined {
  if (value == null) return undefined;
  return Number(value);
}

function computeDiscountedPrice(price: Decimal, discountPercentage: Decimal | null | undefined): number {
  const p = Number(price);
  const d = toNumber(discountPercentage);
  if (d == null || d <= 0) return p;
  return Math.round(p * (1 - d / 100) * 100) / 100;
}

function withDiscountFields<T extends { price: Decimal; discountPercentage?: Decimal | null }>(product: T) {
  const price = Number(product.price);
  const discountPercentage = toNumber(product.discountPercentage);
  const discountedPrice = discountPercentage != null && discountPercentage > 0
    ? computeDiscountedPrice(product.price, product.discountPercentage)
    : price;
  return {
    ...product,
    price,
    discountPercentage: discountPercentage ?? undefined,
    discountedPrice,
  };
}

router.get('/', async (req, res) => {
  const { q, category } = req.query;

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: q ? [
          { name: { contains: q as string, mode: 'insensitive' } },
          { description: { contains: q as string, mode: 'insensitive' } },
        ] : undefined,
        category: category ? {
          slug: category as string
        } : undefined
      },
      include: { category: true, ratings: true },
      orderBy: { createdAt: 'desc' },
    });

    // Add averageRating and discount fields to each product
    const productsWithRatings = products.map(product => {
      const avgRating = product.ratings.length > 0
        ? product.ratings.reduce((sum, r) => sum + r.rating, 0) / product.ratings.length
        : 0;
      return withDiscountFields({
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        totalRatings: product.ratings.length
      });
    });

    res.json(productsWithRatings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, ratings: true },
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const avgRating = product.ratings.length > 0
      ? product.ratings.reduce((sum, r) => sum + r.rating, 0) / product.ratings.length
      : 0;

    res.json(withDiscountFields({
      ...product,
      averageRating: Math.round(avgRating * 10) / 10,
      totalRatings: product.ratings.length
    }));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

function parseDiscountPercentage(value: unknown): number | null | undefined {
  if (value === undefined || value === '' || value === null) return undefined;
  const n = Number(value);
  if (Number.isNaN(n)) return undefined;
  return n;
}

function validateDiscountPercentage(value: number | null | undefined): void {
  if (value == null) return;
  if (value < 0 || value > 100) {
    throw new Error('discountPercentage must be between 0 and 100');
  }
}

router.post('/', async (req, res) => {
  try {
    const { name, description, price, stock, imageUrl, categoryId, discountPercentage: rawDiscount } = req.body;
    const discountPercentage = parseDiscountPercentage(rawDiscount);
    validateDiscountPercentage(discountPercentage);
    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        discountPercentage: discountPercentage != null ? discountPercentage : undefined,
        stock: parseInt(stock),
        imageUrl,
        categoryId: categoryId,
      },
    });
    res.status(201).json(withDiscountFields(newProduct));
  } catch (error) {
    if (error instanceof Error && error.message.includes('discountPercentage')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { name, description, price, stock, imageUrl, categoryId, discountPercentage: rawDiscount } = req.body;
    const discountPercentage = parseDiscountPercentage(rawDiscount);
    validateDiscountPercentage(discountPercentage);
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        imageUrl,
        categoryId: categoryId,
        ...(rawDiscount !== undefined && { discountPercentage: discountPercentage ?? null }),
      },
    });
    res.json(withDiscountFields(updatedProduct));
  } catch (error) {
    if (error instanceof Error && error.message.includes('discountPercentage')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;