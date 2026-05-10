import { None, type Option, Some } from "~/types/Option"

export abstract class Either<L, R> {
  abstract map<R1>(fn: ((value: R) => R1)): Either<L, R1>

  abstract flatMap<R1>(fn: ((value: R) => Either<L, R1>)): Either<L, R1>

  abstract fold<T>(onLeft: (value: L) => T, onRight: (value: R) => T): T

  abstract toOption(): Option<R>

  static fromTry<R>(fn: () => R): Either<Error, R> {
    try {
      return Right.of(fn())
    } catch (e) {
      return Left.of(e as Error)
    }
  }
}

export class Right<L, R> extends Either<L, R> {
  constructor(public readonly value: R) {
    super()
  }

  map<R1>(fn: (value: R) => R1): Either<L, R1> {
    return Right.of(fn(this.value))
  }

  flatMap<R1>(fn: (value: R) => Either<L, R1>): Either<L, R1> {
    return fn(this.value)
  }

  fold<T>(onLeft: (value: L) => T, onRight: (value: R) => T): T {
    return onRight(this.value)
  }

  toOption(): Option<R> {
    return Some.of(this.value)
  }


  static of<L, R>(value: R): Either<L, R> {
    return new Right(value)
  }
}

export class Left<L, R> extends Either<L, R> {
  constructor(public readonly value: L) {
    super()
  }

  map<R1>(_fn: (value: R) => R1): Either<L, R1> {
    return Left.of(this.value)
  }

  flatMap<R1>(_fn: (value: R) => Either<L, R1>): Either<L, R1> {
    return Left.of(this.value)
  }

  fold<T>(onLeft: (value: L) => T, _onRight: (value: R) => T): T {
    return onLeft(this.value)
  }

  toOption(): Option<R> {
    return None.of()
  }

  static of<L, R>(value: L): Either<L, R> {
    return new Left(value)
  }
}