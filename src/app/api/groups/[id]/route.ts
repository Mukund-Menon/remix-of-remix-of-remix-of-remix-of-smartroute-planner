import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { groups, groupMembers, trips } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract group id from URL path
    const id = request.nextUrl.pathname.split('/').slice(-1)[0];

    // Validate id is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid group ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const groupId = parseInt(id);

    // Query group by id
    const groupResult = await db.select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (groupResult.length === 0) {
      return NextResponse.json(
        { error: 'Group not found', code: 'GROUP_NOT_FOUND' },
        { status: 404 }
      );
    }

    const group = groupResult[0];

    // Query all group members
    const members = await db.select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));

    // Query trip details if tripId exists
    let tripDetails = null;
    if (group.tripId) {
      const tripResult = await db.select()
        .from(trips)
        .where(eq(trips.id, group.tripId))
        .limit(1);

      if (tripResult.length > 0) {
        tripDetails = tripResult[0];
      }
    }

    // Return group object with members and trip details
    return NextResponse.json({
      ...group,
      members,
      memberCount: members.length,
      trip: tripDetails,
    }, { status: 200 });

  } catch (error) {
    console.error('GET group error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}