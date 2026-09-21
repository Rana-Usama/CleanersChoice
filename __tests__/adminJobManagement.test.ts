import {manageActiveAdminJob} from '../src/services/adminService';

let mockUid: string | null;
let mockAdmin: boolean;
let mockJob: any;
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

jest.mock('@react-native-firebase/auth', () => () => ({
  currentUser: mockUid ? {uid: mockUid} : null,
}));
jest.mock('@react-native-firebase/firestore', () => () => ({
  collection: (collection: string) => ({doc: (id: string) => ({collection, id})}),
  runTransaction: (callback: any) => callback({
    get: async (ref: any) => ({
      id: ref.id,
      exists: ref.collection === 'Users' || !!mockJob,
      data: () => ref.collection === 'Users' ? {admin: mockAdmin} : mockJob,
    }),
    update: mockUpdate,
    delete: mockDelete,
  }),
}));

beforeEach(() => {
  mockUid = 'admin';
  mockAdmin = true;
  mockJob = {jobId: 'admin', status: 'active', title: 'Original', applicants: ['cleaner']};
  jest.clearAllMocks();
});

it('loads an owned active job for the shared form', async () => {
  expect(await manageActiveAdminJob('job', 'read')).toEqual({id: 'job', ...mockJob});
  expect(mockUpdate).not.toHaveBeenCalled();
  expect(mockDelete).not.toHaveBeenCalled();
});

it('updates form fields while preserving lifecycle and ownership', async () => {
  mockJob.jobId = 'customer';
  await manageActiveAdminJob('job', 'update', {
    title: 'Updated', location: {latitude: 31, longitude: 74},
    jobId: 'someone-else', status: 'active', createdAt2: new Date(), applicants: [],
  });
  expect(mockUpdate).toHaveBeenCalledWith({collection: 'Jobs', id: 'job'}, {
    title: 'Updated', location: {latitude: 31, longitude: 74},
  });
});

it('deletes a selected active job posted by another user', async () => {
  mockJob.jobId = 'customer';
  await manageActiveAdminJob('job', 'delete');
  expect(mockDelete).toHaveBeenCalledWith({collection: 'Jobs', id: 'job'});
});

it.each(['read', 'update', 'delete'] as const)('rejects %s after admin access is revoked', async action => {
  mockAdmin = false;
  await expect(manageActiveAdminJob('job', action)).rejects.toThrow('Admin access');
  expect(mockUpdate).not.toHaveBeenCalled();
  expect(mockDelete).not.toHaveBeenCalled();
});

it.each([
  null,
  {jobId: 'admin', status: 'confirmed'},
  {jobId: 'admin', status: 'expired'},
])('rejects edits and deletes when the latest job is unavailable or ineligible: %p', async job => {
  mockJob = job;
  await expect(manageActiveAdminJob('job', 'update', {title: 'Changed'})).rejects.toThrow('active jobs');
  await expect(manageActiveAdminJob('job', 'delete')).rejects.toThrow('active jobs');
  expect(mockUpdate).not.toHaveBeenCalled();
  expect(mockDelete).not.toHaveBeenCalled();
});

it('rejects signed-out access', async () => {
  mockUid = null;
  await expect(manageActiveAdminJob('job', 'delete')).rejects.toThrow('sign in');
  expect(mockDelete).not.toHaveBeenCalled();
});

it('pre-fills another user’s active job for admin editing', async () => {
  mockJob.jobId = 'customer';
  expect(await manageActiveAdminJob('job', 'read')).toEqual({id: 'job', ...mockJob});
});
