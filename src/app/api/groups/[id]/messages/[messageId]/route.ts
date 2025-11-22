import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(request: NextRequest) {
  try {
    // Extract group ID and message ID from URL path
    const pathParts = request.nextUrl.pathname.split('/');
    const groupIdParam = pathParts[3];
    const messageIdParam = pathParts[5];

    // Validate group ID
    if (!groupIdParam || isNaN(parseInt(groupIdParam))) {
      return NextResponse.json(
        { error: 'Valid group ID is required', code: 'INVALID_GROUP_ID' },
        { status: 400 }
      );
    }

    // Validate message ID
    if (!messageIdParam || isNaN(parseInt(messageIdParam))) {
      return NextResponse.json(
        { error: 'Valid message ID is required', code: 'INVALID_MESSAGE_ID' },
        { status: 400 }
      );
    }

    const groupId = parseInt(groupIdParam);
    const messageId = parseInt(messageIdParam);

    // Query message by ID
    const messageResult = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    // Check if message exists
    if (messageResult.length === 0) {
      return NextResponse.json(
        { error: 'Message not found', code: 'MESSAGE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const message = messageResult[0];

    // Verify message belongs to the specified group
    if (message.groupId !== groupId) {
      return NextResponse.json(
        { 
          error: 'Message does not belong to this group', 
          code: 'MESSAGE_NOT_IN_GROUP' 
        },
        { status: 400 }
      );
    }

    // Delete the message (no auth check needed)
    const deleted = await db
      .delete(messages)
      .where(eq(messages.id, messageId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete message', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        message: 'Message deleted successfully',
        deletedMessage: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}