import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(unsubscribePage("Invalid link", "No unsubscribe token provided."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return new NextResponse(unsubscribePage("Invalid link", "This unsubscribe link is not valid."), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (!subscriber.isActive) {
      return new NextResponse(
        unsubscribePage("Already unsubscribed", "You've already been removed from this list."),
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    await prisma.newsletterSubscriber.update({
      where: { unsubscribeToken: token },
      data: { isActive: false },
    });

    return new NextResponse(
      unsubscribePage("You've been unsubscribed.", "You won't receive any more emails from us."),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new NextResponse(unsubscribePage("Error", "Something went wrong. Please try again."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

function unsubscribePage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0a0a;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', Helvetica, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      max-width: 420px;
      width: 100%;
      text-align: center;
    }
    .brand {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #71717a;
      margin-bottom: 32px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1.1;
      margin-bottom: 12px;
    }
    p {
      color: #71717a;
      font-size: 15px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="card">
    <p class="brand">The Fearless</p>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
