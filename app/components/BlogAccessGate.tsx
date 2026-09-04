type Props = {
  redirectTo: string;
  error?: string;
};

export default function BlogAccessGate({ redirectTo, error }: Props) {
  return (
    <div className="login-box">
      <h1 className="page-title" style={{ fontSize: 20 }}>
        日誌はご購入者限定です
      </h1>
      <p className="page-desc" style={{ marginBottom: 20 }}>
        工芸硝子モトヤのサイトでご購入いただいた際に使用したメールアドレスを入力してください。
      </p>
      <form method="POST" action="/api/blog-access">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div className="field">
          <label htmlFor="blog-access-email">メールアドレス</label>
          <input id="blog-access-email" name="email" type="email" required autoFocus />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
          確認する
        </button>
      </form>
    </div>
  );
}
