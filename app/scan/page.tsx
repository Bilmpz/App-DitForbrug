'use client';

import Link from 'next/link';
import { ChangeEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { ReceiptAnalysis } from '@/lib/receipt-schema';

async function compressImage(file: File) {
  const imageAsBase64 = await new Promise<string>((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = () => resolve(String(fileReader.result));
    fileReader.onerror = () => reject(new Error('Kunne ikke læse billedet.'));
    fileReader.readAsDataURL(file);
  });

  const imageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Kunne ikke indlæse billedet.'));
    image.src = imageAsBase64;
  });

  const canvas = document.createElement('canvas');
  const maxWidth = 1600;
  const scale = Math.min(1, maxWidth / imageElement.width);

  canvas.width = Math.max(1, Math.round(imageElement.width * scale));
  canvas.height = Math.max(1, Math.round(imageElement.height * scale));

  const canvasContext = canvas.getContext('2d');

  if (!canvasContext) {
    return file;
  }

  canvasContext.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

  const compressedBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.82);
  });

  if (!compressedBlob) {
    return file;
  }

  return new File([compressedBlob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
    type: 'image/jpeg'
  });
}

function formatMoney(amount: number, currency = 'DKK') {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency
  }).format(amount);
}

export default function ScanPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [latestAnalysis, setLatestAnalysis] = useState<ReceiptAnalysis | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function checkLogin() {
      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;

      if (!session) {
        router.replace('/login');
        return;
      }

      setIsReady(true);
    }

    checkLogin();
  }, [router]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setErrorMessage('');
    setSuccessMessage('');
    setLatestAnalysis(null);

    const pickedFile = event.target.files?.[0];

    if (!pickedFile) {
      return;
    }

    const smallerFile = await compressImage(pickedFile);

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setFile(smallerFile);
    setImagePreviewUrl(URL.createObjectURL(smallerFile));
  }

  async function handleAnalyze() {
    if (!file) {
      setErrorMessage('Vælg først et billede af en kvittering.');
      return;
    }

    setIsWorking(true);
    setErrorMessage('');
    setSuccessMessage('');

    const supabase = getSupabaseBrowserClient();
    const sessionResult = await supabase.auth.getSession();
    const session = sessionResult.data.session;

    if (!session?.access_token) {
      setIsWorking(false);
      setErrorMessage('Du skal være logget ind.');
      router.replace('/login');
      return;
    }

    const formData = new FormData();
    formData.append('receipt', file);

    const apiResponse = await fetch('/api/analyze-receipt', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`
      },
      body: formData
    });

    const apiData = await apiResponse.json();
    setIsWorking(false);

    if (!apiResponse.ok) {
      setErrorMessage(apiData.error || 'Noget gik galt under analysen.');
      return;
    }

    setSuccessMessage('Kvitteringen blev analyseret og gemt.');
    setLatestAnalysis(apiData.analysis as ReceiptAnalysis);

    window.setTimeout(() => {
      router.push('/dashboard');
    }, 1200);
  }

  const hasChosenFile = Boolean(file && imagePreviewUrl);

  if (!isReady) {
    return (
      <main className="page">
        <div className="shell center">
          <p className="muted">Forbereder kamera …</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell grid">
        <section className="hero stack">
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="kicker">Kamera + AI</div>
              <h1 className="heading">Tag et billede af kvitteringen</h1>
              <p className="subheading">
                På iPhone åbner dette typisk kameraet direkte eller lader dig vælge et billede fra Fotos.
              </p>
            </div>
            <Link href="/dashboard" className="ghostButton">
              Til dashboard
            </Link>
          </div>
        </section>

        <section className="twoCol">
          <article className="card stack">
            <div>
              <label className="label" htmlFor="receipt-file">
                Vælg eller tag billede
              </label>
              <input
                id="receipt-file"
                className="fileInput"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
              />
            </div>

            <button className="primaryButton" type="button" onClick={handleAnalyze} disabled={isWorking || !hasChosenFile}>
              {isWorking ? 'Analyserer …' : 'Analyser kvittering'}
            </button>

            <p className="footerNote">
              Tip: Hold kvitteringen fladt, få god belysning og prøv at få hele totalsummen med.
            </p>

            {errorMessage ? <p className="error">{errorMessage}</p> : null}
            {successMessage ? <p className="success">{successMessage}</p> : null}
          </article>

          <article className="card stack">
            <h2 style={{ margin: 0 }}>Preview</h2>
            {imagePreviewUrl ? (
              <div className="preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreviewUrl} alt="Preview af valgt kvittering" />
              </div>
            ) : (
              <p className="muted">Vælg et billede for at se preview.</p>
            )}
          </article>
        </section>

        {latestAnalysis ? (
          <section className="card stack">
            <div className="row">
              <h2 style={{ margin: 0 }}>Seneste analyse</h2>
              <span className="badge">Gemmes i databasen</span>
            </div>

            <div className="row">
              <div>
                <strong>{latestAnalysis.store_name}</strong>
                <div className="receiptMeta">{latestAnalysis.purchase_date}</div>
              </div>
              <strong>{formatMoney(latestAnalysis.total, latestAnalysis.currency || 'DKK')}</strong>
            </div>

            <div className="grid" style={{ gap: 10 }}>
              {latestAnalysis.items.slice(0, 8).map((item, index) => (
                <div className="listItem" key={`${item.name}-${index}`}>
                  <div>
                    <div>{item.name}</div>
                    <div className="receiptMeta">
                      {item.quantity} × {formatMoney(item.price, latestAnalysis.currency || 'DKK')}
                    </div>
                  </div>
                  <span className="badge">{item.category}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
