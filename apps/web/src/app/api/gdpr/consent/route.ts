import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GDPRService } from '@/lib/gdpr';
import { prisma } from '@awcrm/database';
import { getClientIP } from '@/middleware/security';

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
      select: { organizationId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { consentType, granted, purpose, legalBasis } = await req.json();

    if (!consentType || typeof granted !== 'boolean' || !purpose || !legalBasis) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const ipAddress = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || undefined;

    await GDPRService.recordConsent(
      {
        userId: session.user.id,
        organizationId: user.organizationId,
        consentType,
        granted,
        purpose,
        legalBasis,
        timestamp: new Date(),
        ipAddress,
        userAgent,
      },
      req
    );

    return NextResponse.json({
      success: true,
      message: 'Consent recorded successfully',
    });
  } catch (error) {
    console.error('Consent recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record consent' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
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
      select: { organizationId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const consents = await GDPRService.getUserConsent(session.user.id, user.organizationId);

    return NextResponse.json({
      success: true,
      consents,
    });
  } catch (error) {
    console.error('Get consent error:', error);
    return NextResponse.json(
      { error: 'Failed to get consent records' },
      { status: 500 }
    );
  }
}