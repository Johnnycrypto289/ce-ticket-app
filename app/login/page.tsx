import { loginAction } from './actions';

export default function LoginPage() {
  return (
    <main className="page stack" style={{ maxWidth: 520 }}>
      <div className="card stack">
        <h1>CE Ticket App Login</h1>
        <div className="muted">Seed users: owner@contractorengage.com, dispatch@contractorengage.com, ledger@contractorengage.com, admin@contractorengage.com</div>
        <form action={loginAction} className="stack">
          <input className="textarea" name="email" placeholder="Email" style={{ minHeight: 48 }} />
          <button className="button primary" type="submit">Sign in</button>
        </form>
      </div>
    </main>
  );
}
