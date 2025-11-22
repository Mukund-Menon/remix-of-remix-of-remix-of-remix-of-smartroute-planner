import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, account } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        {
          error: 'Email is required',
          code: 'MISSING_EMAIL',
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          error: 'Name is required',
          code: 'MISSING_NAME',
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          error: 'Password is required',
          code: 'MISSING_PASSWORD',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: 'Invalid email format',
          code: 'INVALID_EMAIL',
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        {
          error: 'Password must be at least 6 characters long',
          code: 'PASSWORD_TOO_SHORT',
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const foundUser = existingUser[0];

    // Check if user already has an account with password
    const existingAccount = await db
      .select()
      .from(account)
      .where(eq(account.userId, foundUser.id))
      .limit(1);

    if (existingAccount.length > 0) {
      console.log(`User ${foundUser.email} already has authentication setup`);
      return NextResponse.json(
        {
          message: 'User already has authentication setup',
          user: {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
          },
          accountCreated: false,
        },
        { status: 200 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique account ID
    const accountId =
      'account_' +
      Date.now() +
      '_' +
      Math.random().toString(36).substring(7);

    // Create account record
    const now = new Date();
    const newAccount = await db
      .insert(account)
      .values({
        id: accountId,
        accountId: email.toLowerCase().trim(),
        providerId: 'credential',
        userId: foundUser.id,
        password: hashedPassword,
        accessToken: null,
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    console.log(
      `Test user setup complete for ${foundUser.email} with account ID ${accountId}`
    );

    return NextResponse.json(
      {
        message: 'Test user setup complete',
        user: {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
        },
        accountCreated: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}