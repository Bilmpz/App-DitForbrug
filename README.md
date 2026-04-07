# Receipt PWA

En iPhone-venlig kvitteringsapp bygget som en PWA med Next.js, Supabase og OpenAI.

## Det appen kan lige nu

- logge ind med Supabase Auth
- tage eller uploade et billede af en kvittering
- gøre billedet mindre i browseren før upload
- sende billedet til OpenAI for analyse
- gemme kvittering og varelinjer i Supabase
- vise et overblik over totaler, kategorier og seneste kvitteringer
- installeres på iPhone via Safari -> Del -> Føj til hjemmeskærm

## Stack

- Next.js 16 (App Router)
- Supabase Auth + Postgres + Storage
- OpenAI Responses API med vision
- Vercel til hosting

## Hurtig start

1. Lav en `.env.local`
2. Sæt dine Supabase- og OpenAI-nøgler ind
3. Kør `npm install`
4. Kør `npm run dev`
5. Åbn appen i browseren

## Database

Kør `supabase/schema.sql` i Supabase SQL Editor.
Det laver tabeller, policies og storage-bucket til kvitteringer.
