import { z } from "zod/v4"

export enum Theme {
  Light = "light",
  Dark = "dark",
}

export const ApplicationConfiguration = z.object({
  safeMode: z.boolean().default(false),
  theme: z.enum(Theme),
})

export type ApplicationConfiguration = z.infer<typeof ApplicationConfiguration>