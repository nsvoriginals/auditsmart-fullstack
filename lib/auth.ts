// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";

// Extend the built-in session types - remove duplicate id declarations
declare module "next-auth" {
  interface User {
    role?: string;
    plan?: string;
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role?: string;
      plan?: string;
      image?: string | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    plan?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { subscription: true }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.subscription?.plan || user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: { user: any; account: any }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { accounts: true, subscription: true }
          });

          if (!existingUser) {
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                role: "FREE",
                accounts: {
                  create: {
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    access_token: account.access_token,
                    refresh_token: account.refresh_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                  }
                },
                subscription: {
                  create: {
                    plan: "FREE",
                    status: "ACTIVE",
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  }
                }
              },
              include: { subscription: true }
            });
            
            user.id = newUser.id;
            user.role = newUser.role;
            (user as any).plan = newUser.subscription?.plan;
          } else {
            user.id = existingUser.id;
            user.role = existingUser.role;
            (user as any).plan = existingUser.subscription?.plan;
          }
          
          return true;
        } catch (error) {
          console.error("Error in OAuth signIn:", error);
          return false;
        }
      }
      
      return true;
    },
    
    async jwt({ token, user, trigger, session }: { token: any; user: any; trigger?: string; session?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.plan = user.plan;
      }
      
      if (trigger === "update" && session?.user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: { subscription: true }
        });
        
        if (dbUser) {
          token.role = dbUser.role;
          token.plan = dbUser.subscription?.plan;
        }
      }
      
      return token;
    },
    
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.plan = token.plan;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

// Helper function to get session in API routes
export async function getSession() {
  return await getServerSession(authOptions);
}

// Helper to get user with subscription
export async function getUserWithSubscription(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
    },
  });
}