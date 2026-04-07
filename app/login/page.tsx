'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

type FormMode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formMode, setFormMode] = useState<FormMode>('login');
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function checkIfAlreadyLoggedIn() {
      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;

      if (session) {
        router.replace('/dashboard');
      }
    }

    checkIfAlreadyLoggedIn();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsWorking(true);
    setErrorMessage('');
    setInfoMessage('');

    const supabase = getSupabaseBrowserClient();

    const authResult =
      formMode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setIsWorking(false);

    if (authResult.error) {
      setErrorMessage(authResult.error.message);
      return;
    }

    if (formMode === 'signup') {
      setInfoMessage('Bruger oprettet. Hvis dit Supabase-projekt kræver mailbekræftelse, så tjek din indbakke.');
      return;
    }

    router.replace('/dashboard');
  }

  return (
    <main className="page">
      <div className="shell" style={{ maxWidth: 520 }}>
        <section className="hero stack">
          <div className="kicker">Menu + login</div>
          <h1 className="heading">Log ind for at scanne kvitteringer</h1>
          <p className="subheading">
            Til en lille privat gruppe kan I enten dele én konto eller oprette hver jeres bruger senere.
          </p>

          <div className="actions">
            <button
              className={formMode === 'login' ? 'primaryButton' : 'ghostButton'}
              type="button"
              onClick={() => setFormMode('login')}
            >
              Log ind
            </button>
            <button
              className={formMode === 'signup' ? 'primaryButton' : 'ghostButton'}
              type="button"
              onClick={() => setFormMode('signup')}
            >
              Opret bruger
            </button>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="navn@email.dk"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Adgangskode
              </label>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mindst 6 tegn"
                minLength={6}
                required
              />
            </div>

            <button className="primaryButton" type="submit" disabled={isWorking}>
              {isWorking ? 'Arbejder …' : formMode === 'login' ? 'Log ind' : 'Opret bruger'}
            </button>
          </form>

          {errorMessage ? <p className="error">{errorMessage}</p> : null}
          {infoMessage ? <p className="success">{infoMessage}</p> : null}

          <p className="footerNote">
            Når du er logget ind, kan du gå til <Link href="/scan">Scan</Link> eller <Link href="/dashboard">Dashboard</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
