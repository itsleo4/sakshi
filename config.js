/* =============================================================
   config.js  —  The Gravity of Us
   Environment-aware configuration
   ============================================================= */

// --- Supabase Secrets (loaded from .env via Vite) ---
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- Gallery Settings ---
export const SUPABASE_BUCKET      = 'sakshi';
export const SUPABASE_PHOTO_FOLDER = 'photos';
export const SUPABASE_FEATURED_PHOTO = 'photo11.jpg'; // featured prominently

// --- Passcode ---
export const CORRECT_PASSCODE = '210058';

// --- Background Music ---
export const MUSIC_URL = 'https://cdn.pixabay.com/audio/2022/10/14/audio_3d1ef338ee.mp3';

// --- YouTube Data API ---
export const YOUTUBE_API_KEY      = import.meta.env.VITE_YOUTUBE_API_KEY;
export const YOUTUBE_PLAYLIST_ID  = import.meta.env.VITE_YOUTUBE_PLAYLIST_ID;


// --- Love Letters ---
export const LOVE_LETTERS = [
    {
        title: 'Tu ajeeb hai… aur mujhe pasand hai',
        content: `Dear Tum,

Sach bolu? Tum thodi si ajeeb ho. Matlab normal log jaise react karte hain, tum waisa karti hi nahi 😭 Kabhi lagta hai robot ho, kabhi lagta hai philosopher ho, aur kabhi lagta hai "kuch bolna hi nahi hai" mode pe permanently ho.

Aur pata hai sabse funny kya hai? Main phir bhi tumhare saath rehna choose karta hoon. Kyun? Kyuki tum perfect nahi ho… par real ho. Aur real cheezein hi last karti hain.

Aur haan… thoda zyada hi pasand ho tum 🙂❤️`
    },
    {
        title: 'Main overthink karta hoon… aur tu exist karti hai',
        content: `Dear Madam Silent Mode,

Main overthink karta hoon… tu over-silent rehti hai. Kya dangerous combo hai yaar 😂

Main 100 sawal dimag me bana leta hoon… Aur tu ek line bolke game khatam kar deti hai: "Mere paas kuch bolne ko nahi hai"

Aur main wahin baitha reh jaata hoon… jaise exam me out of syllabus aa gaya ho 😭

Par phir bhi… Main har din wapas aata hoon. Kyuki shayad… tu bolti kam hai, par jo hai… woh fake nahi hai. Aur mujhe fake cheezein pasand nahi 🙂`
    },
    {
        title: 'Routine ban gayi hai tu',
        content: `Dear Daily Dose,

Sach bolu? Tu ab habit ban gayi hai. Class me tu, break me tu, baat me tu… Aur jab tu nahi hoti, tab bhi dimag me tu hi tu 😭 Thoda annoying hai honestly 😂

Par acha bhi lagta hai. Jaise chai ki aadat… chhodna mushkil, aur zarurat bhi lagti hai.

Aur main yeh accept karta hoon: Mujhe teri aadat hai… aur mujhe isse problem nahi 🙂`
    },
    {
        title: 'Tu simple hai… aur main complicated',
        content: `Dear Simple Human,

Tu simple hai. Seedhi. Straight. No drama. Aur main? Overthinking ka CEO 🤡

Main depth dhoondta hoon… tu kehti hai "kuch nahi hai bolne ko"
Main emotions feel karta hoon… tu chill mode me rehti hai

Aur pata hai kya? Shayad isi liye balance banta hai. Tu mujhe ground karti hai… Aur main thoda zyada feel kar leta hoon.

Team thodi weird hai… Par chal rahi hai 😌❤️`
    },
    {
        title: 'Main choose karta hoon',
        content: `Dear You,

Sab cheezein perfect nahi hai. Na tu perfect hai, na main. Confusion hai, difference hai, silence hai… par phir bhi main yeh bol sakta hoon:

Main choose karta hoon tujhe.

Roz nahi… har moment nahi… par consciously. Aur yeh choice hi sabse real cheez hoti hai.

Aur haan… tu important hai 🙂❤️`
    },
    {
        title: 'Main tha… aur main seekh gaya',
        isPoem: true,
        content: `Main sochta tha pyaar simple hota hai,
par phir tu mili… aur sab complex ho gaya 😄

Main har baat feel karta tha deeply,
tu kehti thi "mere paas kuch bolne ko nahi hai"

Main dhoondta raha answers tere silence me,
aur khud hi questions banata raha apne dimaag me 😔

Kabhi laga tu door hai, kabhi laga main hi zyada paas aa gaya
Kabhi jealousy, kabhi fear, kabhi overthinking…
mera dimaag mera hi dushman ban gaya 🧠🔥

Main itna serious ho gaya tha… ki khud ko hi lose karne laga
Par phir samajh aaya:
pyaar kisi ko control karna nahi hota,
aur na i khud ko tod dena hota hai

Tu apni jagah sahi hai, main apni jagah seekh raha hoon
Ab main tujhe change nahi karna chahta, aur na khud ko lose karna

Main bas itna jaanta hoon:
tu perfect nahi hai… par real hai
Aur main bhi perfect nahi… par main grow kar raha hoon 🙂

Agar yeh chalega, toh theek
agar nahi, tab bhi main theek
Par aaj ke liye:
main yahan hoon… aur tu bhi 🙂❤️`
    },
];
