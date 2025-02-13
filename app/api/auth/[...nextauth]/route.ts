import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs';

async function validateCredentials(credentials: any) {
    if (!credentials) return null;
    const { username, password } = credentials;
    const validPassword = await bcrypt.compare(password, await bcrypt.hash(process.env.ADMIN_PASSWORD || 'adminpassword', 10));
    if (username === process.env.ADMIN_USERNAME || (username === 'admin' && validPassword)) {
        return { id: "admin", name: "Admin", username: "admin" };
    }
    return null;
}

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Admin-Panel",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials: any, req: any) {
                return await validateCredentials(credentials);
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async session({ session, token }: any) {
            session.user.role = 'admin';
            session.user.customVariable = "yourVariableValue";
            return session;
        },
        async jwt({ token, user }: any) {
            if (user) {
                token.role = 'admin';
            }
            return token;
        },
        async redirect({ url, baseUrl }) {

            if (url.startsWith("/")) return `${baseUrl}${url}`;

            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl
          },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };