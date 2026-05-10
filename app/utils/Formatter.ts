import {Duration, type DurationUnit} from "luxon"
import {Option} from "~/types/Option"

type ByteUnit = "B" | "kB" | "MB" | "GB"

type ByteSize = {
  readonly floor: number
  readonly unit: ByteUnit
}

const BYTE: ByteSize = {
  floor: 1,
  unit: "B",
}

const KILO_BYTE: ByteSize = {
  floor: 1000,
  unit: "kB",
}

const MEGA_BYTE: ByteSize = {
  floor: 1000 * KILO_BYTE.floor,
  unit: "MB",
}

const GIGA_BYTE: ByteSize = {
  floor: 1000 * MEGA_BYTE.floor,
  unit: "GB",
}

export const humanReadableSize = (size: number, alwaysShowDecimals = false, separator: string = ""): string => {
  const byteSize = Option.fromNullable(
    [GIGA_BYTE, MEGA_BYTE, KILO_BYTE].find((byteSize) => byteSize.floor < size)
  ).getOrElse(() => BYTE)

  return `${(size / byteSize.floor).toFixed(byteSize.unit === GIGA_BYTE.unit || alwaysShowDecimals ? 2 : 0)}${separator}${
    byteSize.unit
  }`
}


export const humanReadableDuration = (duration: Duration): string => {
  const rescaledDuration = duration.rescale()
  const durationUnits = ["hour", "minute", "second"] as DurationUnit[]

  const stringValue =
    durationUnits
      .map<[number, DurationUnit]>(unit => [rescaledDuration.get(unit), unit])
      .filter(([value, _]) => value > 0)
      .map(([value, unit]) => `${value} ${unit}${value > 1 ? "s" : ""}`)
      .join(" ")

  return stringValue
}

export const shortHumanReadableDuration = (duration: Duration): string => {
  const rescaledDuration = duration.rescale()

  if (rescaledDuration.hours >= 1) {
    return `${rescaledDuration.hours}:${formatTwoDigits(rescaledDuration.minutes)}:${formatTwoDigits(rescaledDuration.seconds)}`
  } else {
    return `${rescaledDuration.minutes}:${formatTwoDigits(rescaledDuration.seconds)}`
  }
}

const formatTwoDigits = (number: number): string => (number < 10 ? `0${number}` : number.toString())
