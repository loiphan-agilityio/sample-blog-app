import { reloadOnStaleChunk } from '../stale-chunk';

describe('reloadOnStaleChunk', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  const setup = (start = 1_000_000) => {
    let time = start;
    const reload = vi.fn();
    const handler = reloadOnStaleChunk({ reload, now: () => time });

    return {
      reload,
      fire: () => {
        const event = new Event('vite:preloadError', { cancelable: true });
        handler(event);

        return event;
      },
      advance: (ms: number) => {
        time += ms;
      },
    };
  };

  it('reloads once and keeps Vite from throwing', () => {
    const { reload, fire } = setup();
    expect(fire().defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload again right after a reload, so a missing chunk cannot loop', () => {
    const { reload, fire, advance } = setup();
    fire();
    advance(5_000);
    expect(fire().defaultPrevented).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads again for a later deploy', () => {
    const { reload, fire, advance } = setup();
    fire();
    advance(60_000);
    fire();
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
