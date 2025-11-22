import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { groups, groupMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Extract group ID from URL path
    const id = request.nextUrl.pathname.split('/')[3];
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid group ID is required',
        code: 'INVALID_GROUP_ID' 
      }, { status: 400 });
    }

    const groupId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { memberName, memberEmail } = body;

    // Validate member name is provided
    if (!memberName || typeof memberName !== 'string' || memberName.trim() === '') {
      return NextResponse.json({ 
        error: 'Member name is required',
        code: 'MISSING_MEMBER_NAME' 
      }, { status: 400 });
    }

    // Verify group exists
    const groupResult = await db.select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (groupResult.length === 0) {
      return NextResponse.json({ 
        error: 'Group not found',
        code: 'GROUP_NOT_FOUND' 
      }, { status: 404 });
    }

    // Add member to group
    const newMember = await db.insert(groupMembers).values({
      groupId,
      memberName: memberName.trim(),
      memberEmail: memberEmail?.trim() || null,
      role: 'member',
      joinedAt: new Date().toISOString()
    }).returning();

    return NextResponse.json({
      message: 'Member invited successfully',
      member: newMember[0]
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/groups/[id]/invite error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}