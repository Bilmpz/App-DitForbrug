'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { SignOutButton } from '@/components/sign-out-button';

type ReceiptItemRow = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
};

type ReceiptRow = {
  id: string;
  store_name: string;
  purchase_date: string;
  total: number;
  currency: string;
  created_at: string;
  receipt_items: ReceiptItemRow[];
};

function formatMoney(amount: number, currency = 'DKK') {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency
  }).format(amount);
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [receiptList, setReceiptList] = useState<ReceiptRow[]>([]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function loadPage() {
      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;

      if (!session) {
        router.replace('/login');
        return;
      }

      setUserEmail(session.user.email || '');

      const receiptResult = await supabase
        .from('receipts')
        .select(
          `
            id,
            store_name,
            purchase_date,
            total,
            currency,
            created_at,
            receipt_items (
              id,
              name,
              quantity,
              price,
              category
            )
          `
        )
        .order('purchase_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (receiptResult.error) {
        setErrorMessage(receiptResult.error.message);
      } else {
        setReceiptList((receiptResult.data || []) as ReceiptRow[]);
      }

      setIsLoading(false);
    }

    loadPage();
  }, [router]);

  const summary = useMemo(() => {
    let totalSpent = 0;
    let totalItems = 0;

    const categoryTotals = new Map<string, number>();
    const storeTotals = new Map<string, number>();

    for (const receipt of receiptList) {
      const receiptTotal = Number(receipt.total || 0);
      totalSpent += receiptTotal;

      storeTotals.set(receipt.store_name, (storeTotals.get(receipt.store_name) || 0) + receiptTotal);

      for (const item of receipt.receipt_items || []) {
        totalItems += 1;
        categoryTotals.set(item.category, (categoryTotals.get(item.category) || 0) + Number(item.price || 0));
      }
    }

    const topCategories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const topStores = [...storeTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      totalSpent,
      receiptCount: receiptList.length,
      totalItems,
      topCategories,
      topStores
    };
  }, [receiptList]);

  if (isLoading) {
    return (
      <main className="page">
        <div className="shell center">
          <p className="muted">Henter overblik …</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell grid">
        <section className="hero">
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="kicker">Stort overblik</div>
              <h1 className="heading">Dit kvitteringsdashboard</h1>
              <p className="subheading">{userEmail ? `Logget ind som ${userEmail}` : 'Logget ind'}.</p>
            </div>
            <SignOutButton />
          </div>

          <div className="actions" style={{ marginTop: 18 }}>
            <Link href="/scan" className="primaryButton">
              Scan ny kvittering
            </Link>
            <Link href="/login" className="ghostButton">
              Konto
            </Link>
          </div>
        </section>

        {errorMessage ? <p className="error">{errorMessage}</p> : null}

        <section className="metrics">
          <article className="metric">
            <div className="metricLabel">Samlet forbrug</div>
            <div className="metricValue">{formatMoney(summary.totalSpent)}</div>
          </article>
          <article className="metric">
            <div className="metricLabel">Kvitteringer</div>
            <div className="metricValue">{summary.receiptCount}</div>
          </article>
          <article className="metric">
            <div className="metricLabel">Varelinjer</div>
            <div className="metricValue">{summary.totalItems}</div>
          </article>
        </section>

        <section className="twoCol">
          <article className="card stack">
            <div className="row">
              <h2 style={{ margin: 0 }}>Topkategorier</h2>
              <span className="badge">AI-opdelt</span>
            </div>

            {summary.topCategories.length === 0 ? (
              <p className="muted">Ingen kategorier endnu.</p>
            ) : (
              <ul className="list">
                {summary.topCategories.map(([categoryName, amount]) => (
                  <li className="listItem" key={categoryName}>
                    <span>{categoryName}</span>
                    <strong>{formatMoney(amount)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="card stack">
            <h2 style={{ margin: 0 }}>Topbutikker</h2>

            {summary.topStores.length === 0 ? (
              <p className="muted">Ingen butikker endnu.</p>
            ) : (
              <ul className="list">
                {summary.topStores.map(([storeName, amount]) => (
                  <li className="listItem" key={storeName}>
                    <span>{storeName}</span>
                    <strong>{formatMoney(amount)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="card stack">
          <div className="row">
            <h2 style={{ margin: 0 }}>Seneste kvitteringer</h2>
            <span className="badge">{receiptList.length} gemt</span>
          </div>

          {receiptList.length === 0 ? (
            <div className="stack">
              <p className="muted">Du har ingen kvitteringer endnu.</p>
              <Link href="/scan" className="primaryButton">
                Tag det første billede
              </Link>
            </div>
          ) : (
            <div className="receiptList">
              {receiptList.map((receipt) => (
                <article className="receiptCard stack" key={receipt.id}>
                  <div className="row">
                    <div>
                      <strong style={{ fontSize: '1.05rem' }}>{receipt.store_name}</strong>
                      <div className="receiptMeta">{receipt.purchase_date}</div>
                    </div>
                    <strong>{formatMoney(receipt.total, receipt.currency || 'DKK')}</strong>
                  </div>

                  <div className="grid" style={{ gap: 10 }}>
                    {(receipt.receipt_items || []).slice(0, 4).map((item) => (
                      <div className="listItem" key={item.id}>
                        <div>
                          <div>{item.name}</div>
                          <div className="receiptMeta">
                            {item.quantity} × {formatMoney(item.price, receipt.currency || 'DKK')}
                          </div>
                        </div>
                        <span className="badge">{item.category}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
