import type { Pkg, VariantId } from './types'

export interface ScriptStep { who: 'riya' | 'caller'; text: string; tool?: { name: string; args: unknown; result: unknown; ms: number }; kb?: { title: string; score: number }; guardrail?: string; fields?: Record<string, string>; lang?: 'HI' | 'EN' | 'MIX' }
export interface Variant {
  id: VariantId; name: string; short: string; city: string; persona: string; accent: string; mono: string; ownerWord: string
  hours: { days: number[]; ranges: [number, number][]; label: string }
  slots: string[]; labels: Record<string, string>; packages: Pkg[]; faqs: { q: string; a: string }[]; info: { k: string; v: string }[]
  greeting: string; script: ScriptStep[]; unit: string; chartTitle: string; callbackWord: string
  destinations: { name: string; lat: number; lng: number; aliases: string[] }[]
}

const P = (id: string, name: string, duration: string, price: number, highlights: string, best: string, dest: string, intl = false): Pkg => ({ id, name, duration, price, highlights, best, dest, intl })

export const GRIEF = 'Yeh mere paas confirm nahi hai — galat nahi bataungi. Hamare travel expert callback pe confirm kar denge.'

const travel: Variant = {
  id: 'travel', name: 'Wanderlust Holidays', short: 'Wanderlust', city: 'Thane', persona: 'Riya', accent: '#2EE6C5', mono: 'WH', ownerWord: 'Hot lead',
  hours: { days: [1, 2, 3, 4, 5, 6], ranges: [[10, 19]], label: '10 a.m.–7 p.m., Mon–Sat' },
  slots: ['destination', 'month', 'travellers', 'budget', 'name', 'callback'],
  labels: { destination: 'Destination', month: 'Travel month', travellers: 'Travellers', budget: 'Budget', name: 'Name', callback: 'Callback slot', phone: 'Phone' },
  unit: 'per person, twin sharing', chartTitle: 'Leads by destination', callbackWord: 'callback',
  packages: [
    P('kashmir-classic', 'Kashmir Paradise', '5N/6D', 24999, 'Srinagar 3N (1N houseboat), Gulmarg 1N, Pahalgam 1N; breakfast + dinner; private cab; Shikara ride', 'Mar–Jun', 'Kashmir'),
    P('kashmir-snow', 'Kashmir Snow Special', '6N/7D', 31999, 'Srinagar 3N (1N houseboat), Gulmarg 2N, Pahalgam 1N; breakfast + dinner; private cab; Shikara ride; snow-gear assistance', 'Dec–Feb', 'Kashmir'),
    P('kerala-classic', 'Kerala Backwaters & Hills', '4N/5D', 19999, 'Munnar 2N, Thekkady 1N, Alleppey houseboat 1N; breakfast; private cab', 'Sep–Mar', 'Kerala'),
    P('kerala-family', 'Kerala Family Escape', '6N/7D', 27499, 'Munnar, Thekkady, Alleppey, Kovalam; breakfast; private cab; spice plantation visit', 'Sep–Mar', 'Kerala'),
    P('goa-break', 'Goa Beach Break', '3N/4D', 11999, '3-star resort near Calangute; breakfast; airport transfers; North Goa tour', 'Oct–Mar', 'Goa'),
    P('goa-luxe', 'Goa Luxe Getaway', '4N/5D', 22999, '5-star beach resort, South Goa; breakfast + dinner; transfers; sunset cruise', 'Oct–Mar', 'Goa'),
    P('dubai-classic', 'Dubai Classic', '4N/5D', 54999, 'Return flights from Mumbai; visa processing; 4-star hotel; desert safari with BBQ dinner; city tour; Dhow cruise', 'Oct–Apr', 'Dubai', true),
    P('dubai-abudhabi', 'Dubai + Abu Dhabi', '6N/7D', 72999, 'Flights; visa processing; 4-star hotels; desert safari; Abu Dhabi city tour; Dhow cruise', 'Oct–Apr', 'Dubai', true),
    P('thai-phuket', 'Phuket & Krabi', '5N/6D', 42999, 'Flights; 4-star hotels; Phi Phi island tour; 4-island tour Krabi; transfers', 'Nov–Apr', 'Phuket', true),
    P('thai-bkk', 'Bangkok & Pattaya', '4N/5D', 34999, 'Flights; hotels; Coral Island tour; Bangkok city & temple tour; transfers', 'Nov–Apr', 'Bangkok', true),
    P('bali-honeymoon', 'Bali Honeymoon', '6N/7D', 68999, 'Flights; private pool villa 2N; Ubud + Seminyak; candlelight dinner; Kintamani tour', 'Apr–Oct', 'Bali', true),
    P('bali-explorer', 'Bali Explorer', '5N/6D', 56999, 'Flights; 4-star hotels; Ubud swing; Tanah Lot sunset; Nusa Penida day trip', 'Apr–Oct', 'Bali', true),
  ],
  faqs: [
    { q: 'Visa help', a: 'Visa help is offered for Dubai, Thailand and Bali. A passport valid for 6+ months and a recent photo are generally needed. The visa desk confirms the exact rules.' },
    { q: 'Cancellation', a: 'Cancellation is as per the package terms shared at booking.' },
    { q: 'Group discounts', a: 'Our expert will share the best price on the callback.' },
    { q: 'Payment options', a: 'You can pay by UPI, cards or bank transfer. A 25% booking amount is needed. EMI on cards is available for bookings above ₹30,000.' },
  ],
  info: [{ k: 'Address', v: 'Office 12, Sai Darshan Complex, Gokhale Road, Thane West' }, { k: 'Office hours', v: '10 a.m. to 7 p.m., Monday to Saturday. Closed on Sunday.' }],
  greeting: 'Namaste! Main Riya hoon, Wanderlust Holidays ki AI assistant. Quality ke liye yeh call record ho rahi hai. Bataiye, main aapki kaise help kar sakti hoon?',
  destinations: [
    { name: 'Kashmir', lat: 34.0837, lng: 74.7973, aliases: ['kashmir', 'कश्मीर', 'srinagar', 'gulmarg', 'pahalgam'] },
    { name: 'Kerala', lat: 9.9312, lng: 76.2673, aliases: ['kerala', 'केरल', 'kochi', 'munnar', 'alleppey'] },
    { name: 'Goa', lat: 15.2993, lng: 74.124, aliases: ['goa', 'गोवा'] },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708, aliases: ['dubai', 'दुबई', 'abu dhabi'] },
    { name: 'Phuket', lat: 7.8804, lng: 98.3923, aliases: ['phuket', 'krabi', 'फुकेट'] },
    { name: 'Bangkok', lat: 13.7563, lng: 100.5018, aliases: ['bangkok', 'pattaya', 'thailand', 'बैंकॉक'] },
    { name: 'Bali', lat: -8.3405, lng: 115.092, aliases: ['bali', 'बाली'] },
  ],
  script: [
    { who: 'riya', text: 'Namaste! Main Riya hoon, Wanderlust Holidays ki AI assistant. Quality ke liye yeh call record ho rahi hai. Bataiye, main aapki kaise help kar sakti hoon?', lang: 'HI' },
    { who: 'caller', text: 'Hi, December mein Kashmir trip ka kya price hai? Hum chaar log hain.', lang: 'MIX', fields: { destination: 'Kashmir', month: 'December', travellers: '4' }, tool: { name: 'search_knowledge_base', args: { query: 'kashmir december price' }, result: { top: [{ doc: 'Kashmir Snow Special', score: 0.91 }, { doc: 'Kashmir Paradise', score: 0.64 }] }, ms: 184 }, kb: { title: 'Kashmir Snow Special', score: 0.91 } },
    { who: 'riya', text: 'December ke liye Kashmir Snow Special best rahega — 6 raatein, 7 din. Starting {price:kashmir-snow} per person, twin sharing, yaani chaar logon ke liye lagbhag {total:kashmir-snow:4}.', lang: 'MIX' },
    { who: 'caller', text: 'Usme kya kya included hai?', lang: 'HI', kb: { title: 'Kashmir Snow Special', score: 0.88 } },
    { who: 'riya', text: 'Hotels, breakfast aur dinner, Srinagar mein ek raat houseboat, private cab aur Shikara ride included hai. Flights alag se hain.', lang: 'MIX' },
    { who: 'caller', text: 'Gulmarg gondola ka ticket bhi included hai?', lang: 'MIX', guardrail: 'Unverified: gondola ticket → deferred to expert ✓', kb: { title: 'Kashmir Snow Special', score: 0.29 } },
    { who: 'riya', text: 'Yeh mere paas confirm nahi hai, galat nahi bataungi. Hamare travel expert callback pe confirm kar denge.', lang: 'MIX' },
    { who: 'caller', text: 'Theek hai. Total budget around dedh lakh hai.', lang: 'HI', fields: { budget: '₹1,50,000' } },
    { who: 'riya', text: 'Perfect, yeh budget mein aa jayega. Aapka naam bata dijiye?', lang: 'MIX' },
    { who: 'caller', text: 'Rahul Deshpande.', lang: 'EN', fields: { name: 'Rahul Deshpande' }, tool: { name: 'create_lead', args: { name: 'Rahul Deshpande', phone: '+91 98XXX XX321', need: { destination: 'Kashmir', month: 'December', travellers: 4, budget_inr: 150000 }, source: 'AI call' }, result: { lead_id: 'L-2041', score: 85 }, ms: 241 } },
    { who: 'riya', text: 'Thank you Rahul ji. Abhi office band hai — kal Monday ko hamari agent aapko call kare? Kaunsa time theek rahega?', lang: 'MIX' },
    { who: 'caller', text: 'Kal subah 11 baje.', lang: 'HI', fields: { callback: 'Mon 11:00 AM' }, tool: { name: 'book_callback', args: { lead_id: 'L-2041', preferred_slot: 'Mon 11:00 IST' }, result: { status: 'confirmed', slot: 'Mon 11:00 IST', assigned_to: 'Priya' }, ms: 312 } },
    { who: 'riya', text: 'Done! Kal Monday subah 11 baje Priya aapko call karengi. Kashmir package ka brochure WhatsApp pe bhej doon?', lang: 'MIX' },
    { who: 'caller', text: 'Haan, bhej do.', lang: 'HI', tool: { name: 'send_whatsapp_brochure', args: { lead_id: 'L-2041', package_id: 'kashmir-snow' }, result: { message_id: 'wamid.HBgM7x91', status: 'sent' }, ms: 276 } },
    { who: 'riya', text: 'Bhej diya! Aur kuch madad chahiye?', lang: 'HI' },
    { who: 'caller', text: 'Nahi, thank you.', lang: 'EN' },
    { who: 'riya', text: 'Thank you Rahul ji, aapka din shubh rahe. Bye!', lang: 'MIX' },
  ],
}

const clinic: Variant = {
  id: 'clinic', name: 'SmileCare Dental Clinic', short: 'SmileCare', city: 'Dombivli', persona: 'Asha', accent: '#5BC0FF', mono: 'SC', ownerWord: 'New booking',
  hours: { days: [1, 2, 3, 4, 5, 6], ranges: [[10, 14], [17, 21]], label: '10–2 and 5–9, Mon–Sat' },
  slots: ['destination', 'callback', 'name'],
  labels: { destination: 'Treatment', month: 'Preference', travellers: 'Patients', budget: 'Est. cost', name: 'Name', callback: 'Appointment', phone: 'Phone' },
  unit: 'per visit', chartTitle: 'Enquiries by service', callbackWord: 'appointment',
  packages: [
    P('consult', 'Consultation', '', 500, 'Dentist consultation', 'Any', 'Consultation'),
    P('scaling', 'Scaling & Cleaning', '', 1200, 'Scaling and polishing', 'Any', 'Cleaning'),
    P('filling', 'Tooth-coloured Filling', '', 1500, 'Tooth-coloured filling, price starts from', 'Any', 'Filling'),
    P('rct', 'Root Canal', '', 4500, 'Root canal treatment, price starts from', 'Any', 'Root canal'),
    P('braces', 'Braces Consultation', '', 0, 'Braces consultation is free', 'Any', 'Braces'),
  ],
  faqs: [{ q: 'Payment options', a: 'You can pay by UPI or card.' }, { q: 'Medical advice', a: 'Asha never gives medical advice. For severe pain, swelling or bleeding, please seek urgent care; she can transfer the call.' }],
  info: [{ k: 'Address', v: 'SmileCare Dental Clinic, Dombivli East (fictional)' }, { k: 'Hours', v: 'Mon–Sat, 10 a.m. to 2 p.m. and 5 p.m. to 9 p.m.' }],
  greeting: 'Namaste! Main Asha, SmileCare Dental Clinic ki AI assistant hoon. Yeh call record ho rahi hai. Bataiye, kaise madad karun?',
  destinations: [
    { name: 'Cleaning', lat: 0, lng: 0, aliases: ['cleaning', 'scaling', 'safai'] }, { name: 'Filling', lat: 0, lng: 0, aliases: ['filling'] },
    { name: 'Root canal', lat: 0, lng: 0, aliases: ['root canal', 'rct'] }, { name: 'Braces', lat: 0, lng: 0, aliases: ['braces', 'aligner'] }, { name: 'Consultation', lat: 0, lng: 0, aliases: ['consultation', 'checkup'] },
  ],
  script: [
    { who: 'riya', text: 'Namaste! Main Asha, SmileCare Dental Clinic ki AI assistant hoon. Yeh call record ho rahi hai. Bataiye, kaise madad karun?', lang: 'HI' },
    { who: 'caller', text: 'Mala teeth cleaning karaychi aahe, kitna charge hai?', lang: 'MIX', fields: { destination: 'Cleaning' }, tool: { name: 'search_knowledge_base', args: { query: 'teeth cleaning charge' }, result: { top: [{ doc: 'Scaling & Cleaning', score: 0.93 }] }, ms: 151 }, kb: { title: 'Scaling & Cleaning', score: 0.93 } },
    { who: 'riya', text: 'Scaling ani cleaning ₹1,200 aahe. Tumhala appointment kadhi pahije?', lang: 'MIX' },
    { who: 'caller', text: 'Shanivaar sandhyakali chalel.', lang: 'MIX', fields: { callback: 'Sat 6:00 PM' } },
    { who: 'riya', text: 'Shanivaar sandhyakali 6 vajta slot available aahe. Tumcha naav sanga?', lang: 'MIX', },
    { who: 'caller', text: 'Sneha Patil.', lang: 'EN', fields: { name: 'Sneha Patil' }, tool: { name: 'create_lead', args: { name: 'Sneha Patil', phone: '+91 97XXX XX118', need: { service: 'Cleaning' }, source: 'AI call' }, result: { lead_id: 'L-3012', score: 62 }, ms: 233 } },
    { who: 'riya', text: 'Dhanyavaad Sneha ji! Shanivaar 6 vajta tumcha appointment confirm jhala. Details WhatsApp var pathavte.', lang: 'MIX', },
  ],
}
clinic.script[4].tool = { name: 'book_callback', args: { lead_id: 'L-3012', preferred_slot: 'Sat 18:00 IST' }, result: { status: 'confirmed', slot: 'Sat 18:00 IST', assigned_to: 'Dr. Mehta' }, ms: 290 }

const realestate: Variant = {
  id: 'realestate', name: 'Skyline Heights', short: 'Skyline', city: 'Kalyan West', persona: 'Neha', accent: '#FFB547', mono: 'SH', ownerWord: 'Site visit',
  hours: { days: [0, 1, 2, 3, 4, 5, 6], ranges: [[10, 19]], label: '10 a.m.–7 p.m., daily' },
  slots: ['destination', 'callback', 'name'],
  labels: { destination: 'Configuration', month: 'Preference', travellers: 'Visitors', budget: 'Budget', name: 'Name', callback: 'Site visit', phone: 'Phone' },
  unit: 'onwards, all-inclusive price to be confirmed by sales', chartTitle: 'Enquiries by configuration', callbackWord: 'site visit',
  packages: [
    P('1bhk', '1 BHK', '', 4500000, '1 BHK apartment, starting price', 'Any', '1 BHK'),
    P('2bhk', '2 BHK', '', 6800000, '2 BHK apartment, starting price', 'Any', '2 BHK'),
  ],
  faqs: [{ q: 'Possession', a: 'The possession timeline is shared by the sales team.' }, { q: 'Amenities', a: 'Clubhouse, gym, kids play area, landscaped garden and covered parking.' }, { q: 'Loans and RERA', a: 'Loan eligibility and legal or RERA details are handled by the sales team.' }],
  info: [{ k: 'Site office', v: 'Skyline Heights site office, Kalyan West (fictional). Open daily 10 a.m. to 7 p.m.' }],
  greeting: 'Namaste! Main Neha, Skyline Heights ki AI assistant. Yeh call record ho rahi hai. Bataiye, kaise help karun?',
  destinations: [{ name: '1 BHK', lat: 0, lng: 0, aliases: ['1 bhk', '1bhk', 'one bhk', 'ek bhk'] }, { name: '2 BHK', lat: 0, lng: 0, aliases: ['2 bhk', '2bhk', 'two bhk', 'do bhk'] }],
  script: [
    { who: 'riya', text: 'Namaste! Main Neha, Skyline Heights ki AI assistant. Yeh call record ho rahi hai. Bataiye, kaise help karun?', lang: 'HI' },
    { who: 'caller', text: '2 BHK ka price kya hai?', lang: 'MIX', fields: { destination: '2 BHK' }, tool: { name: 'search_knowledge_base', args: { query: '2 BHK price' }, result: { top: [{ doc: '2 BHK', score: 0.94 }] }, ms: 143 }, kb: { title: '2 BHK', score: 0.94 } },
    { who: 'riya', text: '2 BHK ₹68 lakh se start hota hai; final all-inclusive price hamari sales team confirm karegi. Kya aap site visit karna chahenge?', lang: 'MIX' },
    { who: 'caller', text: 'Haan, is Sunday ko.', lang: 'MIX' },
    { who: 'riya', text: 'Sunday ko 11 baje ya 4 baje — kaunsa slot theek rahega?', lang: 'MIX' },
    { who: 'caller', text: '4 baje. Naam Amit Joshi.', lang: 'MIX', fields: { callback: 'Sun 4:00 PM', name: 'Amit Joshi' }, tool: { name: 'create_lead', args: { name: 'Amit Joshi', phone: '+91 99XXX XX764', need: { config: '2 BHK' }, source: 'AI call' }, result: { lead_id: 'L-4007', score: 74 }, ms: 228 } },
    { who: 'riya', text: 'Thank you Amit ji! Sunday 4 baje site visit book ho gayi. Location aur brochure WhatsApp pe bhej rahi hoon.', lang: 'MIX' },
  ],
}
realestate.script[5].tool = { name: 'create_lead', args: { name: 'Amit Joshi', phone: '+91 99XXX XX764', need: { config: '2 BHK' }, source: 'AI call' }, result: { lead_id: 'L-4007', score: 74 }, ms: 228 }

export const VARIANTS: Record<VariantId, Variant> = { travel, clinic, realestate }
export const FIRST_NAMES = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Suresh', 'Meera', 'Arjun', 'Kavita', 'Imran', 'Deepa', 'Gurpreet', 'Lakshmi', 'Rohan', 'Pooja', 'Faisal', 'Neelam', 'Karthik', 'Divya', 'Harsh', 'Ritu', 'Sandeep', 'Nisha', 'Abhishek', 'Swati', 'Manoj', 'Tanvi', 'Joseph', 'Ayesha']
export const LAST_NAMES = ['Deshpande', 'Sharma', 'Joshi', 'Patil', 'Nair', 'Iyer', 'Khan', 'Singh', 'Gupta', 'Reddy', 'Kulkarni', 'Mehta', 'Banerjee', 'Pillai', 'Chopra', 'Shetty', 'Verma', 'Menon', 'Das', 'Fernandes']
