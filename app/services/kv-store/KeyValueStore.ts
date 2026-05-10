import { Option } from "~/types/Option"

export interface Encoder<A, B> {
  encode(value: A): B
}

export interface Decoder<A, B> {
  decode(value: A): B
}

export interface Codec<A, B> extends Encoder<A, B>, Decoder<B, A> {}

export interface KeySpace<K, V> {
  readonly name: string

  readonly keyEncoder: Encoder<K, string>

  readonly valueCodec: Codec<V, string>
}

export interface KeyValueStore<K, V extends {}> {
  put(key: K, value: V): void

  get(key: K): Option<V>

  remove(key: K): Option<V>
}

export class LocalKeyValueStore<K, V extends {}> implements KeyValueStore<K, V> {
  constructor(readonly keySpace: KeySpace<K, V>) {}

  get(key: K): Option<V> {
    const stringValue: Option<string> =
      Option.fromNullable(
        localStorage.getItem(this.stringKey(key))
      )

    return stringValue.map(this.keySpace.valueCodec.decode)
  }

  put(key: K, value: V): void {
    localStorage.setItem(this.stringKey(key), this.keySpace.valueCodec.encode(value))
  }

  remove(key: K): Option<V> {
    const existingValue = this.get(key)
    localStorage.removeItem(this.stringKey(key))

    return existingValue
  }

  stringKey = (key: K): string => `${this.keySpace.name}-${this.keySpace.keyEncoder.encode(key)}`
}
