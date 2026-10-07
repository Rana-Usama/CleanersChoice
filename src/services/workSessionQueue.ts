import type {WorkSessionRequest, WorkSessionResult} from '../types/workSession';

type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
type Draft = Omit<WorkSessionRequest, 'requestId'>;
const signature = (request: Draft) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(request)
        .filter(([key]) => key !== 'requestId')
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  );

/** Persist intent before sending; an uncertain result keeps the exact ID/payload. */
export class WorkSessionQueue {
  private busy = false;
  private key: string;
  constructor(
    uid: string,
    private storage: Storage,
    private makeId: () => string,
    private send: (request: WorkSessionRequest) => Promise<WorkSessionResult>,
  ) {
    this.key = `work-session-operation:${uid}`;
  }

  async pending(): Promise<WorkSessionRequest | null> {
    const saved = await this.storage.getItem(this.key);
    return saved ? JSON.parse(saved) : null;
  }

  async run(draft?: Draft): Promise<WorkSessionResult> {
    if (this.busy) {
      throw new Error('A work update is already being saved.');
    }
    this.busy = true;
    try {
      let request = await this.pending();
      if (request && draft && signature(request) !== signature(draft)) {
        throw new Error(
          'Retry the unfinished work update before making another change.',
        );
      }
      if (!request) {
        if (!draft) {
          throw new Error('There is no unfinished work update.');
        }
        request = {...draft, requestId: this.makeId()};
        await this.storage.setItem(this.key, JSON.stringify(request));
      }
      let result: WorkSessionResult;
      try {
        result = await this.send(request);
      } catch (error) {
        // Domain rejections cannot have committed a successful receipt.
        const code = (error as {code?: string}).code;
        if (
          code &&
          [
            'invalid-argument',
            'permission-denied',
            'failed-precondition',
            'already-exists',
            'unauthenticated',
            'not-found',
          ].includes(code)
        ) {
          await this.storage.removeItem(this.key);
        }
        throw error;
      }
      await this.storage.removeItem(this.key);
      return result;
    } finally {
      this.busy = false;
    }
  }
}
