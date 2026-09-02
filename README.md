# 工芸硝子モトヤ - 個人ECサイト

Next.js + Railway PostgreSQL + Stripe で作られた、管理画面から商品とブログ記事を編集できるシンプルなサイトです。カート機能・在庫管理・注文履歴に対応しています。

## 構成

- `/` … ショップページ(公開中の商品一覧、カートに入れるボタン)
- `/cart` … カートページ(数量変更・削除、レジに進む)
- `/blog` … ブログ一覧ページ
- `/blog/[id]` … ブログ記事詳細ページ
- `/stockists` … 取引先(取扱店)一覧ページ
- `/tokushoho` … 特定商取引法に基づく表記ページ
- `/admin` … 管理画面ログイン
- `/admin/dashboard` … 商品登録・編集・削除、ブログ記事の作成・編集・削除、取引先の登録・編集・削除、注文履歴の確認(パスワード保護)

商品・ブログ記事・注文はPostgreSQL(データベース)に保存されます。カートは会員登録なしでブラウザに保存され(localStorage)、「レジに進む」を押すとStripe Checkoutの決済画面に遷移します。決済完了はStripe Webhookで受け取り、注文の記録と在庫の減算を自動で行います。

---

## セットアップ手順

### 1. RailwayでPostgreSQLを用意

1. Railwayのプロジェクト画面で「+ New」→「Database」→「Add PostgreSQL」
2. 追加されたPostgresサービスをクリックし、「Variables」タブで `DATABASE_URL` の値を控える(アプリのサービスからは `${{ Postgres.DATABASE_URL }}` の形で参照することもできます)
3. Postgresサービスの「Data」タブ→「Query」を開き、`db/schema.sql` の内容を貼り付けて実行してテーブルを作成
   - ローカルに `psql` がある場合は `psql "$DATABASE_URL" -f db/schema.sql` でも実行できます

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

### 4. (任意)Cloudflare Turnstileで管理ログインのボット対策を設定

管理ページのログイン画面に、Cloudflareの無料CAPTCHA代替サービス「Turnstile」を導入できます。設定しない場合もログイン機能自体は通常通り動作します(チェックが省略されるだけです)。

1. https://dash.cloudflare.com/ にログイン(アカウントがない場合は無料登録)
2. 左メニューの「Turnstile」から「Add site」でウィジェットを作成
   - ドメインには本番ドメイン(`kougeiglassmotoya.jp`)を追加。ローカル確認もする場合は `localhost` も追加
   - ウィジェットモードは「Managed」でOK
3. 発行される「Site Key」を `NEXT_PUBLIC_TURNSTILE_SITE_KEY` に、「Secret Key」を `TURNSTILE_SECRET_KEY` に設定

### 5. 環境変数を設定

`.env.example` をコピーして `.env.local` を作成し、値を埋めてください。

```bash
cp .env.example .env.local
```

- `DATABASE_URL` … 手順1で控えたRailway PostgresのURL
- `ADMIN_PASSWORD` … 管理画面にログインするためのパスワード。好きな文字列にしてください
- `ADMIN_SESSION_SECRET` … ログイン状態を保持するための任意のランダム文字列(パスワードとは別の値)。例: `openssl rand -hex 32` で生成
- `STRIPE_WEBHOOK_SECRET` … 上記の手順3で取得した値
- `NEXT_PUBLIC_SITE_URL` … ローカルでは `http://localhost:3000` のままでOK。デプロイ後は実際のURLに変更
- `UPLOAD_DIR` … 商品画像の保存先ディレクトリ(任意)。ローカルでは空欄でOK。Railwayでの設定方法は下記「デプロイ」を参照
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` … 上記の手順4で取得した値(任意。設定しない場合は空欄でOK)

### 6. ローカルで動作確認

```bash
npm install
npm run dev
```

http://localhost:3000 でショップページ、http://localhost:3000/admin で管理画面にアクセスできます。決済のテストにはStripeのテストカード番号(`4242 4242 4242 4242`、有効期限・CVCは任意の未来日/任意の3桁)が使えます。

---

## デプロイ(Railway)

1. このフォルダをGitHubリポジトリにpush
2. Railwayで「New Project」→「Deploy from GitHub repo」でこのリポジトリを選択
3. 同じRailwayプロジェクト内に「セットアップ手順 1」のPostgresサービスを追加(まだの場合)
4. アプリのサービスの「Variables」タブに `.env.local` と同じ内容を環境変数として設定
   - `DATABASE_URL` はPostgresサービスの値を参照する形(`${{ Postgres.DATABASE_URL }}`)で設定すると管理が楽です
   - `NEXT_PUBLIC_SITE_URL` はデプロイ後に発行される実際のURL(独自ドメイン)に変更
5. デプロイが完了したら、サービスの Settings → Networking → Public Networking で「+ Custom Domain」から独自ドメインを追加
6. 表示される CNAMEレコードとTXTレコードを、ドメインを購入したサービスのDNS設定画面に追加(TXTレコードがないと反映されないので注意)
7. 反映されるとRailwayが自動でSSL証明書を発行します
8. 上記の「Stripe Webhookを設定」の本番手順で、本番ドメインのWebhookエンドポイントを追加
9. 商品画像をアップロードできるようにするため、サービスの Settings → Volumes で Volume を追加し、マウントパスを `/data` に設定
10. サービスの Variables に `UPLOAD_DIR=/data/uploads` を追加(これがないとアップロードした画像が再デプロイのたびに消えてしまいます)
11. アクセス状況を記録できるようにするため、Postgresサービスの「Data」タブ→「Query」で `db/schema.sql` の内容をもう一度実行(`page_views` テーブルが追加されます。他のテーブルは `if not exists` のため影響ありません)
12. 取引先(取扱店)機能を使う場合も同様に `db/schema.sql` を実行してください(`partners` テーブルが追加されます)
13. マーケティング分析(流入元・デバイス)機能を使う場合も同様に `db/schema.sql` を実行してください(`page_views` テーブルに `referrer`・`device` 列が追加されます)
14. 管理ログインのTurnstileを使う場合は、サービスの Variables に `NEXT_PUBLIC_TURNSTILE_SITE_KEY` と `TURNSTILE_SECRET_KEY` を追加(手順4を参照)

Stripeを本番稼働させる際は本番キー(`sk_live_...`)に切り替え、`NEXT_PUBLIC_SITE_URL` も本番ドメインにしてください。

---

## 商品・ブログ・注文の管理方法

1. `/admin` にアクセスし、設定した `ADMIN_PASSWORD` でログイン
2. 「商品を追加」フォームから商品名・価格・説明・商品画像(任意、端末から画像ファイルを選択してアップロード)・在庫数を入力して追加
   - 「ショップに公開する」のチェックを外すと、一覧に表示されず非公開になります(削除せず一時的に隠せます)
   - 在庫数が0になると、商品は一覧に表示されたまま「SOLD OUT」表示になり、カートに入れられなくなります
3. 商品一覧の「編集」「削除」から既存商品を管理(在庫数もここで手動調整できます)
4. 「記事を追加」フォームからタイトル・カバー画像URL(任意)・本文を入力して追加
   - 本文はリッチテキストエディタで太字・見出し・箇条書きなどを使えます
   - 「ブログに公開する」のチェックを外すと下書き状態になります
5. 記事一覧の「編集」「削除」から既存記事を管理
6. 「注文履歴」で、決済が完了した注文(商品・数量・金額・購入者メール・配送先住所)を確認できます
7. 「アクセス状況」で、サイトの閲覧数(本日・過去7日・過去30日・累計、直近14日間の推移)に加えて、時間帯別アクセス(日本時間)・人気ページ・流入元(検索エンジン/SNS/直接・ブックマーク/その他)・デバイス種別(PC/モバイル/タブレット)といったマーケティング分析データを確認できます(管理画面自体へのアクセスは含みません)
8. 「取引先を追加」フォームから店舗名を入力して追加できます。「STOCKISTSページに公開する」のチェックを外すと一覧に表示されず非公開になります

商品画像は管理画面から端末の画像ファイル(jpg・png・webp・gif、8MBまで)を選択してアップロードします。アップロードした画像は `UPLOAD_DIR` で指定したディレクトリに保存され、`/api/uploads/xxxxx` のURLで配信されます。Railwayでは必ずVolumeをマウントして `UPLOAD_DIR` を設定してください(未設定の場合、再デプロイのたびに画像が消えます)。

---

## カート・決済・在庫の仕組み

- カートは会員登録不要で、ブラウザのlocalStorageに保存されます(端末やブラウザが変わると引き継がれません)
- 「レジに進む」を押すとStripe Checkoutに遷移し、配送先住所(日本国内)とメールアドレスを入力して決済します
- 決済完了はStripe Webhook経由でサーバーに通知され、注文が自動的に記録され、購入された分だけ在庫が減算されます
- 在庫が0になった商品は自動的に「SOLD OUT」表示になりますが、一覧からは消えません(手動で非公開にすることも可能です)
- Webhookが正しく設定されていない場合、決済自体は成功しますが、注文履歴への記録と在庫減算が行われないのでご注意ください

---

## SEO対策

「工芸硝子モトヤ」「小野資矢」で検索されたときに見つかりやすくなるよう、以下を設定しています。

- 各ページのtitle・description、OGP(SNSシェア時の表示)、構造化データ(JSON-LD)に、屋号「工芸硝子モトヤ」と作家名「小野資矢」を明記
- `/sitemap.xml`(ページ一覧)・`/robots.txt`(クロール許可設定)を自動生成
- ブログ記事ごとに個別のtitle・descriptionを自動生成

**検索順位を確約するものではありません**(順位は誰にも保証できません)。追加でできる対策として:

1. [Google Search Console](https://search.google.com/search-console) にサイトを登録し、`kougeiglassmotoya.jp` の所有権を確認(DNSのTXTレコードで確認できます)
2. 登録後、サイトマップ(`https://kougeiglassmotoya.jp/sitemap.xml`)を送信してインデックス登録をリクエスト
3. ブログを継続的に更新する(「工芸硝子モトヤ」「小野資矢」という言葉が自然に登場する記事を増やすほど、検索エンジンに認識されやすくなります)
4. 可能であれば、他のサイト(SNSプロフィール、作家活動をしているギャラリーのサイトなど)から本サイトへのリンクを増やす

## 特定商取引法に基づく表記

`/tokushoho` に、通信販売を行う個人事業者として法律で表示が義務付けられている項目(販売業者名・連絡先・支払い方法・お届け時期・返品条件など)をまとめたページを用意しています。フッターからもリンクしています。内容を変更する場合は `app/tokushoho/page.tsx` の `rows` 配列を編集してください。

## 補足

- パスワード認証はシンプルな実装(1つの共通パスワード)です。第三者に公開する予定がある場合や、より高いセキュリティが必要な場合は追加の対策をおすすめします。
- 価格は日本円(整数)のみ対応しています。
- 配送先住所の収集は日本国内のみに設定しています(海外発送が必要な場合はコードの変更が必要です)。
- 以前あったプロフィールページは削除し、EC(ショップ)とブログの2本構成にしています。
