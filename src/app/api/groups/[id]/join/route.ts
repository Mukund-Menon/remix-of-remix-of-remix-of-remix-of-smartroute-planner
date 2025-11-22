import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { groups, groupMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberName, memberEmail } = body;

    // Validate memberName
    if (!memberName || typeof memberName !== 'string' || memberName.trim() === '') {
      return NextResponse.json(
        { error: 'Member name is required', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    // Extract group id from URL path
    const id = request.nextUrl.pathname.split('/')[3];

    // Validate id is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid group ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const groupId = parseInt(id);

    // Check if group exists
    const existingGroup = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (existingGroup.length === 0) {
      return NextResponse.json(
        { error: 'Group not found', code: 'GROUP_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Add member to group
    const newMembership = await db
      .insert(groupMembers)
      .values({
        groupId: groupId,
        memberName: memberName.trim(),
        memberEmail: memberEmail?.trim() || null,
        role: 'member',
        joinedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(
      {
        message: 'Successfully joined the group',
        membership: newMembership[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/groups/[id]/join error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}