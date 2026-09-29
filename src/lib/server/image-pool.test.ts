import { beforeEach, describe, expect, it, vi } from 'vitest';

const countResult = vi.fn();
const selectFrom = vi.fn();
const orderBy = vi.fn();
const limit = vi.fn();
const deleteWhere = vi.fn();

vi.mock('$lib/server/db', () => ({
  db: {
    select: vi.fn((shape) => {
      if (shape && 'total' in shape) {
        return { from: vi.fn(() => countResult()) };
      }
      return {
        from: selectFrom,
      };
    }),
    delete: vi.fn(() => ({ where: deleteWhere })),
  },
}));

vi.mock('$lib/server/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

selectFrom.mockReturnValue({ orderBy });
orderBy.mockReturnValue({ limit });

const { MAX_STORED_IMAGES, pruneStoredImages } = await import('./image-pool');
const { logger } = await import('$lib/server/logger');

describe('pruneStoredImages', () => {
  beforeEach(() => {
    countResult.mockReset();
    limit.mockReset();
    deleteWhere.mockReset();
    orderBy.mockClear();
    vi.mocked(logger.info).mockClear();
  });

  it('does nothing when at or below the cap', async () => {
    countResult.mockResolvedValue([{ total: MAX_STORED_IMAGES }]);

    await expect(pruneStoredImages()).resolves.toBe(0);
    expect(limit).not.toHaveBeenCalled();
    expect(deleteWhere).not.toHaveBeenCalled();
  });

  it('deletes the oldest rows above the cap', async () => {
    countResult.mockResolvedValue([{ total: MAX_STORED_IMAGES + 2 }]);
    limit.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    deleteWhere.mockResolvedValue(undefined);

    await expect(pruneStoredImages()).resolves.toBe(2);
    expect(limit).toHaveBeenCalledWith(2);
    expect(deleteWhere).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ deleted: 2, maxStored: MAX_STORED_IMAGES }),
      'pruned stored images',
    );
  });
});
