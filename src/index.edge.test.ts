import fetchMock from 'jest-fetch-mock';
import type { EdgeConfigClient } from './types';
import * as pkg from './index.edge';

const connectionString = process.env.EDGE_CONFIG;
const baseUrl = 'https://edge-config.vercel.com/ecfg-1';

// eslint-disable-next-line jest/require-top-level-describe
beforeEach(() => {
  fetchMock.resetMocks();
});

describe('default Edge Config', () => {
  describe('test conditions', () => {
    it('should have an env var called EDGE_CONFIG', () => {
      expect(connectionString).toEqual(
        'https://edge-config.vercel.com/ecfg-1?token=token-1',
      );
    });
  });

  it('should fetch an item from the Edge Config specified by process.env.EDGE_CONFIG', async () => {
    fetchMock.mockResponse(JSON.stringify('bar'));

    await expect(pkg.get('foo')).resolves.toEqual('bar');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/item/foo?version=1`, {
      headers: { Authorization: 'Bearer token-1' },
    });
  });

  describe('get(key)', () => {
    describe('when item exists', () => {
      it('should return the value', async () => {
        fetchMock.mockResponse(JSON.stringify('bar'));

        await expect(pkg.get('foo')).resolves.toEqual('bar');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          `${baseUrl}/item/foo?version=1`,
          { headers: { Authorization: 'Bearer token-1' } },
        );
      });
    });

    describe('when the item does not exist', () => {
      it('should return undefined', async () => {
        fetchMock.mockResponse(
          JSON.stringify({
            error: {
              code: 'edge_config_item_not_found',
              message: 'Could not find the edge config item: foo',
            },
          }),
          {
            status: 404,
            headers: {
              'content-type': 'application/json',
              'x-edge-config-digest': 'fake',
            },
          },
        );

        await expect(pkg.get('foo')).resolves.toEqual(undefined);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          `${baseUrl}/item/foo?version=1`,
          { headers: { Authorization: 'Bearer token-1' } },
        );
      });
    });

    describe('when the edge config does not exist', () => {
      it('should return undefined', async () => {
        fetchMock.mockResponse(
          JSON.stringify({
            error: {
              code: 'edge_config_not_found',
              message: 'Could not find the edge config: ecfg-1',
            },
          }),
          { status: 404, headers: { 'content-type': 'application/json' } },
        );

        await expect(pkg.get('foo')).rejects.toThrow(
          '@vercel/edge-config: Edge Config not found',
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          `${baseUrl}/item/foo?version=1`,
          {
            headers: { Authorization: 'Bearer token-1' },
          },
        );
      });
    });

    describe('when the network fails', () => {
      it('should throw a Network error', async () => {
        fetchMock.mockReject();

        await expect(pkg.get('foo')).rejects.toThrow(
          '@vercel/edge-config: Network error',
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          `${baseUrl}/item/foo?version=1`,
          {
            headers: { Authorization: 'Bearer token-1' },
          },
        );
      });
    });

    describe('when an unexpected status code is returned', () => {
      it('should throw a Unexpected error on 500', async () => {
        fetchMock.mockResponse('', { status: 500 });

        await expect(pkg.get('foo')).rejects.toThrow(
          '@vercel/edge-config: Unexpected error',
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          `${baseUrl}/item/foo?version=1`,
          {
            headers: { Authorization: 'Bearer token-1' },
          },
        );
      });
    });
  });

  describe('getAll(keys)', () => {
    describe('when called without keys', () => {
      it('should return all items', async () => {
        fetchMock.mockResponse(JSON.stringify({ foo: 'foo1' }));

        await expect(pkg.getAll()).resolves.toEqual({ foo: 'foo1' });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/items?version=1`, {
          headers: { Authorization: 'Bearer token-1' },
        });
      });
    });

    describe('when called with keys', () => {
      it('should return the selected items', async () => {
        fetchMock.mockResponse(JSON.stringify({ foo: 'foo1', bar: 'bar1' }));

        await expect(pkg.getAll(['foo', 'bar'])).resolves.toEqual({
          foo: 'foo1',
          bar: 'bar1',
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          `${baseUrl}/items?version=1&key=foo&key=bar`,
          { headers: { Authorization: 'Bearer token-1' } },
        );
      });
    });

    describe('when the edge config does not exist', () => {
      it('should throw', async () => {
        fetchMock.mockResponse(
          JSON.stringify({
            error: {
              code: 'edge_config_not_found',
              message: 'Could not find the edge config: ecfg-1',
            },
          }),
          { status: 404, headers: { 'content-type': 'application/json' } },
        );

        await expect(pkg.getAll(['foo', 'bar'])).rejects.toThrow(
          '@vercel/edge-config: Edge Config not found',
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          `${baseUrl}/items?version=1&key=foo&key=bar`,
          { headers: { Authorization: 'Bearer token-1' } },
        );
      });
    });

    describe('when the network fails', () => {
      it('should throw a Network error', async () => {
        fetchMock.mockReject();

        await expect(pkg.getAll()).rejects.toThrow(
          '@vercel/edge-config: Network error',
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/items?version=1`, {
          headers: { Authorization: 'Bearer token-1' },
        });
      });
    });

    describe('when an unexpected status code is returned', () => {
      it('should throw a Unexpected error on 500', async () => {
        fetchMock.mockResponse('', { status: 500 });

        await expect(pkg.getAll()).rejects.toThrow(
          '@vercel/edge-config: Unexpected error',
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/items?version=1`, {
          headers: { Authorization: 'Bearer token-1' },
        });
      });
    });
  });

  describe('has(key)', () => {
    describe('when item exists', () => {
      it('should return true', async () => {
        fetchMock.mockResponse('');

        await expect(pkg.has('foo')).resolves.toEqual(true);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          `${baseUrl}/item/foo?version=1`,
          {
            method: 'HEAD',
            headers: { Authorization: 'Bearer token-1' },
          },
        );
      });
    });

    describe('when the item does not exist', () => {
      it('should return false', async () => {
        fetchMock.mockResponse(
          JSON.stringify({
            error: {
              code: 'edge_config_item_not_found',
              message: 'Could not find the edge config item: foo',
            },
          }),
          {
            status: 404,
            headers: {
              'content-type': 'application/json',
              'x-edge-config-digest': 'fake',
            },
          },
        );

        await expect(pkg.has('foo')).resolves.toEqual(false);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          `${baseUrl}/item/foo?version=1`,
          {
            method: 'HEAD',
            headers: { Authorization: 'Bearer token-1' },
          },
        );
      });
    });

    describe('when the edge config does not exist', () => {
      it('should return false', async () => {
        fetchMock.mockResponse(
          JSON.stringify({
            error: {
              code: 'edge_config_not_found',
              message: 'Could not find the edge config: ecfg-1',
            },
          }),
          { status: 404, headers: { 'content-type': 'application/json' } },
        );

        await expect(pkg.has('foo')).rejects.toThrow(
          '@vercel/edge-config: Edge Config not found',
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          `${baseUrl}/item/foo?version=1`,
          {
            method: 'HEAD',
            headers: { Authorization: 'Bearer token-1' },
          },
        );
      });
    });
  });

  describe('/', () => {
    describe('when the request succeeds', () => {
      it('should return the digest', async () => {
        fetchMock.mockResponse(JSON.stringify('awe1'));

        await expect(pkg.digest()).resolves.toEqual('awe1');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/digest?version=1`, {
          headers: { Authorization: 'Bearer token-1' },
        });
      });
    });

    describe('when the server returns an unexpected status code', () => {
      it('should throw an Unexpected error on 500', async () => {
        fetchMock.mockResponse('', { status: 500 });

        await expect(pkg.digest()).rejects.toThrow(
          '@vercel/edge-config: Unexpected error',
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/digest?version=1`, {
          headers: { Authorization: 'Bearer token-1' },
        });
      });

      it('should throw an Unexpected error on 404', async () => {
        fetchMock.mockResponse('', { status: 404 });

        await expect(pkg.digest()).rejects.toThrow(
          '@vercel/edge-config: Unexpected error',
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/digest?version=1`, {
          headers: { Authorization: 'Bearer token-1' },
        });
      });
    });

    describe('when the network fails', () => {
      it('should throw a Network error', async () => {
        fetchMock.mockReject();

        await expect(pkg.digest()).rejects.toThrow(
          '@vercel/edge-config: Network error',
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/digest?version=1`, {
          headers: { Authorization: 'Bearer token-1' },
        });
      });
    });
  });
});

// these test the happy path only, as the cases are tested through the
// "default Edge Config" tests above anyhow
describe('createEdgeConfig', () => {
  describe('when running without lambda layer or via edge function', () => {
    const modifiedConnectionString =
      'https://edge-config.vercel.com/ecfg-2?token=token-2';
    const modifiedBaseUrl = 'https://edge-config.vercel.com/ecfg-2';
    let edgeConfig: EdgeConfigClient;

    beforeEach(() => {
      edgeConfig = pkg.createClient(modifiedConnectionString);
    });

    it('should be a function', () => {
      expect(typeof pkg.createClient).toBe('function');
    });

    describe('when called without a baseUrl', () => {
      it('should throw', () => {
        expect(() => pkg.createClient(undefined)).toThrow(
          '@vercel/edge-config: No connection string provided',
        );
      });
    });

    describe('get', () => {
      describe('when item exists', () => {
        it('should fetch using information from the passed token', async () => {
          fetchMock.mockResponse(JSON.stringify('bar'));

          await expect(edgeConfig.get('foo')).resolves.toEqual('bar');

          expect(fetchMock).toHaveBeenCalledTimes(1);
          expect(fetchMock).toHaveBeenCalledWith(
            `${modifiedBaseUrl}/item/foo?version=1`,
            {
              headers: { Authorization: 'Bearer token-2' },
            },
          );
        });
      });
    });

    describe('has(key)', () => {
      describe('when item exists', () => {
        it('should return true', async () => {
          fetchMock.mockResponse('');

          await expect(edgeConfig.has('foo')).resolves.toEqual(true);

          expect(fetchMock).toHaveBeenCalledTimes(1);
          expect(fetchMock).toHaveBeenCalledWith(
            `${modifiedBaseUrl}/item/foo?version=1`,
            {
              method: 'HEAD',
              headers: { Authorization: 'Bearer token-2' },
            },
          );
        });
      });
    });

    describe('digest()', () => {
      describe('when the request succeeds', () => {
        it('should return the digest', async () => {
          fetchMock.mockResponse(JSON.stringify('awe1'));

          await expect(edgeConfig.digest()).resolves.toEqual('awe1');

          expect(fetchMock).toHaveBeenCalledTimes(1);
          expect(fetchMock).toHaveBeenCalledWith(
            `${modifiedBaseUrl}/digest?version=1`,
            {
              headers: { Authorization: 'Bearer token-2' },
            },
          );
        });
      });
    });
  });
});
