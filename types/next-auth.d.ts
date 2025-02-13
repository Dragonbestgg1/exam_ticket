import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      role?: string,
      customVariable?: string
    } & NextAuth.Session["user"]
  }

  interface User {
    role?: string,
    customVariable?: string
  }
}