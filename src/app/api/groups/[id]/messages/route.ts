import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, groups, groupMembers } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract group ID from URL path
    const pathParts = request.nextUrl.pathname.split('/');
    const groupIdParam = pathParts[3];

    if (!groupIdParam || isNaN(parseInt(groupIdParam))) {
      return NextResponse.json(
        { error: 'Valid group ID is required', code: 'INVALID_GROUP_ID' },
        { status: 400 }
      );
    }

    const groupIdInt = parseInt(groupIdParam);

    // Check if group exists
    const group = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupIdInt))
      .limit(1);

    if (group.length === 0) {
      return NextResponse.json(
        { error: 'Group not found', code: 'GROUP_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get all messages for the group
    const groupMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.groupId, groupIdInt))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json(groupMessages, { status: 200 });
  } catch (error) {
    console.error('GET messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Extract group ID from URL path
    const pathParts = request.nextUrl.pathname.split('/');
    const groupIdParam = pathParts[3];

    if (!groupIdParam || isNaN(parseInt(groupIdParam))) {
      return NextResponse.json(
        { error: 'Valid group ID is required', code: 'INVALID_GROUP_ID' },
        { status: 400 }
      );
    }

    const groupIdInt = parseInt(groupIdParam);

    const body = await request.json();
    const { message, senderName } = body;

    // Validate message field
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty', code: 'INVALID_MESSAGE' },
        { status: 400 }
      );
    }

    // Check if group exists
    const group = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupIdInt))
      .limit(1);

    if (group.length === 0) {
      return NextResponse.json(
        { error: 'Group not found', code: 'GROUP_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Insert new message
    const newMessage = await db
      .insert(messages)
      .values({
        groupId: groupIdInt,
        senderName: senderName || 'Anonymous',
        message: message.trim(),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newMessage[0], { status: 201 });
  } catch (error) {
    console.error('POST message error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}