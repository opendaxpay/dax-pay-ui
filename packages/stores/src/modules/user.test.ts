import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useUserStore } from './user';

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('returns correct userInfo', () => {
    const store = useUserStore();
    const userInfo: any = { name: 'Jane Doe' };
    store.setUserInfo(userInfo);
    expect(store.userInfo).toEqual(userInfo);
  });

  it('clears userInfo when setting null userInfo', () => {
    const store = useUserStore();
    store.setUserInfo({
      name: 'Test User',
    } as any);
    expect(store.userInfo).not.toBeNull();

    store.setUserInfo(null as any);
    expect(store.userInfo).toBeNull();
  });
});
