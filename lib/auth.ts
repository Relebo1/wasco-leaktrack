import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role as string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      // Refresh role and active state on every session read so role changes and
      // deactivation take effect for existing JWT sessions as well.
      if (token.id) {
        const current = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { role: true, isActive: true },
        });
        token.disabled = !current?.isActive;
        if (current?.isActive) token.role = current.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.disabled) return null as never;
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) await prisma.auditLog.create({ data: { userId: user.id, action: "USER_SIGNED_IN" } });
    },
    async signOut(message) {
      const id = "token" in message ? (message.token as { id?: string } | null)?.id : message.session?.userId;
      if (id) await prisma.auditLog.create({ data: { userId: id, action: "USER_SIGNED_OUT" } });
    },
  },
});
