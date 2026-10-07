import {workSessionOperation} from '../functions/src/workSessions/endpoint';
import {executeWorkSessionOperation} from '../functions/src/workSessions/operations';
import {WorkSessionError} from '../functions/src/workSessions/model';

const mockVerifyIdToken = jest.fn();
jest.mock('../functions/node_modules/firebase-admin', () => ({
  auth: () => ({verifyIdToken: mockVerifyIdToken}), firestore: () => 'server-db',
}));
jest.mock('../functions/node_modules/firebase-functions/lib/v2/providers/https', () => ({
  onRequest: (_options: unknown, handler: unknown) => handler,
}));
jest.mock('../functions/src/workSessions/operations', () => ({executeWorkSessionOperation: jest.fn()}));

const operation = executeWorkSessionOperation as jest.Mock;
const response = () => {
  const res: any = {set: jest.fn(), json: jest.fn()};
  res.status = jest.fn(() => res);
  return res;
};
const request = (extra: any = {}) => ({method: 'POST', get: () => 'Bearer token', body: {action: 'clockIn'}, ...extra});
beforeEach(() => {
  jest.clearAllMocks();
  mockVerifyIdToken.mockResolvedValue({uid: 'verified-cleaner'});
});

it('verifies revocation and derives ownership from the token', async () => {
  operation.mockResolvedValue({sessionId: 'session', status: 'active'});
  const res = response();
  const req = request();
  await workSessionOperation(req as any, res);
  expect(mockVerifyIdToken).toHaveBeenCalledWith('token', true);
  expect(operation).toHaveBeenCalledWith('server-db', 'verified-cleaner', req.body);
  expect(res.status).toHaveBeenCalledWith(200);
});

it('rejects unsigned and revoked requests before accessing session data', async () => {
  const unsigned = response();
  await workSessionOperation(request({get: () => ''}) as any, unsigned);
  expect(unsigned.status).toHaveBeenCalledWith(401);
  mockVerifyIdToken.mockRejectedValueOnce(new Error('revoked'));
  const revoked = response();
  await workSessionOperation(request() as any, revoked);
  expect(revoked.status).toHaveBeenCalledWith(401);
  expect(operation).not.toHaveBeenCalled();
});

it('rejects other HTTP methods and reports validation failures without exposing server internals', async () => {
  const get = response();
  await workSessionOperation(request({method: 'GET'}) as any, get);
  expect(get.status).toHaveBeenCalledWith(405);
  operation.mockRejectedValueOnce(new WorkSessionError('permission-denied', 'Not your session.'));
  const denied = response();
  await workSessionOperation(request() as any, denied);
  expect(denied.status).toHaveBeenCalledWith(403);
  expect(denied.json).toHaveBeenCalledWith({error: {code: 'permission-denied', message: 'Not your session.'}});
});
