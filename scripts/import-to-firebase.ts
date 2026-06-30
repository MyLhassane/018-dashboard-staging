import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set, get, child, update } from "firebase/database";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const firebaseConfig = {
  apiKey: "AIzaSyAkppkZjGZ1i9Qxm4VhSDe2dfZSHCXiF78",
  authDomain: "fifa-world-cup-2026-7d608.firebaseapp.com",
  databaseURL: "https://fifa-world-cup-2026-7d608-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fifa-world-cup-2026-7d608",
  storageBucket: "fifa-world-cup-2026-7d608.firebasestorage.app",
  messagingSenderId: "436135896460",
  appId: "1:436135896460:web:7a6252bcc05f059e0622a9",
  measurementId: "G-NT54N12T5L",
};

const DATA_DIR = join(__dirname, "..", "daily_challenges");
const COMPILED_PATH = join(__dirname, "..", "compiled_players.json");
const ROOT_PATH = join(__dirname, "..", "..");

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const DB_PREFIX = "fifa-world-cup-2026";

interface RemitItem {
  id: number;
  name: string;
  type: number;
  displayName: string;
  suffix?: string;
  prefix?: string;
  helperText?: string;
}

interface ChallengePlayer {
  id: number;
  f: string;
  g?: string;
  v: number[];
  p?: string;
}

interface ChallengeFile {
  gameData?: {
    remit?: RemitItem[][];
    players?: ChallengePlayer[];
  };
}

interface CompiledData {
  compiledAt: string;
  totalPlayers: number;
  totalChallenges: number;
  players: Record<string, {
    id: number;
    f: string;
    g: string;
    challenges: Record<string, { v: number[]; p: string }>;
  }>;
  remitMap: Record<string, RemitItem[]>;
}

function readJSON<T>(filePath: string): T | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

function getChallengeFiles(): { name: string; id: number }[] {
  return readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((f) => ({ name: f, id: parseInt(f.replace(".json", "")) }));
}

async function uploadWithRetry(path: string, data: unknown, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await set(ref(db, path), data);
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function main() {
  console.log("=== FIFA World Cup 2026: Import to Firebase ===");
  console.log("");

  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/import-to-firebase.ts <email> <password>");
    process.exit(1);
  }

  // Login
  console.log("1. تسجيل الدخول إلى Firebase...");
  await signInWithEmailAndPassword(auth, email, password);
  console.log("   ✅ تم تسجيل الدخول بنجاح");

  // Read all challenge files
  console.log("2. قراءة ملفات التحديات...");
  const files = getChallengeFiles();
  console.log(`   → ${files.length} ملف تم العثور عليه`);

  const challenges: Record<string, any> = {};
  const playerCategoriesMap = new Map<number, Set<number>>();
  const seenCategoryIds = new Map<number, { name: string; type: number; displayName: string }>();

  for (const f of files) {
    const data = readJSON<ChallengeFile>(join(DATA_DIR, f.name));
    if (!data?.gameData) continue;

    const remit = data.gameData.remit || [];
    const players = data.gameData.players || [];

    // Flatten remit to collect category IDs
    for (const group of remit) {
      for (const item of group) {
        if (!seenCategoryIds.has(item.id)) {
          seenCategoryIds.set(item.id, {
            name: item.name,
            type: item.type,
            displayName: item.displayName,
          });
        }
      }
    }

    // Collect player category links
    for (const p of players) {
      const existing = playerCategoriesMap.get(p.id) || new Set();
      for (const vid of p.v) existing.add(vid);
      playerCategoriesMap.set(p.id, existing);
    }

    challenges[String(f.id)] = {
      gameNumber: f.id,
      remit,
      players,
      publishedAt: null,
      updatedAt: new Date().toISOString(),
      updatedBy: "import",
    };
  }

  console.log(`   ✅ ${Object.keys(challenges).length} تحدي تمت قراءتها`);

  // Build players from compiled_players.json + challenge data
  console.log("3. بناء بيانات اللاعبين...");
  const compiled = readJSON<CompiledData>(COMPILED_PATH);
  const players: Record<string, any> = {};

  if (compiled) {
    for (const [pidStr, p] of Object.entries(compiled.players)) {
      const catLinks: Record<string, number[]> = {};
      const posSet = new Set<string>();

      for (const [chId, chData] of Object.entries(p.challenges)) {
        const categoryIds = chData.v || [];
        if (chData.p) posSet.add(chData.p);

        // Try to map numeric IDs to category codes
        // For now, store as "cat_{id}" format
        for (const vid of categoryIds) {
          const key = `cat_${vid}`;
          if (!catLinks[key]) catLinks[key] = [];
          if (!catLinks[key].includes(vid)) catLinks[key].push(vid);
        }
      }

      players[pidStr] = {
        id: p.id,
        f: p.f,
        g: p.g || "",
        positions: [...posSet],
        categoryLinks: catLinks,
        challengeCount: Object.keys(p.challenges).length,
      };
    }
  }

  // If compiled doesn't have data, build from challenges
  if (Object.keys(players).length === 0) {
    const playerMap = new Map<number, any>();
    for (const ch of Object.values(challenges) as any[]) {
      for (const p of ch.players) {
        if (!playerMap.has(p.id)) {
          playerMap.set(p.id, {
            id: p.id,
            f: p.f,
            g: p.g || "",
            positions: [],
            categoryLinks: {},
            challengeCount: 0,
          });
        }
        const existing = playerMap.get(p.id)!;
        existing.challengeCount++;
        if (p.p && !existing.positions.includes(p.p)) existing.positions.push(p.p);
      }
    }
    for (const [id, data] of playerMap) {
      players[String(id)] = data;
    }
  }

  console.log(`   ✅ ${Object.keys(players).length} لاعب تم بناؤهم`);

  // Build categories
  console.log("4. بناء التصنيفات...");
  const typeNames: Record<number, string> = {
    1: "national",
    2: "club",
    3: "league",
    4: "manager",
    5: "teammate",
    6: "trophy",
    8: "achievement",
  };

  const categories: Record<string, any> = {};
  for (const [id, info] of seenCategoryIds) {
    categories[`cat_${id}`] = {
      id: `cat_${id}`,
      name: info.name,
      type: typeNames[info.type] || "unknown",
      media: "",
      numericIds: [id],
      description: info.displayName,
      sortOrder: id,
    };
  }
  console.log(`   ✅ ${Object.keys(categories).length} تصنيف تم بناؤهم`);

  // Build config
  const config = {
    general: {
      startDate: "2023-09-11T00:00:00.000Z",
      cardSize: 16,
      cardSizeOptions: [12, 16, 20],
      totalAttempts: 42,
      playerTimer: 10,
      scoring: { correctPoints: 3 },
    },
    roomCategories: {},
    theme: {
      primaryColor: "#ceff27",
      surfaceColor: "#3c2b4b",
    },
  };

  // Upload to Firebase
  console.log("5. رفع البيانات إلى Firebase...");
  console.log("");

  const basePath = `${DB_PREFIX}/dashboard`;

  const totalChunks = 5;
  let current = 0;

  // Challenges
  current++;
  console.log(`   [${current}/${totalChunks}] رفع التحديات...`);
  await uploadWithRetry(`${basePath}/challenges`, challenges);
  console.log(`       ✅ ${Object.keys(challenges).length} تحدي`);

  // Players (upload in batches of 100 to avoid large payloads)
  current++;
  console.log(`   [${current}/${totalChunks}] رفع اللاعبين...`);
  const playerEntries = Object.entries(players);
  const batchSize = 100;
  for (let i = 0; i < playerEntries.length; i += batchSize) {
    const batch = Object.fromEntries(playerEntries.slice(i, i + batchSize));
    await uploadWithRetry(`${basePath}/players/${playerEntries[i][0]}`, batch[playerEntries[i][0]]);
    // Actually, let's upload the player individually
    for (const [pid, pdata] of Object.entries(batch)) {
      await uploadWithRetry(`${basePath}/players/${pid}`, pdata);
    }
    if (i % 300 === 0) {
      console.log(`       → ${Math.min(i + batchSize, playerEntries.length)}/${playerEntries.length}`);
    }
  }
  console.log(`       ✅ ${playerEntries.length} لاعب`);

  // Categories
  current++;
  console.log(`   [${current}/${totalChunks}] رفع التصنيفات...`);
  for (const [cid, cdata] of Object.entries(categories)) {
    await uploadWithRetry(`${basePath}/categories/${cid}`, cdata);
  }
  console.log(`       ✅ ${Object.keys(categories).length} تصنيف`);

  // Config
  current++;
  console.log(`   [${current}/${totalChunks}] رفع الإعدادات...`);
  await uploadWithRetry(`${basePath}/config`, config);
  console.log("       ✅ الإعدادات");

  // Admins (the user who runs the script is auto-added)
  current++;
  console.log(`   [${current}/${totalChunks}] إعداد حساب المشرف...`);
  if (auth.currentUser) {
    await uploadWithRetry(`${basePath}/admins/${auth.currentUser.uid}`, {
      role: "admin",
      email: auth.currentUser.email,
      name: auth.currentUser.email?.split("@")[0] || "Admin",
    });
    console.log(`       ✅ المشرف: ${auth.currentUser.email}`);
  }

  console.log("");
  console.log("=== ✅ اكتمل الاستيراد بنجاح ===");
  console.log(`   التحديات: ${Object.keys(challenges).length}`);
  console.log(`   اللاعبون: ${Object.keys(players).length}`);
  console.log(`   التصنيفات: ${Object.keys(categories).length}`);
  console.log("");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ فشل:", e.message);
  process.exit(1);
});
