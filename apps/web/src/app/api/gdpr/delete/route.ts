import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GDPRService } from '@/lib/gdpr';
import { prisma } from '@awcrm/database';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { userId, reason, hardDelete = false } = await req.json();

    // Users can only delete their own data, unless they're admin
    if (userId !== session.user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Deletion reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Only admins can perform hard deletes
    if (hardDelete && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can perform permanent deletions' },
        { status: 403 }
      );
    }

    await GDPRService.deleteUserData(
      {
        userId: userId || session.user.id,
        organizationId: user.organizationId,
        reason,
        hardDelete,
      },
      session.user.id
    );

    return NextResponse.json({
      success: true,
      message: hardDelete 
        ? 'User data permanently deleted' 
        : 'User data marked for deletion',
    });
  } catch (error) {
    console.error('Data deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}