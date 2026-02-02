# KotobaRoots Frontend

## 起動方法

### 1. バックエンドを起動
1. ターミナルでバックエンドへ移動
   - `cd C:\projects\kotobaroots_back`
2. 仮想環境と依存パッケージを準備（初回のみ）
   - `python -m venv venv`
   - `venv\Scripts\activate`
   - `pip install -r requirements.txt`
3. `.env` を設定
   - `FRONTEND_URL` は Live Server のポートに合わせる（例: `http://127.0.0.1:5500`）
   - AI解説を使う場合は `OPENAI_API_KEY` を設定
   - メール送信機能を使う場合は `MAIL_*` を設定
4. サーバを起動
   - 例: `flask --app apps.app:create_app run --host 127.0.0.1 --port 5000`

### 2. フロントエンドを起動（Live Server 前提）
1. VS Code で `C:\projects\kotobaroots_front` を開く
2. `auth/login.html` を開いて **Go Live** をクリック
3. ブラウザで Live Server の URL を開く
   - 例: `http://127.0.0.1:5500/auth/login.html`
   - Live Server が `5501` など別ポートの場合もある

### 3. 動作確認の流れ
1. アカウント作成 → ログイン → ログアウト
2. 学習: 言語/難易度 → 単元 → 学習10問 → 結果
3. 履歴: 一覧表示 + 正答率/期間/並び替えフィルタ
4. マイフレーズ: 追加 → 一括削除 → テスト
5. AI解説: 入力 → 結果 → 履歴
6. プロフィール: 表示 / ユーザー名変更 / メールアドレス変更
7. お問い合わせ: 送信
8. パスワードリセット: メール送信 → 新パスワード確定

### 注意点
- ES Modules を使用しているため、`file://` 直開きでは動作しない
- バックエンドは `http://127.0.0.1:5000` で起動する
- Live Server のポートが異なる場合は `.env` の `FRONTEND_URL` を合わせる

## ページ一覧
- `/auth/login.html` ログイン
- `/auth/signup.html` アカウント作成
- `/auth/reset-password-request.html` パスワードリセット（メール送信）
- `/auth/reset-password-confirm.html` パスワード変更（メールのリンク先）
- `/auth/reset-password.html` パスワードリセット自動振り分け（トークン有無で遷移）
- `/reset-password.html` 互換用リダイレクト（メール内リンク保持）
- `/learn/index.html` 学習トップ（ログイン必須）
- `/learn/guest.html` 学習トップ（未ログイン用）
- `/learn/learn.html` 学習
- `/learn/result.html` 結果
- `/history/index.html` 学習履歴
- `/myphrase/index.html` マイフレーズ
- `/myphrase/test.html` マイフレーズテスト
- `/ai/index.html` AI解説
- `/profile/index.html` プロフィール
- `/profile/edit-email-confirmation.html` メールアドレス確認（確認メールのリンク先）
- `/contact/index.html` お問い合わせ

## 実装済み
- 認証: アカウント作成 / ログイン / ログアウト（Cookie セッション）
- 認証: パスワードリセット（メール送信 → リンク経由で新パスワード確定）
- 学習: 単元取得 / 学習実施（4形式 + 並び替え） / 問題ごとのフィードバックモーダル / 結果表示 / 学習結果保存 / 学習設定変更
- 学習履歴: 単元ごとの開閉表示 / 問題内容表示 / 〇✕表示 / 正答率レンジ / 期間 / 並び替え（新しい順 / 正答率順）
- プロフィール: 参照 / ユーザー名変更 / メールアドレス変更（確認メール送信 → 確認ページで確定）
- マイフレーズ: 一覧 / 追加（モーダル） / 複数選択削除（確認モーダル） / テスト（問数選択 + 別ページで一問一答）
- AI解説: 生成 / 履歴表示
- お問い合わせ: 本文送信 / 送信完了モーダル
- UI: サイドバー共通表示 / 未ログインガード / フォームのプレースホルダー統一

## 未実装 / 一部未実装
- 学習履歴の言語フィルタ（UIはあるが API が現在言語のみ返すため disabled）
- マイフレーズの編集
- 学習の `POST /api/kotobaroots/learning/generate-questions` は未使用

## 提案・改善案
- 学習履歴の詳細検索（単元名/期間の細分化、キーワード検索）
- マイフレーズの編集機能とテスト結果の保存
- パスワードリセットの「現在パスワード」確認をサーバ側でも強制
- 学習カードの開放条件やロック理由の明示

## コードレビュー結果（要点）

### 重要な指摘 / リスク
- `kotobaroots_back/apps/app.py`: `unauthorized_handler` の返却メッセージが文字化けしており、未ログイン時のAPIレスポンスが読めない
- `kotobaroots_back/apps/api/auth/auth_api.py`: 例外時に `str(e)` をそのまま返しており、内部情報露出の可能性
- `kotobaroots_front/learn/guest.*`: ゲスト画面は静的データ依存のため、教材追加/変更が反映されない
- 学習結果/履歴は `sessionStorage` 依存のため、ページ更新・別タブで消える

### 改善余地
- `shared/ui.js` にゲスト判定ロジックが集中しているため、構成変更時の影響範囲が大きい
- `learn/index.js` の難易度表示が連番（表示順依存）のため、APIの実難易度とズレる可能性
- `validators.js` の整形ルールは統一済みだが、禁止文字やホワイトリストを設けるとより安定

## 認証/CSRF
- 認証方式: Flask-Login の Cookie セッション
- フロントは `fetch` で `credentials: "include"` を使用
- CSRF トークン取得/送信は不要（バックエンド実装に該当処理なし）

## APIまとめ（バックエンド参照結果）

- ベースパス: `http://127.0.0.1:5000/api`

### auth
- `POST /api/auth/login`
  - req: `{ email, password }`
  - res: `{ msg, user_info: { username, email } }`
- `POST /api/auth/logout`
  - res: `{ msg }`
- `POST /api/auth/create-user`
  - req: `{ username, email, password }`
  - res: `{ msg }`
- `POST /api/auth/request-reset-password`
  - req: `{ email }`
  - res: `{ msg }`
- `POST /api/auth/reset-password`
  - req: `{ token, password }`
  - res: `{ msg }`

### learn
- `GET /api/kotobaroots/learning`
  - res: `{ learning_topics: [{ id, topic, difficulty }], current_max_difficulty }`
- `POST /api/kotobaroots/learning/start`
  - req: `{ learning_topic_id }`
  - res: `{ msg, topic_id, topic_title, questions: [...] }`
- `POST /api/kotobaroots/learning/complete`
  - req: `{ learning_topic_id, results: [{ is_passed, question_statement, choices, correct_answer, explanation, user_answer }] }`
  - res: `{ msg, progress_updated, new_difficulty }`
- `PUT /api/kotobaroots/learning/config`
  - req: `{ level_id, language_id }`
  - res: `{ msg }`

### history
- `GET /api/kotobaroots/learning/history`
  - res: `{ histories: [{ id, topic, question, user_answer, correct_answer, explanation, is_passed, created_at }] }`

### myphrase
- `GET /api/kotobaroots/myphrase`
  - res: `{ myphrases: [{ id, phrase, mean }], question_num }`
- `POST /api/kotobaroots/myphrase`
  - req: `{ phrase, mean }`
  - res: `{ msg }`
- `DELETE /api/kotobaroots/myphrase`
  - req: `{ delete_ids: [id, ...] }`
  - res: `{ msg }`
- `PUT /api/kotobaroots/myphrase/test`
  - req: `{ myphrase_question_num }`
  - res: `{ questions: [{ id, phrase, mean }] }`

### ai
- `POST /api/kotobaroots/ai-explanation`
  - req: `{ input_string }`
  - res: `{ msg, translation, explanation }`
- `GET /api/kotobaroots/ai-explanation/history`
  - res: `[{ id, input_english, japanese_translation, explanation, created_at }]`

### profile
- `GET /api/kotobaroots/profile`
  - res: `{ username, email, created_at }`
- `PATCH /api/kotobaroots/profile/username`
  - req: `{ username }`
  - res: `{ msg }`
- `POST /api/kotobaroots/profile/email/request`
  - req: `{ new_email }`
  - res: `{ msg }`
- `POST /api/kotobaroots/profile/email/update`
  - req: `{ token, password }`
  - res: `{ msg }`

### contact
- `POST /api/kotobaroots/contact`
  - req: `{ content }`
  - res: `{ msg }`

## 既知の制約とバックエンドへの提案
- 学習設定の変更はUIから可能だが、バックエンド側教材が英語（アメリカ）以外に未整備のため、他言語/レベルでAPIエラーになる場合がある
- AI解説はバックエンドの OpenAI 設定に依存するため、`OPENAI_API_KEY` 未設定の場合は利用不可
