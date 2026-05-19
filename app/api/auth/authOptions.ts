// app/api/auth/authOptions.ts
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { JWT } from "next-auth/jwt";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id:    user.id,
          email: user.email,
          name:  user.name,
          image: user.image,
          role:  user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // OAuth sign-in: upsert user into DB
      if (account?.provider && account.provider !== "credentials") {
        try {
          await prisma.user.upsert({
            where: { email: user.email ?? "" },
            update: {
              name:  user.name,
              image: user.image,
            },
            create: {
              email: user.email ?? "",
              name:  user.name,
              image: user.image,
              // role defaults to FREE per schema
            },
          });
        } catch (error) {
          console.error("signIn upsert error:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      // Persist role + id on the token at first sign-in
      if (user) {
        token.id   = user.id;
        token.role = (user as any).role ?? "FREE";
      }

      // Re-fetch role from DB when the client calls session.update() — this is
      // triggered after a successful plan upgrade so the JWT reflects the new role
      // without requiring the user to re-login.
      if (trigger === "update" && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          if (dbUser) token.role = dbUser.role;
        } catch {
          // Non-fatal: keep existing token role on DB error
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Expose id + role on the client-side session
      if (session.user) {
        (session.user as any).id   = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};