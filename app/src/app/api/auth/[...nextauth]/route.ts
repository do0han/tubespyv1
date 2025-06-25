import NextAuth from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';

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
    async jwt({ token, account }: any) {
      console.log('🔑 JWT Callback - Account:', !!account);
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        console.log('✅ JWT Callback - Token saved:', !!token.accessToken);
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