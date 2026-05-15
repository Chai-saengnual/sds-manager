import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { sdsRecords: true } },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, nameTh, description, color, icon } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        nameTh,
        description,
        color: color || '#6366f1',
        icon,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}