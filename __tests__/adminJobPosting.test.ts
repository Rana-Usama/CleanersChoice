import {ADMIN_MODULES} from '../src/constants/adminModules';

describe('Admin job-posting entry', () => {
  it('opens the shared PostJob screen with an admin-origin marker', () => {
    const postJob = ADMIN_MODULES.find(module => module.key === 'postJob');

    expect(postJob).toMatchObject({
      title: 'Post a Job',
      route: 'PostJob',
      enabled: true,
      params: {jobId: null, adminPost: true},
    });
  });
});
