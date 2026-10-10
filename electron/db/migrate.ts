import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma-generated-client';

// _prisma_migrationsが無い配布済みDB(db push由来)に、適用済みとして記録するマイグレーション
const BASELINE_MIGRATIONS = [
  '20251104162931_init',
  '20251105143053_added_statsmenu_unique',
  '20251109095548_added_preset',
];

const MIGRATIONS_TABLE_DDL = `CREATE TABLE "_prisma_migrations" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "checksum" TEXT NOT NULL,
  "finished_at" DATETIME,
  "migration_name" TEXT NOT NULL,
  "logs" TEXT,
  "rolled_back_at" DATETIME,
  "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
  "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
)`;

type Migration = {
  name: string;
  checksum: string;
  statements: string[];
};

const loadMigrations = (migrationsDir: string): Migration[] => {
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => {
      const sql = fs.readFileSync(path.join(migrationsDir, name, 'migration.sql'), 'utf-8');
      return {
        name,
        checksum: crypto.createHash('sha256').update(sql).digest('hex'),
        statements: splitStatements(sql),
      };
    });
};

// NOTE: Prisma生成のSQLは文字列リテラル内に`;`を含まない前提で、行末の`;`で分割する
const splitStatements = (sql: string): string[] => {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*--.*$/gm, '')
    .split(/;\s*$/m)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
};

const hasTable = async (prisma: PrismaClient, table: string): Promise<boolean> => {
  const rows = await prisma.$queryRawUnsafe<unknown[]>(
    'SELECT name FROM sqlite_master WHERE type = \'table\' AND name = ?',
    table,
  );
  return rows.length > 0;
};

const recordMigration = async (prisma: Pick<PrismaClient, '$executeRawUnsafe'>, migration: Migration, stepCount: number) => {
  await prisma.$executeRawUnsafe(
    'INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count") VALUES (?, ?, ?, current_timestamp, ?)',
    crypto.randomUUID(),
    migration.checksum,
    migration.name,
    stepCount,
  );
};

// NOTE: マイグレーションSQLのPRAGMAは接続単位で効くため、接続を1本に固定する
const createClient = (dbPath: string) => {
  return new PrismaClient({ datasourceUrl: `file:${dbPath}?connection_limit=1` });
};

const findAppliedNames = async (prisma: PrismaClient): Promise<Set<string>> => {
  const applied = await prisma.$queryRawUnsafe<{ migration_name: string }[]>(
    'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL',
  );
  return new Set(applied.map((row) => row.migration_name));
};

const hasPendingMigrations = async (dbPath: string, migrations: Migration[]): Promise<boolean> => {
  const prisma = createClient(dbPath);

  try {
    if (!(await hasTable(prisma, '_prisma_migrations'))) {
      return true;
    }
    const appliedNames = await findAppliedNames(prisma);
    return migrations.some((m) => !appliedNames.has(m.name));
  }
  finally {
    await prisma.$disconnect();
  }
};

const applyMigrations = async (dbPath: string, migrations: Migration[]) => {
  const prisma = createClient(dbPath);

  try {
    if (!(await hasTable(prisma, '_prisma_migrations'))) {
      // NOTE: テーブル作成と基準化の途中で中断されると、次回起動時に履歴が空のまま適用が走って失敗するため、まとめて確定させる
      const baselines = (await hasTable(prisma, 'Menu'))
        ? migrations.filter((m) => BASELINE_MIGRATIONS.includes(m.name))
        : []; // 既存のテーブルがある場合のみ、配布済みDBとして基準化する
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(MIGRATIONS_TABLE_DDL);
        for (const migration of baselines) {
          await recordMigration(tx, migration, 0);
        }
      });
    }

    const appliedNames = await findAppliedNames(prisma);

    for (const migration of migrations.filter((m) => !appliedNames.has(m.name))) {
      // NOTE: foreign_keys=OFFはトランザクション内では無効なため、トランザクションで包まずバックアップで巻き戻す
      for (const statement of migration.statements) {
        await prisma.$executeRawUnsafe(statement);
      }
      await recordMigration(prisma, migration, migration.statements.length);
    }
  }
  finally {
    await prisma.$disconnect();
  }
};

/**
 * unchanged: DBを変更する前に失敗した
 * restored: 適用中に失敗し、バックアップから復元した
 * restore-failed: 復元にも失敗した(DBが不整合な可能性がある)
 */
export type DatabaseMigrationErrorState = 'unchanged' | 'restored' | 'restore-failed';

export class DatabaseMigrationError extends Error {
  constructor(
    readonly state: DatabaseMigrationErrorState,
    cause: unknown,
  ) {
    super(cause instanceof Error ? cause.message : String(cause), { cause });
  }
}

const restoreBackup = (dbPath: string, backupPath: string) => {
  fs.copyFileSync(backupPath, dbPath);
  fs.rmSync(backupPath);
};

/**
 * 未適用のマイグレーションをDBへ適用する。
 * 未適用がある場合のみ適用前にバックアップを取り、失敗した場合はバックアップから復元した上で`DatabaseMigrationError`を投げる。
 */
export const migrateDatabase = async (dbPath: string, migrationsDir: string) => {
  const backupPath = `${dbPath}.bak`;
  let state: DatabaseMigrationErrorState = 'unchanged';

  try {
    const migrations = loadMigrations(migrationsDir);

    // NOTE: 前回の適用中にクラッシュした場合のみバックアップが残るため、新しいバックアップで上書きする前に復元する
    if (fs.existsSync(backupPath)) {
      state = 'restore-failed';
      restoreBackup(dbPath, backupPath);
      state = 'unchanged';
    }

    if (!(await hasPendingMigrations(dbPath, migrations))) {
      return;
    }

    fs.copyFileSync(dbPath, backupPath);
    state = 'restored';

    try {
      await applyMigrations(dbPath, migrations);
    }
    catch (e) {
      console.error('DefeatFit: DBマイグレーションに失敗したためバックアップから復元します: ', e);
      state = 'restore-failed';
      restoreBackup(dbPath, backupPath);
      state = 'restored';
      throw e;
    }

    fs.rmSync(backupPath);
  }
  catch (e) {
    throw new DatabaseMigrationError(state, e);
  }
};
