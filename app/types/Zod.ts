import { z } from "zod/v4"
import { DateTime, Duration } from "luxon"
import { Option } from "~/types/Option"

export const ZodDuration: z.ZodSchema<Duration> =
  z.object({ length: z.number(), unit: z.string() })
    .transform(({ length, unit }) => Duration.fromObject({ [unit]: length }))

export const ZodDateTime = z.iso.datetime({ offset: true }).transform(value => DateTime.fromISO(value))

export const ZodOptional = <A>(type: z.ZodType<A>) => type.nullish().transform(Option.fromNullable)

export const zodParse = <A>(type: z.ZodType<A>, value: unknown): A => {
  try {
    return type.parse(value)
  } catch (error) {
    console.error(error)
    throw error
  }
}