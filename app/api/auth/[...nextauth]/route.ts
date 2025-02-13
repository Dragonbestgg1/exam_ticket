import { authOptions } from '@/app/lib/auth-options'; // Import at top
import NextAuth from "next-auth";

const handler = NextAuth(authOptions); // Use imported authOptions

export { handler as GET, handler as POST };