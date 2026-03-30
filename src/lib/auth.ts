import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        if (credentials.email === process.env.TEST_USER_EMAIL && credentials.password === process.env.TEST_USER_PASSWORD) {
          return { id: "user_vp_001", name: "Sarah Mitchell", email: credentials.email };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) { if (user) token.id = user.id; return token; },
    async session({ session, token }) {
      if (session.user && token.id) (session.user as { id?: string }).id = token.id as string;
      return session;
    },
  },
};
