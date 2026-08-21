/**
 * Deploy firestore.rules lên Firebase (Rules API) — không cần Firebase CLI.
 *
 * Cách dùng:
 *   npm run deploy:rules
 *
 * Yêu cầu:
 *   - scripts/serviceAccountKey.json (đã có)
 *   - EXPO_PUBLIC_FIREBASE_PROJECT_ID trong .env (hoặc lấy từ service account)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin');

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './scripts/serviceAccountKey.json';
const serviceAccount = require(path.resolve(process.cwd(), keyPath));
const projectId =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id;

const RULES_API = 'https://firebaserules.googleapis.com/v1';
const RELEASE_ID = 'cloud.firestore'; // release mặc định của Firestore

async function main() {
  const rulesPath = path.resolve(__dirname, '..', 'firestore.rules');
  const content = fs.readFileSync(rulesPath, 'utf8');

  const app = initializeApp({ credential: cert(serviceAccount) });
  const { access_token: token } = await app.options.credential.getAccessToken();

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 1. Tạo ruleset mới từ nội dung file firestore.rules
  const createRes = await fetch(
    `${RULES_API}/projects/${projectId}/rulesets`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: { files: [{ name: 'firestore.rules', content }] },
      }),
    },
  );
  const created = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`Tạo ruleset thất bại: ${JSON.stringify(created, null, 2)}`);
  }
  console.log(`Da tao ruleset: ${created.name}`);

  // 2. Trỏ release cloud.firestore sang ruleset vừa tạo
  //    (PATCH nhận UpdateReleaseRequest: { release, updateMask })
  const patchRes = await fetch(
    `${RULES_API}/projects/${projectId}/releases/${RELEASE_ID}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        release: {
          name: `projects/${projectId}/releases/${RELEASE_ID}`,
          rulesetName: created.name,
        },
        updateMask: 'ruleset_name',
      }),
    },
  );
  if (patchRes.ok) {
    console.log('Deploy rules THANH CONG! (release: ' + RELEASE_ID + ')');
    return;
  }

  const patchErr = await patchRes.json();
  if (patchErr?.error?.code === 404) {
    // Release chưa tồn tại -> tạo mới
    const postRes = await fetch(`${RULES_API}/projects/${projectId}/releases`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `projects/${projectId}/releases/${RELEASE_ID}`,
        rulesetName: created.name,
      }),
    });    const posted = await postRes.json();
    if (!postRes.ok) {
      throw new Error(
        `Tạo release thất bại: ${JSON.stringify(posted, null, 2)}`,
      );
    }
    console.log('Deploy rules THANH CONG! (release moi: ' + RELEASE_ID + ')');
    return;
  }

  throw new Error(
    `Cập nhật release thất bại: ${JSON.stringify(patchErr, null, 2)}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
