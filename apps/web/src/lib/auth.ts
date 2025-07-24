import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@awcrm/database';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        mfaToken: { label: 'MFA Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            mfaSettings: true,
          },
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        // Check MFA if enabled
        if (user.mfaSettings?.enabled) {
          if (!credentials.mfaToken) {
            throw new Error('MFA_REQUIRED');
          }

          const speakeasy = require('speakeasy');
          const verified = speakeasy.totp.verify({
            secret: user.mfaSettings.secret,
            encoding: 'base32',
            token: credentials.mfaToken,
            window: 2,
          });

          if (!verified) {
            throw new Error('INVALID_MFA_TOKEN');
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
      }

      return session;
    },
    async jwt({ token, user }) {
      const dbUser = await prisma.user.findFirst({
        where: {
          email: token.email as string,
        },
      });

      if (!dbUser) {
        if (user) {
          token.id = user.id;
        }
        return token;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        picture: token.picture,
      };
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log successful sign-in
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'SIGN_IN',
          resource: 'AUTH',
          details: {
            provider: account?.provider,
            ip: '', // Will be filled by middleware
          },
        },
      });
    },
    async signOut({ token }) {
      // Log sign-out
      if (token?.id) {
        await prisma.auditLog.create({
          data: {
            userId: token.id as string,
            action: 'SIGN_OUT',
            resource: 'AUTH',
            details: {},
          },
        });
      }
    },
  },
};