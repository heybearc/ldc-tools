import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      adminLevel?: string
      volunteerId?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name: string | null
    role: string
    adminLevel?: string
    volunteerId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    adminLevel?: string
    volunteerId?: string
    passwordStamp?: string
    invalid?: boolean
  }
}
