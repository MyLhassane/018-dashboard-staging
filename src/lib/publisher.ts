import type { Challenge } from "./types";

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || "";
const REPO_OWNER = "MyLhassane";
const REPO = import.meta.env.VITE_CHALLENGES_REPO || "fifa2026-challenges";
const BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO}/contents`;

interface GitHubFile {
  sha: string;
  content: string;
}

async function githubFetch(path: string, init?: RequestInit) {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "dashboard-publisher",
      ...init?.headers,
    },
  });
}

async function getFileSha(path: string): Promise<string | undefined> {
  try {
    const res = await githubFetch(path);
    if (!res.ok) return undefined;
    const data: GitHubFile = await res.json();
    return data.sha;
  } catch {
    return undefined;
  }
}

async function putFile(path: string, content: object, message: string): Promise<boolean> {
  const sha = await getFileSha(path);
  const body: Record<string, unknown> = {
    message,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
    committer: { name: "Dashboard Bot", email: "dashboard@fifa2026.local" },
  };
  if (sha) body.sha = sha;

  const res = await githubFetch(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return res.ok;
}

function stripInternalFields(challenge: Challenge) {
  return {
    gameNumber: challenge.gameNumber,
    remit: challenge.remit,
    players: challenge.players,
    publishedAt: challenge.publishedAt,
  };
}

export interface PublishResult {
  gameNumber: number;
  status: "success" | "failed";
  error?: string;
}

export async function publishChallenge(challenge: Challenge): Promise<PublishResult> {
  try {
    const clean = stripInternalFields(challenge);
    const path = `/challenges/${challenge.gameNumber}.json`;
    const ok = await putFile(path, clean, `Publish challenge #${challenge.gameNumber}`);
    return { gameNumber: challenge.gameNumber, status: ok ? "success" : "failed" };
  } catch (e: any) {
    return { gameNumber: challenge.gameNumber, status: "failed", error: e.message };
  }
}

export async function publishIndex(gameNumbers: number[]): Promise<boolean> {
  const index = {
    version: 1,
    updatedAt: new Date().toISOString(),
    challenges: gameNumbers.sort((a, b) => a - b),
  };
  return putFile("/challenges/index.json", index, "Update challenges index");
}

export async function unpublishChallenge(gameNumber: number): Promise<boolean> {
  const path = `/challenges/${gameNumber}.json`;
  const sha = await getFileSha(path);
  if (!sha) return true;
  const res = await githubFetch(path, {
    method: "DELETE",
    body: JSON.stringify({
      message: `Unpublish challenge #${gameNumber}`,
      sha,
      committer: { name: "Dashboard Bot", email: "dashboard@fifa2026.local" },
    }),
  });
  return res.ok;
}

export async function publishAll(
  publishedChallenges: Challenge[],
  onProgress?: (result: PublishResult) => void
): Promise<PublishResult[]> {
  const results: PublishResult[] = [];

  for (const challenge of publishedChallenges) {
    const result = await publishChallenge(challenge);
    results.push(result);
    onProgress?.(result);
  }

  const successNumbers = results
    .filter((r) => r.status === "success")
    .map((r) => r.gameNumber);

  await publishIndex(successNumbers);

  return results;
}
