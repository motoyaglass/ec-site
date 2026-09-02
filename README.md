# 工芸硝子モトヤ - 個人ECサイト

Next.js + Supabase + Stripe で作られた、管理画面から商品とブログ記事を編集できるシンプルなサイトです。カート機能・在庫管理・注文履歴に対応しています。

## 構成

- `/` … ショップページ(公開中の商品一覧、カートに入れるボタン)
- `/cart` … カートページ(数量変更・削除、レジに進む)
- `/blog` … ブログ一覧ページ
- `/blog/[id]` … ブログ記事詳細ページ
- `/admin` … 管理画面ログイン
- `/admin/dashboard` … 商品登録・編集・削除、ブログ記事の作成・編集・削除、注文履歴の確認(パスワード保護)

商品・ブログ記事・注文はSupabase(データベース)に保存されます。カートは会員登録なしでブラウザに保存され(localStorage)、「レジに進む」を押すとStripe Checkoutの決済画面に遷移します。決済完了はStripe Webhookで受け取り、注文の記録と在庫の減算を自動で行います。

---

## セットアップ手順

### 1. Supabaseプロジェクトを作成

1. https://supabase.com でアカウント作成 → 「New project」でプロジェクト作成
2. 左メニュー「SQL Editor」を開き、`supabase/schema.sql` の内容を貼り付けて実行
   - 既に以前のバージョンを実行済みの場合も、そのまま全体を再実行して問題ありません(`if not exists` / `add column if not exists` で安全に追加されます)
3. 左メニュー「Project Settings」→「API」で以下を控える
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` キー(secretと書かれている方) → `SUPABASE_SERVICE_ROLE_KEY`
   - ※ service_role キーは絶対に公開しないでください(サーバー側のみで使用します)

### 2. Stripeアカウントを準備

1. https://stripe.com でアカウント作成
2. 「開発者」→「APIキー」から シークレットキー を控える → `STRIPE_SECRET_KEY`
   - まずはテストモードの `sk_test_...` で動作確認するのがおすすめです
3. 本番で商品を販売する際は、Stripeアカウントの本人確認(本番決済の有効化)を完了させ、`sk_live_...` に切り替えてください

### 3. Stripe Webhookを設定(注文記録・在庫減算に必須)

決済が完了したことをサイトに知らせるための仕組みです。これを設定しないと、注文履歴への記録と在庫の自動減算が行われません。

**ローカルで試す場合(Stripe CLI)**

```bash
brew install stripe/stripe-cli/stripe   # 初回のみ
stripe login                             # 初回のみ
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

コマンド実行後に表示される `whsec_...` を `.env.local` の `STRIPE_WEBHOOK_SECRET` に設定してください。

**本番(デプロイ後)の場合**

1. Stripeダッシュボードの「開発者」→「Webhook」→「エンドポイントを追加」
2. エンドポイントURLに `https://あなたのドメイン/api/webhooks/stripe` を入力
3. イベントは `checkout.session.completed` を選択
4. 作成後に表示される「署名シークレット」を本番環境の `STRIPE_WEBHOOK_SECRET` に設定

### 4. 環境変数を設定

`.env.example` をコピーして `.env.local` を作成し、値を埋めてください。

```bash
cp .env.example .env.local
```

- `ADMIN_PASSWORD` … 管理画面にログインするためのパスワード。好きな文字列にしてください
- `ADMIN_SESSION_SECRET` … ログイン状態を保持するための任意のランダム文字列(パスワードとは別の値)。例: `openssl rand -hex 32` で生成
- `STRIPE_WEBHOOK_SECRET` … 上記の手順3で取得した値
- `NEXT_PUBLIC_SITE_URL` … ローカルでは `http://localhost:3000` のままでOK。デプロイ後は実際のURLに変更

### 5. ローカルで動作確認

```bash
npm install
npm run dev
```

http://localhost:3000 でショップページ、http://localhost:3000/admin で管理画面にアクセスできます。決済のテストにはStripeのテストカード番号(`4242 4242 4242 4242`、有効期限・CVCは任意の未来日/任意の3桁)が使えます。

---

## デプロイ

### Railwayの場合

1. このフォルダをGitHubリポジトリにpush
2. Railwayで「New Project」→「Deploy from GitHub repo」でこのリポジトリを選択
3. サービスの「Variables」タブに `.env.local` と同じ内容を環境変数として設定
   - `NEXT_PUBLIC_SITE_URL` はデプロイ後に発行される実際のURL(独自ドメイン)に変更
4. デプロイが完了したら、サービスの Settings → Networking → Public Networking で「+ Custom Domain」から独自ドメインを追加
5. 表示される CNAMEレコードとTXTレコードを、ドメインを購入したサービスのDNS設定画面に追加(TXTレコードがないと反映されないので注意)
6. 反映されるとRailwayが自動でSSL証明書を発行します
7. 上記の「Stripe Webhookを設定」の本番手順で、本番ドメインのWebhookエンドポイントを追加

### Vercelの場合

1. このフォルダをGitHubリポジトリにpush
2. https://vercel.com でGitHubリポジトリをImport
3. Vercelの「Environment Variables」に `.env.local` と同じ内容を設定
4. Deploy
5. デプロイ後、本番用のStripe Webhookエンドポイントを追加

どちらの場合も、Stripeを本番稼働させる際は本番キー(`sk_live_...`)に切り替え、`NEXT_PUBLIC_SITE_URL` も本番ドメインにしてください。

---

## 商品・ブログ・注文の管理方法

1. `/admin` にアクセスし、設定した `ADMIN_PASSWORD` でログイン
2. 「商品を追加」フォームから商品名・価格・説明・画像URL(任意)・在庫数を入力して追加
   - 「ショップに公開する」のチェックを外すと、一覧に表示されず非公開になります(削除せず一時的に隠せます)
   - 在庫数が0になると、商品は一覧に表示されたまま「SOLD OUT」表示になり、カートに入れられなくなります
3. 商品一覧の「編集」「削除」から既存商品を管理(在庫数もここで手動調整できます)
4. 「記事を追加」フォームからタイトル・カバー画像URL(任意)・本文を入力して追加
   - 本文はリッチテキストエディタで太字・見出し・箇条書きなどを使えます
   - 「ブログに公開する」のチェックを外すと下書き状態になります
5. 記事一覧の「編集」「削除」から既存記事を管理
6. 「注文履歴」で、決済が完了した注文(商品・数量・金額・購入者メール・配送先住所)を確認できます

画像はURLを指定する形式です(例: 画像ホスティングサービスや、SupabaseのStorage機能にアップロードしたファイルのURLなど)。ファイルアップロード機能が必要であれば別途追加できます。

---

## カート・決済・在庫の仕組み

- カートは会員登録不要で、ブラウザのlocalStorageに保存されます(端末やブラウザが変わると引き継がれません)
- 「レジに進む」を押すとStripe Checkoutに遷移し、配送先住所(日本国内)とメールアドレスを入力して決済します
- 決済完了はStripe Webhook経由でサーバーに通知され、注文が自動的に記録され、購入された分だけ在庫が減算されます
- 在庫が0になった商品は自動的に「SOLD OUT」表示になりますが、一覧からは消えません(手動で非公開にすることも可能です)
- Webhookが正しく設定されていない場合、決済自体は成功しますが、注文履歴への記録と在庫減算が行われないのでご注意ください

---

## 補足

- パスワード認証はシンプルな実装(1つの共通パスワード)です。第三者に公開する予定がある場合や、より高いセキュリティが必要な場合は追加の対策をおすすめします。
- 価格は日本円(整数)のみ対応しています。
- 配送先住所の収集は日本国内のみに設定しています(海外発送が必要な場合はコードの変更が必要です)。
- 以前あったプロフィールページは削除し、EC(ショップ)とブログの2本構成にしています。
