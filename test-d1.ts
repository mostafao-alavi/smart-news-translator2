import Database from 'better-sqlite3';
const sqlite = new Database('local_d1.sqlite');

export const mockD1 = {
  prepare: (query: string) => {
    return {
      bind: (...params: any[]) => {
        return {
          all: async <T = any>() => {
            const stmt = sqlite.prepare(query);
            const results = stmt.all(...params) as T[];
            return { success: true, results };
          },
          run: async () => {
            const stmt = sqlite.prepare(query);
            const info = stmt.run(...params);
            return {
              success: true,
              meta: { changes: info.changes, last_row_id: info.lastInsertRowid }
            };
          },
          first: async <T = any>() => {
            const stmt = sqlite.prepare(query);
            const result = stmt.get(...params) as T | undefined;
            return result || null;
          }
        };
      },
      all: async <T = any>() => {
        const stmt = sqlite.prepare(query);
        const results = stmt.all() as T[];
        return { success: true, results };
      },
      run: async () => {
        const stmt = sqlite.prepare(query);
        const info = stmt.run();
        return {
          success: true,
          meta: { changes: info.changes, last_row_id: info.lastInsertRowid }
        };
      },
      first: async <T = any>() => {
        const stmt = sqlite.prepare(query);
        const result = stmt.get() as T | undefined;
        return result || null;
      }
    };
  },
  batch: async (statements: any[]) => {
    const results = [];
    sqlite.exec('BEGIN');
    try {
      for (const stmt of statements) {
         results.push(await stmt.run());
      }
      sqlite.exec('COMMIT');
      return results;
    } catch (e) {
      sqlite.exec('ROLLBACK');
      throw e;
    }
  },
  exec: async (query: string) => {
    sqlite.exec(query);
    return { success: true };
  }
};

import { ensureTablesAndLogs } from './src/api/routes.ts';
async function test() {
   await ensureTablesAndLogs(mockD1, true);
   const sources = await mockD1.prepare("SELECT * FROM sources").all();
   console.log("Sources after ensure:", sources);
}
test();
