import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MFAService } from '@/lib/mfa';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const newBackupCodes = await MFAService.regenerateBackupCodes(session.user.id, token);

    if (!newBackupCodes) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      backupCodes: newBackupCodes,
    });
  } catch (error) {
    console.error('Backup codes regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate backup codes' },
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

    const recoveryInfo = await MFAService.getMFARecoveryInfo(session.user.id);

    return NextResponse.json({
      success: true,
      data: recoveryInfo,
    });
  } catch (error) {
    console.error('MFA recovery info error:', error);
    return NextResponse.json(
      { error: 'Failed to get recovery info' },
      { status: 500 }
    );
  }
}