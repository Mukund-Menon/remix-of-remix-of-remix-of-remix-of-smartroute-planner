import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { groups, groupMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tripId } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ 
        error: 'Name is required and must be a non-empty string',
        code: 'MISSING_NAME' 
      }, { status: 400 });
    }

    // Validate tripId if provided
    if (tripId !== undefined && tripId !== null) {
      const parsedTripId = parseInt(tripId);
      if (isNaN(parsedTripId)) {
        return NextResponse.json({ 
          error: 'Trip ID must be a valid integer',
          code: 'INVALID_TRIP_ID' 
        }, { status: 400 });
      }
    }

    const now = new Date().toISOString();

    // Create the group - NO createdBy needed
    const newGroup = await db.insert(groups)
      .values({
        name: name.trim(),
        tripId: tripId ? parseInt(tripId) : null,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (newGroup.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to create group',
        code: 'CREATE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json(newGroup[0], { status: 201 });

  } catch (error) {
    console.error('POST /api/groups error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all groups
    const allGroups = await db.select().from(groups);

    // Enrich each group with member information
    const enrichedGroups = await Promise.all(
      allGroups.map(async (group) => {
        // Get all members for this group
        const members = await db.select()
        .from(groupMembers)
        .where(eq(groupMembers.groupId, group.id));

        return {
          ...group,
          memberCount: members.length,
          members: members,
        };
      })
    );

    return NextResponse.json(enrichedGroups);

  } catch (error) {
    console.error('GET /api/groups error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}