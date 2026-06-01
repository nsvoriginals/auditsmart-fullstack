// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { attributeTeamReferral, TEAM_REFERRAL_COOKIE } from "@/lib/teams";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user + free subscription atomically
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          // role defaults to FREE per schema @default(FREE)
          totalAudits:        0,
          currentMonthAudits: 0,
          lastAuditReset:     new Date(),
        },
      });

      await tx.subscription.create({
        data: {
          userId:           newUser.id,
          // plan defaults to FREE per schema @default(FREE)
          // status defaults to ACTIVE per schema @default(ACTIVE)
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return newUser;
    });

    // Attribute team referral if a code cookie is present. Best-effort —
    // never block account creation on attribution failure.
    const teamCode = req.cookies.get(TEAM_REFERRAL_COOKIE)?.value;
    if (teamCode) {
      await attributeTeamReferral(user.id, teamCode).catch(err =>
        console.error("team referral attribution failed:", err)
      );
    }

    // Never return password hash to client
    const { password: _pw, ...userWithoutPassword } = user;

    const res = NextResponse.json(
      { user: userWithoutPassword, message: "Account created successfully" },
      { status: 201 }
    );
    // Clear the cookie after use so a returning user can't re-attribute themselves.
    if (teamCode) res.cookies.set(TEAM_REFERRAL_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}