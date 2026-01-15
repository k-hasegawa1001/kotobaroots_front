# KotobaRoots Frontend

## 起動方法

### 1. バックエンドを起動

1. ターミナルでバックエンドフォルダへ移動します。
   - `cd C:\projects\kotobaroots_back`
2. 既存の手順（venv/依存導入/起動）に従って起動し、`http://127.0.0.1:5000` で待機させます。
   - 例: `python apps/app.py`（プロジェクトの起動方法に合わせてください）

### 2. フロントエンドを起動（Live Server 前提）

1. VS Code で `C:\projects\kotobaroots_front` を開きます。
2. `auth/login.html` を開き、右下の **Go Live** をクリックします。
3. ブラウザで Live Server の URL を開きます。
   - 例: `http://127.0.0.1:5500/auth/login.html`
   - Live Server が `5501` など別ポートの場合もあります。

### 3. 動作確認の流れ

1. アカウント作成 → ログイン → ログアウト
2. 学習: 言語/難易度 → 単元 → クイズ10問 → 結果
3. 履歴: 一覧表示 + 言語フィルタ
4. マイフレーズ: 追加 → 一括削除
5. AI解説: 入力 → 結果
6. プロフィール: 表示
7. お問い合わせ: 送信

### 注意点

- ES Modules を使用しているため、`file://` 直開きでは動作しません。
- Live Server のポートは `5500` または `5501` を想定しています。
- バックエンドは `http://127.0.0.1:5000` で起動してください。

## ページ一覧

- `/auth/login.html` ログイン
- `/auth/signup.html` アカウント作成
- `/learn/index.html` 学習トップ（単元一覧）
- `/learn/quiz.html` クイズ
- `/learn/result.html` 結果
- `/history/index.html` 学習履歴
- `/myphrase/index.html` マイフレーズ
- `/ai/index.html` AI解説
- `/profile/index.html` プロフィール
- `/profile/edit-email-confirmation.html` メールアドレス確認（確認メールのリンク先）
- `/contact/index.html` お問い合わせ

## 実装済み機能

- 認証: アカウント作成 / ログイン / ログアウト
- プロフィール: 参照 / ユーザー名変更 / メールアドレス変更（確認メール送信 → 確認ページで確定）
- マイフレーズ: 一覧 / 追加（モーダル） / 複数選択削除
- AI解説: 生成 / 履歴表示
- お問い合わせ: 本文送信 / 送信完了ポップアップ
- 学習UI: 未ログイン・ログイン状態の画面表示（API応答がある場合は単元取得）

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

### learn
- `GET /api/kotobaroots/learning`
  - res: `{ learning_topics: [{ id, topic, difficulty }], current_max_difficulty }`
- `POST /api/kotobaroots/learning/start`
  - req: `{ learning_topic_id }`
  - res: `{ msg, topic_id, topic_title, questions: [...] }`
- `POST /api/kotobaroots/learning/generate-questions`
  - req: `{ learning_topic_id }`
  - res: `{ msg, topic_id, country, questions: [...] }` (OpenAI連携)

### history
- 学習結果保存/履歴取得のAPIは未実装

### myphrase
- `GET /api/kotobaroots/myphrase`
  - res: `{ myphrases: [{ id, phrase, mean }], question_num }`
- `POST /api/kotobaroots/myphrase`
  - req: `{ phrase, mean }`
  - res: `{ msg }`
- `DELETE /api/kotobaroots/myphrase`
  - req: `{ delete_ids: [id, ...] }`
  - res: `{ msg }`

### ai
- `POST /api/kotobaroots/ai-explanation`
  - req: `{ input_english }`
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

- 学習/学習履歴のAPIが未完成のため、学習結果の保存や履歴取得はできません。
  - 現状は `localStorage` に保存したローカル結果のみ履歴ページに表示します。
  - 提案: `POST /api/kotobaroots/learning/complete`（回答/正解率の保存）
  - 提案: `GET /api/kotobaroots/learning/history`（履歴一覧）
- 学習言語/難易度の変更APIが無いため、学習トップの言語セレクトは表示のみです。
  - 提案: `GET /api/kotobaroots/learning/config` と `PATCH /api/kotobaroots/learning/config`
- AI解説はバックエンドの OpenAI 設定に依存します。`OPENAI_API_KEY` 未設定の場合は利用不可になります。
