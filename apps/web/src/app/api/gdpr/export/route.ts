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
      select: { organizationId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { format = 'json', includeDeleted = false } = await req.json();

    if (!['json', 'csv', 'xml'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be json, csv, or xml' },
        { status: 400 }
      );
    }

    const exportData = await GDPRService.exportUserData({
      userId: session.user.id,
      organizationId: user.organizationId,
      format,
      includeDeleted,
    });

    // Set appropriate content type based on format
    const contentTypes = {
      json: 'application/json',
      csv: 'text/csv',
      xml: 'application/xml',
    };

    const response = new NextResponse(
      typeof exportData === 'string' ? exportData : JSON.stringify(exportData, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': contentTypes[format as keyof typeof contentTypes],
          'Content-Disposition': `attachment; filename=\"user-data-export.${format}\"`,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}