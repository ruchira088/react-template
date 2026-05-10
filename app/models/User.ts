import {z} from "zod/v4"
import { ZodDateTime } from "~/types/Zod"

export enum Role {
  User ="User",
  Admin = "Admin",
}

export const User = z.object({
  id: z.string(),
  createdAt: ZodDateTime,
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  role: z.enum(Role),
})

export type User = z.infer<typeof User>