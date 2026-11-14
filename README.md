# CallCatch by Neovia AI — interactive prototype

AI voice receptionist + missed-call recovery for Indian SMBs. Client-side React 18 + TypeScript + Vite demo with 3D scenes (react-three-fiber), live Web Speech voice, WhatsApp-style follow-ups and a full dashboard. All business data is fictional.

## Setup
```bash
npm install --legacy-peer-deps
npm run dev        # http://localhost:5173 (mic works on localhost / HTTPS)
npm run build      # type-check + production build
```
Use **Chrome** for voice (SpeechRecognition). Other browsers fall back to typed input automatically.

## Env vars
None needed for the demo. `LLMEngine` (`/api/riya`, `LLM_PROVIDER`, `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`) is **not built yet**: selecting "Live" engine logs a fallback and uses ScriptedEngine.

## Hotkeys
A auto-play call · M missed call · R reset · 1/2/3 variant · L engine · F fullscreen · hold Space push-to-talk · Ctrl+. presenter menu

## 3-minute demo script
1. `/` hero: "calls caught at 10 p.m. Sunday". Click **Call Riya now**.
2. Press **A** (auto-play) or Start call and say: "Kashmir December mein chaar log, budget dedh lakh" — watch lead card, RAG panel, tool chips.
3. Ask "free helicopter ride milegi?" — guardrail fires, no invented answer.
4. End call → two 3D phones: summary + brochure PDF (click to download), owner hot-lead alert. "Send to my real WhatsApp" uses the number from Presenter.
5. Dashboard: new call glows NEW; globe of leads from Thane.
6. KB: change a price → next call quotes it. 7. Press **2** to switch to the clinic. 8. **M** for missed-call mode.

## Structure
`src/services/` engine (Hinglish NLU, slot filling, BM25 KB), session controller, voice IO · `src/three/` Orb, Phones, Globe, Hero · `src/pages/` routes · `src/lib/seed.ts` seeded data.

## Known gaps vs. the brief
shadcn/ui not used (plain Tailwind); LLMEngine route; Marathi STT; day-wise hours editor in Settings; interface abstractions are in place for engine/KB/voice only; QR second screen & Supabase are Phase 2.
