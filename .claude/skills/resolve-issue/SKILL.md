---
name: resolve-issue
description: 指定したGitHub Issueに対応し、Opusによるレビューとユーザー確認を経てプルリクエストを作成する
argument-hint: <Issue番号>
disable-model-invocation: true
---

# Issue対応

Issue #$ARGUMENTS に対応する。ブランチ名・PR形式・ラベルはリポジトリの CLAUDE.md、コミット規約はグローバルの CLAUDE.md に従う。

## 1. 準備

- `$ARGUMENTS` が数値でなければ中断してユーザーに確認する
- `gh issue view $ARGUMENTS --json title,body,labels,state,comments` でIssueを取得する（コメントの追加仕様・合意事項も踏まえる）
- Issueがクローズ済みの場合は、対応してよいかユーザーに確認する
- 作業ツリーがクリーンでなければ中断してユーザーに確認する
- `develop` を最新化し、`$ARGUMENTS-(簡潔な英文・ケバブケースの対応内容)` のブランチを作成する

## 2. 対応

- Issueの内容を実装する。曖昧な点は推測せず、ユーザーに質問する
- コミットはグローバルCLAUDE.mdの規約に従う（プレフィックス、日本語、1コミット1論理変更、コミット前に `git diff --cached --stat` を確認）
- 無関係な修正を見つけても含めず、報告だけする
- 完了前に `npx vue-tsc` で型チェックを通す（テスト・lintのスクリプトは存在しない）

## 3. レビュー依頼

Agentツールを `model: "opus"`、`run_in_background: false` で起動し、レビューを依頼する。結果を受け取ってから 4. に進む。レビュアーは会話の文脈を持たないため、プロンプトは自己完結させ、以下を含める。

- IssueのタイトルとIssue本文
- `git diff develop...HEAD` で変更を確認すること
- 観点: Issue要件の充足、バグ、CLAUDE.mdの規約違反、不要な変更
- ファイルは編集せず、指摘のみを重要度つきで返すこと

2回目以降は、前回の指摘とその対応内容も伝える。

## 4. 報告

以下をユーザーに伝え、修正の要否を尋ねる。

- 対応内容（変更点、コミット一覧、`vue-tsc` の結果）
- レビュー結果（指摘と重要度）。各指摘について対応すべきかの所見を添える

レビュー指摘を独断で適用しない。

## 5. 修正

ユーザーから修正依頼があれば、修正し、`npx vue-tsc` で型チェックを通してからコミットして 3. に戻る。

## 6. プルリクエスト作成

ユーザーが修正不要と返答した場合のみ、pushしてPRを作成する。

```
gh pr create --base develop --title "Resolve: (Issueタイトル)" --body "Closes #$ARGUMENTS" --label (元Issueのラベル)
```

- 元Issueにラベルがなければ `--label` は省略する
- 作成したPRのURLを報告する。マージはユーザーが行うため、自動マージしない
