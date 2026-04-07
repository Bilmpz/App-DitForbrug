export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerEnv } from '@/lib/env';
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase-server';
import { receiptJsonSchema, type ReceiptAnalysis, type ReceiptItem } from '@/lib/receipt-schema';

function cleanAnalysis(dataFromAi: ReceiptAnalysis): ReceiptAnalysis {
  return {
    store_name: dataFromAi.store_name || 'Ukendt butik',
    purchase_date: dataFromAi.purchase_date || new Date().toISOString().slice(0, 10),
    currency: dataFromAi.currency || 'DKK',
    total: Number(dataFromAi.total || 0),
    items: (dataFromAi.items || []).map((item) => ({
      name: item.name || 'Ukendt vare',
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
      category: item.category || 'Other'
    }))
  };
}

function getBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice('Bearer '.length).trim();
}

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request.headers.get('authorization'));

    if (!accessToken) {
      return NextResponse.json({ error: 'Mangler adgangstoken.' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    const supabaseAdmin = getSupabaseAdminClient();

    const userResult = await supabase.auth.getUser(accessToken);
    const user = userResult.data.user;

    if (userResult.error || !user) {
      return NextResponse.json({ error: 'Ugyldig eller udløbet session.' }, { status: 401 });
    }

    const formData = await request.formData();
    const uploadedFile = formData.get('receipt');

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json({ error: 'Ingen kvitteringsfil blev sendt.' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());
    const imageBase64 = fileBuffer.toString('base64');
    const imageType = uploadedFile.type || 'image/jpeg';
    const imageExtension = imageType.includes('png') ? 'png' : 'jpg';
    const randomName = Math.random().toString(36).slice(2);
    const storagePath = `${user.id}/${Date.now()}-${randomName}.${imageExtension}`;

    const uploadResult = await supabaseAdmin.storage.from('receipts').upload(storagePath, fileBuffer, {
      contentType: imageType,
      upsert: false
    });

    if (uploadResult.error) {
      return NextResponse.json({ error: uploadResult.error.message }, { status: 500 });
    }

    const serverEnv = getServerEnv();
    const openai = new OpenAI({ apiKey: serverEnv.openAIApiKey });

    const aiResult = await openai.responses.create({
      model: serverEnv.receiptModel,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Læs denne kvittering og returnér kun struktureret data. Udtræk butik, dato, valuta, total og varer. Kategorisér hver vare i en af de tilladte kategorier. Hvis noget er uklart, vælg det mest sandsynlige svar uden at tilføje ekstra felter.'
            },
            {
              type: 'input_image',
              image_url: `data:${imageType};base64,${imageBase64}`
            }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          ...receiptJsonSchema
        }
      }
    });

    if (!aiResult.output_text) {
      return NextResponse.json({ error: 'AI returnerede ingen data.' }, { status: 502 });
    }

    const cleanedAnalysis = cleanAnalysis(JSON.parse(aiResult.output_text) as ReceiptAnalysis);

    const saveReceiptResult = await supabaseAdmin
      .from('receipts')
      .insert({
        user_id: user.id,
        store_name: cleanedAnalysis.store_name,
        purchase_date: cleanedAnalysis.purchase_date,
        currency: cleanedAnalysis.currency,
        total: cleanedAnalysis.total,
        image_path: storagePath,
        raw_analysis: cleanedAnalysis
      })
      .select('id')
      .single();

    if (saveReceiptResult.error || !saveReceiptResult.data) {
      return NextResponse.json(
        { error: saveReceiptResult.error?.message || 'Kunne ikke gemme kvitteringen.' },
        { status: 500 }
      );
    }

    const itemRows = (cleanedAnalysis.items || []).map((item: ReceiptItem) => ({
      receipt_id: saveReceiptResult.data.id,
      name: item.name,
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
      category: item.category
    }));

    if (itemRows.length > 0) {
      const saveItemsResult = await supabaseAdmin.from('receipt_items').insert(itemRows);

      if (saveItemsResult.error) {
        return NextResponse.json({ error: saveItemsResult.error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      receiptId: saveReceiptResult.data.id,
      analysis: cleanedAnalysis
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ukendt fejl';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
