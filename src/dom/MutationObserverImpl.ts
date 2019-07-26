import {
  MutationObserver, Node, MutationObserverInit, MutationRecord,
  MutationCallback, RegisteredObserver, TransientRegisteredObserver
} from "./interfaces"

/**
 * Represents an object that can be used to observe mutations to the tree of
 * nodes.
 */
export class MutationObserverImpl implements MutationObserver {

  private _callback: MutationCallback
  private _nodeList: Node[] = []
  private _recordQueue: MutationRecord[] = []

  /**
   * Initializes a new instance of `MutationObserver`.
   *
   * @param callback - the callback function
   */
  public constructor(callback: MutationCallback) {
    this._callback = callback
    // TODO: Append this to relevant agent's mutation observers.
  }

  /** @inheritdoc */
  observe(target: Node, options?: MutationObserverInit): void {
    options = options || {
      childList: false,
      subtree: false
    }

    if ((options.attributeOldValue !== undefined || options.attributeFilter !== undefined) &&
      options.attributes !== undefined) {
      options.attributes = true
    }
    if (options.characterDataOldValue !== undefined && options.characterData === undefined) {
      options.characterData = true
    }
    if (!options.childList && !options.attributes && !options.characterData) {
      throw new TypeError()
    }
    if (options.attributeOldValue && !options.attributes) {
      throw new TypeError()
    }
    if (options.attributeFilter !== undefined && !options.attributes) {
      throw new TypeError()
    }
    if (options.characterDataOldValue && !options.characterData) {
      throw new TypeError()
    }

    const observers: Array<RegisteredObserver | TransientRegisteredObserver> =
      (<any><unknown>target)._registeredObservers

    let isRegistered = false
    for (const registered of observers) {
      if (registered.observer === this) {
        isRegistered = true
        for (const node of this._nodeList) {
          const toRemove: Array<TransientRegisteredObserver> = []
          const transientObservers: Array<RegisteredObserver | TransientRegisteredObserver> =
            (<any><unknown>node)._registeredObservers
          for (const transient of transientObservers) {
            if ((<TransientRegisteredObserver>transient).source === registered) {
              toRemove.push(<TransientRegisteredObserver>transient)
            }
          }
          for (const transient of toRemove) {
            const index = transientObservers.indexOf(transient)
            transientObservers.splice(index, 1)
          }
        }
        registered.options = options
      }
    }

    if (!isRegistered) {
      observers.push({ observer: this, options: options })
      this._nodeList.push(target)
    }
  }

  /** @inheritdoc */
  disconnect(): void {
    for (const node of this._nodeList) {
      const toRemove: Array<RegisteredObserver> = []
      const observers: Array<RegisteredObserver> =
        (<any><unknown>node)._registeredObservers
      for (const observer of observers) {
        if (observer.observer = this) {
          toRemove.push(observer)
        }
      }
      for (const observer of toRemove) {
        const index = observers.indexOf(observer)
        observers.splice(index, 1)
      }
    }

    this._recordQueue = []
  }

  /** @inheritdoc */
  takeRecords(): MutationRecord[] {
    const records = this._recordQueue
    this._recordQueue = []
    return records
  }

}