export const clone = (value: any): any => {
  if (value instanceof Date) {return new Date(value);}
  if (Array.isArray(value)) {return value.map(clone);}
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
  }
  return value;
};

class Ref {
  constructor(public path: string, private store: Store) {}
  get id() {return this.path.split('/').pop()!;}
  collection(name: string) {return new Query(`${this.path}/${name}`, this.store);}
}

class Query {
  filters: Array<[string, string, unknown]> = [];
  ordering: Array<[string, string]> = [];
  count = Infinity;
  cursor: any;
  constructor(public path: string, private store: Store) {}
  private copy() {
    const query = new Query(this.path, this.store);
    Object.assign(query, {filters: [...this.filters], ordering: [...this.ordering], count: this.count, cursor: this.cursor});
    return query;
  }
  doc(id: string) {return new Ref(`${this.path}/${id}`, this.store);}
  where(field: string, op: string, value: unknown) {
    const query = this.copy(); query.filters.push([field, op, value]); return query;
  }
  orderBy(field: string, direction = 'asc') {
    const query = this.copy(); query.ordering.push([field, direction]); return query;
  }
  limit(count: number) {const query = this.copy(); query.count = count; return query;}
  startAfter(cursor: any) {const query = this.copy(); query.cursor = cursor; return query;}
  async get() {return this.read();}
  read() {
    const compare = (left: any, right: any) => {
      for (const [field, direction] of this.ordering) {
        const a = left.data()[field], b = right.data()[field];
        if (a !== b) {return (a < b ? -1 : 1) * (direction === 'desc' ? -1 : 1);}
      }
      return left.id.localeCompare(right.id);
    };
    const docs = [...this.store.docs.keys()].filter(path => {
      if (!path.startsWith(this.path + '/') || path.slice(this.path.length + 1).includes('/')) {return false;}
      const data = this.store.docs.get(path);
      return this.filters.every(([field, op, value]) => {
        if (op === '==') {return data[field] === value;}
        if (op === 'in') {return (value as any[]).includes(data[field]);}
        if (op === '>=') {return data[field] >= (value as number);}
        if (op === '<') {return data[field] < (value as number);}
        if (op === '<=') {return data[field] <= (value as number);}
        throw new Error('Unsupported filter');
      });
    }).map(path => this.store.snapshot(path)).sort(compare)
      .filter(doc => !this.cursor || compare(doc, this.cursor) > 0).slice(0, this.count);
    return {docs, size: docs.length, empty: docs.length === 0};
  }
}

// Serializable transactions with rollback and strict read-before-write checks.
// This models our application invariants, not the Firebase service itself.
export class Store {
  docs = new Map<string, any>();
  writeTimes = new Map<string, number>();
  failNextReads = new Set<string>();
  queue: Promise<unknown> = Promise.resolve();
  collection(name: string) {return new Query(name, this);}
  put(path: string, value: any, updatedAt: number) {
    this.docs.set(path, value); this.writeTimes.set(path, updatedAt);
  }
  snapshot(path: string) {
    const data = clone(this.docs.get(path));
    return {id: path.split('/').pop()!, exists: this.docs.has(path), data: () => clone(data),
      updateTime: this.writeTimes.has(path) ? {toMillis: () => this.writeTimes.get(path)} : undefined};
  }
  runTransaction(callback: any) {
    const result = this.queue.then(async () => {
      const writes: Array<[string, any]> = [];
      const tx = {
        get: async (ref: Ref | Query) => {
          if (writes.length) {throw new Error('Read after write');}
          if (ref instanceof Ref) {
            if (this.failNextReads.delete(ref.path)) {throw new Error('Temporary read failure');}
            return this.snapshot(ref.path);
          }
          return ref.read();
        },
        set: (ref: Ref, value: any) => writes.push([ref.path, clone(value)]),
      };
      const answer = await callback(tx);
      writes.forEach(([path, data]) => this.docs.set(path, data));
      return answer;
    });
    this.queue = result.catch(() => undefined);
    return result;
  }
}
