import NextAuth from "next-auth";

const handler = NextAuth({
  providers: [], // No providers for now, simplest setup
});

export { handler as GET, handler as POST };