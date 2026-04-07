'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function HomePage() {
  const router = useRouter();
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function checkLogin() {
      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;

      if (session) {
        router.replace('/dashboard');
        return;
      }

      setIsCheckingLogin(false);
    }

    checkLogin();
  }, [router]);

  if (isCheckingLogin) {
    return (
      <main className="page">
        <div className="shell center">
          <p className="muted">Indlæser …</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell grid">
        <section className="hero">
          <div className="kicker">iPhone-venlig kvitteringsapp</div>
          <h1 className="heading">Tag et billede af kvitteringen, og få et overblik med AI.</h1>
          <p className="subheading">
            Denne version er bygget som en PWA, så du kan gemme den på hjemmeskærmen på din iPhone og bruge den som en app.
          </p>

          <div className="actions" style={{ marginTop: 18 }}>
            <Link href="/login" className="primaryButton">
              Log ind
            </Link>
            <Link href="/scan" className="ghostButton">
              Gå direkte til scanning
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
