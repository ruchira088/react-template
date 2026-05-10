import { Option } from "~/types/Option"

export const maybeString = (text: string): Option<string> =>
  Option.fromNullable(text).filter((value) => value.trim().length !== 0)
