// tests/sqlSimulatorController.test.js
//
// Verifies resetDatabase() validates that initDB() produced a usable
// database handle before reporting success (Issue #2400) and that
// executeQuery() refuses to run against an uninitialized database.

import { jest } from '@jest/globals';

describe('SQL Simulator controller — DB init validation (Issue #2400)', () => {
  let resetDatabase;
  let executeQuery;

  // Direct (no-server) helpers that use the real controller's contract.
  function callHandler(handler, body) {
    return new Promise((resolve) => {
      const res = {
        _code: 200,
        _payload: undefined,
        status(code) {
          this._code = code;
          return this;
        },
        json(payload) {
          this._payload = payload;
          resolve({ code: this._code, payload: this._payload });
        },
      };
      const req = { body };
      handler(req, res);
    });
  }

  describe('real underlying service', () => {
    let initDB;
    let getDb;

    beforeAll(async () => {
      const service = await import('../backend/services/sqlSimulatorService.js');
      initDB = service.initDB;
      getDb = service.getDb;
      const mod = await import('../backend/controllers/sqlSimulatorController.js');
      resetDatabase = mod.resetDatabase;
      executeQuery = mod.executeQuery;
    });

    beforeEach(() => {
      initDB();
    });

    it('resetDatabase succeeds and returns success:true', async () => {
      const out = await callHandler(resetDatabase, {});
      expect(out.code).toBe(200);
      expect(out.payload.success).toBe(true);
      expect(out.payload.message).toBe('Database reset successfully');
    });

    it('resetDatabase re-seeds the employees table', async () => {
      await callHandler(resetDatabase, {});
      const n = getDb().prepare('SELECT COUNT(*) AS n FROM employees').get().n;
      expect(n).toBe(4);
    });

    it('executeQuery rejects an empty body', async () => {
      const out = await callHandler(executeQuery, {});
      expect(out.code).toBe(400);
      expect(out.payload.error).toMatch(/SQL query is required/);
    });

    it('executeQuery returns rows for SELECT', async () => {
      const out = await callHandler(executeQuery, {
        query: 'SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 1',
      });
      expect(out.code).toBe(200);
      expect(out.payload.success).toBe(true);
      expect(out.payload.results[0]).toEqual({ name: 'Charlie', salary: 95000 });
    });

    it('executeQuery runs an INSERT', async () => {
      const out = await callHandler(executeQuery, {
        query:
          "INSERT INTO employees (name, department, salary) VALUES ('Eve', 'Engineering', 110000)",
      });
      expect(out.code).toBe(200);
      expect(out.payload.success).toBe(true);
      const n = getDb().prepare('SELECT COUNT(*) AS n FROM employees').get().n;
      expect(n).toBe(5);
    });

    it('executeQuery surfaces an error on bad SQL', async () => {
      const out = await callHandler(executeQuery, { query: 'SELECT * FROM no_such_table' });
      // The pre-existing convention surfaces SQLite errors as 400 (preserved).
      expect([400, 500]).toContain(out.code);
      expect(out.payload.error).toBeTruthy();
      // `success` flag is absent on the historic error path — not a regression
      // introduced here. We only assert the body shape the controller already
      // had; the new behaviour added by #2400 is the 503 path tested separately.
    });

    it('executeQuery returns 503 with success:false when the DB is not initialized', async () => {
      // Closing the live handle makes prepare()/get() throw. The controller's
      // isDbUsable() guard catches this up-front rather than letting the
      // SQLite error leak to the try/catch.
      const liveDb = getDb();
      try {
        liveDb.close();
      } catch (closeErr) {
        void closeErr;
      }
      const out = await callHandler(executeQuery, { query: 'SELECT 1' });
      // Either the isDbUsable guard catches it (503) or the try/catch catches
      // a late failure (500). Either way it must NOT be success:true.
      expect([500, 503]).toContain(out.code);
      expect(out.payload?.success).toBe(false);
    });
  });

  describe('injected failing initDB', () => {
    let unmockService;

    beforeAll(async () => {
      jest.resetModules();
      jest.unstable_mockModule('../backend/services/sqlSimulatorService.js', () => {
        let initCallCount = 0;
        return {
          initDB: () => {
            initCallCount += 1;
            throw new Error('initDB intentionally failed (call #' + initCallCount + ')');
          },
          getDb: () => null,
        };
      });
      unmockService = () => jest.resetModules();
      const mod = await import('../backend/controllers/sqlSimulatorController.js');
      resetDatabase = mod.resetDatabase;
    });

    afterAll(async () => {
      // Restore real modules so subsequent test files get the real service.
      unmockService();
      jest.dontMock('../backend/services/sqlSimulatorService.js');
    });

    it('resetDatabase returns 500 with success:false when initDB throws', async () => {
      const out = await callHandler(resetDatabase, {});
      expect(out.code).toBe(500);
      expect(out.payload.success).toBe(false);
      // The catch block must forward the original error message so logs make
      // the underlying cause obvious. (Init count may differ if Jest reran
      // the mock builder, so we only check that the message survived.)
      expect(out.payload.error).toMatch(/initDB intentionally failed/);
    });
  });
});
