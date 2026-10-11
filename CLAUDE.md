# CLAUDE.md

このファイルは、本リポジトリのコードを扱う際に Claude Code (claude.ai/code) へ向けた指針を提供する。

## 概要

DefeatFit: OSCメッセージ（VRChatアバターギミックでの負け）の受信回数に応じて筋トレを促すElectronデスクトップアプリ（Windows向け）。Electron + Vue 3 + Vuetify + Pinia + Prisma(SQLite)。UI・コミット・コメントは日本語。

## コマンド

- `npm run dev` — Vite + vite-plugin-electron で開発起動（ユーザーデータは `%APPDATA%/defeat-fit-dev`）
- `npm run build` — `prisma migrate deploy`で空のテンプレートDB(`dist/app.db`)を生成 → `vue-tsc`（型チェック） → `vite build` → `electron-builder`（成果物は`dist/release/`）
- `npm run format` — prettier
- `npm run osc:send` / `osc:listen` — `osc-tester`でOSCの送受信テスト（宛先は`.env`の`OSC_TESTER_IP`/`OSC_TESTER_PORT`）
- テスト・lintのスクリプトは存在しない。型チェックは`npx vue-tsc`。
- 初回は`.env`に`DATABASE_URL`（SQLite, 例: `file:...`）が必要。Prismaクライアントは`prisma/generated`（gitignore）に出力されるので、スキーマ変更後は`npx prisma generate`、DBへの反映はマイグレーション（`prisma/migrations`）を追加する。

## アーキテクチャ

3層構成。`common/`は両側から使う共有コード。

- **`electron/` (main)**: エントリは`main.ts` → `window.ts`の`createWindow()`が各`electron/api/*.ts`を`initialize()`して`ipcMain.handle/on`を登録する。各APIはドメイン単位（osc, menu, preset, stats, setting, defeat-count, notice, file, update）のオブジェクトで、Prisma(`@prisma-generated-client`)でSQLiteを操作する。
- **`electron/preload.ts`**: `contextBridge`でAPI群を`window.osc`、`window.menu`等として公開。**IPCを追加する際は main側`ipcMain` と preload の両方（と型エクスポート）を更新する必要がある**。レンダラー側の型は`electron/electron-env.d.ts`で宣言。
- **`src/` (renderer)**: Vue 3。`views/<画面>/`配下に画面とその`components`/`composables`、グローバル状態は`stores/`(Pinia)。mainからのpush通知（`onUpdateDefeatCount`等）はstoreで購読する。
- **永続化は2系統**: ①Prisma/SQLite = メニュー・プリセット・統計（`prisma/schema.prisma`）、②`electron-store`(`config.json`) = 設定・最終選択プリセット等（`electron/store/`）。ストアのスキーマ変更時は`SCHEMA_VERSION`を上げ、`store/migrate.ts`にマイグレーションを追加する（失敗・破損時は設定ファイルをリネームして再生成）。
- **パッケージ版のDB**: 起動時（`main.ts`）に`resources/app.db`（ビルド時に`migrate deploy`で生成したテンプレート）が無ければユーザーデータへコピーして`DATABASE_URL`を設定する。その後`db/migrate.ts`の`migrateDatabase()`が、同梱した`resources/migrations`の未適用分を`_prisma_migrations`と突き合わせて適用する（`_prisma_migrations`が無い配布済みDBは既存3本を適用済みとして基準化。適用前に`app.db.bak`を作成し、失敗時は復元してアプリを終了）。

### OSC受信 (`electron/api/osc.ts`, `electron/osc/osc-server.ts`)

- VRChatからの受信は`node-osc`のUDPサーバー + `oscquery`によるOSCQuery公開（空きUDPポートを11337から探索）。
- `ListeningType`（`TARGET_AND_UPRIGHT` / `ALL` / `UPRIGHT`）で購読アドレスを切り替える（通常カウント、設定画面の全メッセージ選択、タイマーカウンターの直立判定）。
- 環境により同一メッセージが多重受信されるため、10ms以内の同アドレス重複は無視している。

## 規約・補足

- パスエイリアス: `@src` `@electron` `@common` `@prisma-generated-client`（`tsconfig.json`と`vite.config.ts`の両方で定義）。
- tsconfigは`noUnusedLocals/Parameters`有効。ビルドは`vue-tsc`が通ることが必須。
- ライセンス表記は`rollup-plugin-license`がビルド時に`dist/license`へ出力し、`file`APIが読み出す。
- 自動更新は`electron-updater`（`dev-app-update.yml`はgitignore）。バージョンは`package.json`の`version`で、`__APP_VERSION__`としてレンダラーに埋め込まれる。
- コミットメッセージ・ブランチ運用はグローバルCLAUDE.mdに従う（`develop`がメインブランチ、PRベース）。

## GitHubリポジトリ運用方法

- GitHubのIssueから`(Issue番号)-(簡潔な英文・ケバブケースの対応内容)`の形式でfeatureブランチを作成し、Issueに対応する
  - ブランチ内で対応が完了したら以下のPRを作成し、ユーザーが確認・マージを行う
    - タイトル: `Resolve: (Issueタイトル)`
    - 詳細: `Closes #(Issue番号)`
    - ラベル: 元のIssueと同じラベルを設定
- developブランチにIssue対応のマージがある程度たまったら、ユーザーがバージョン番号を変更してdevelopにコミットし、mainブランチへのPRを作成する
