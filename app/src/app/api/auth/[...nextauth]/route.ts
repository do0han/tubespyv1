import NextAuth from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/youtube.readonly',
          prompt: 'consent',
          access_type: 'offline',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      try {
        if (account?.provider === 'google') {
          console.log('🔐 SignIn Callback - Google user:', user.email);
          
          // 데이터베이스에서 사용자 찾거나 생성
          const dbUser = await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name,
              image: user.image,
              googleId: account.providerAccountId,
            },
            create: {
              email: user.email,
              name: user.name,
              image: user.image,
              googleId: account.providerAccountId,
            },
          });
          
          // user 객체에 데이터베이스 ID 추가
          user.id = dbUser.id;
          console.log('✅ SignIn Callback - DB User created/found:', dbUser.id);
        }
        return true;
      } catch (error) {
        console.error('❌ SignIn Callback Error:', error);
        return false;
      }
    },
    async jwt({ token, account, user }: any) {
      console.log('🔑 JWT Callback - Account:', !!account, 'User:', !!user);
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        console.log('✅ JWT Callback - Token saved:', !!token.accessToken);
      }
      if (user) {
        token.id = user.id;
        console.log('✅ JWT Callback - User ID saved:', user.id);
      }
      return token;
    },
    async session({ session, token }: any) {
      console.log('📝 Session Callback - Token exists:', !!token.accessToken);
      if (token.accessToken) {
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
        console.log('✅ Session Callback - AccessToken added to session');
      } else {
        console.log('❌ Session Callback - No accessToken in token');
      }
      if (token.id) {
        session.user.id = token.id;
        console.log('✅ Session Callback - User ID added to session:', token.id);
      } else {
        console.log('❌ Session Callback - No user ID in token');
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/auth/signin',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 