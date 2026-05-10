import {z} from "zod/v4"
import { ZodDateTime } from "~/types/Zod"

export const AuthenticationToken = z.object({
  secret: z.string(),
  expiresAt: ZodDateTime,
  issuedAt: ZodDateTime,
  renewals: z.number(),
})

export type AuthenticationToken = z.infer<typeof AuthenticationToken>