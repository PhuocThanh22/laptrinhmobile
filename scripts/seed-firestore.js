/**
 * Script tạo dữ liệu demo cho MiniShop.
 *
 * Cách dùng:
 *   1. Cài firebase-admin:   npm i -D firebase-admin dotenv
 *   2. Tạo service account trong Firebase Console:
 *        Project Settings > Service accounts > Generate new private key
 *        Lưu file JSON vào thư mục scripts/ (vd: scripts/serviceAccountKey.json)
 *   3. Mở file .env thêm dòng:
 *        FIREBASE_SERVICE_ACCOUNT_PATH=./scripts/serviceAccountKey.json
 *      (đảm bảo các EXPO_PUBLIC_FIREBASE_* đã điền đúng)
 *   4. Chạy:
 *        npm run seed
 *
 * Script tạo 2 tài khoản demo:
 *   - seller@demo.com / 123456  (Nguyễn Văn Nam)
 *   - buyer@demo.com  / 123456  (Trần Thị Lan)
 *
 * Ảnh dùng placeholder (picsum) — khi demo thật sẽ là URL Cloudinary.
 */
require('dotenv').config();
const { initializeApp, cert, getApps } = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');
const fs = require('fs');

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './scripts/serviceAccountKey.json';

if (!fs.existsSync(path.resolve(serviceAccountPath))) {
  console.error(
    '✖ Không tìm thấy service account:',
    path.resolve(serviceAccountPath),
  );
  console.error('  Hãy tải file serviceAccountKey.json về thư mục scripts/ và thêm FIREBASE_SERVICE_ACCOUNT_PATH vào .env');
  process.exit(1);
}

const serviceAccount = require(path.resolve(serviceAccountPath));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = getFirestore();
const auth = getAuth();

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const NOW = Date.now();

const FRESH = process.argv.includes('--fresh');

const img = (seed) => `https://picsum.photos/seed/${seed}/600/600`;

async function wipeExistingData() {
  console.log('-- Xoá dữ liệu cũ (--fresh) --');
  for (const col of ['products', 'bids', 'orders', 'carts']) {
    const snap = await db.collection(col).get();
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    console.log(`  • Xoá ${snap.size} doc trong ${col}`);
  }
  for (const email of ['seller@demo.com', 'buyer@demo.com']) {
    try {
      const u = await auth.getUserByEmail(email);
      await db.collection('users').doc(u.uid).delete();
      console.log(`  • Xoá user doc ${email}`);
    } catch {
      /* user chưa tồn tại */
    }
  }
}

async function createUser(email, password, name, phone) {
  let uid;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`  • Đã tồn tại tài khoản ${email}`);
  } catch {
    const user = await auth.createUser({ email, password, displayName: name });
    uid = user.uid;
    console.log(`  ✓ Tạo tài khoản ${email} (${name})`);
  }
  await db.collection('users').doc(uid).set({
    name,
    email,
    phone,
    avatar: '',
    createdAt: NOW - DAY,
  });
  // Demo users được đánh dấu emailVerified để đăng nhập qua màn hình xác thực.
  await auth.updateUser(uid, { emailVerified: true });
  return uid;
}

async function seed() {
  console.log('== Bắt đầu seed dữ liệu MiniShop ==\n');

  if (FRESH) {
    await wipeExistingData();
    console.log();
  }

  // ---------- Users ----------
  const sellerId = await createUser('seller@demo.com', '123456', 'Nguyễn Văn Nam', '0901000001');
  const buyerId = await createUser('buyer@demo.com', '123456', 'Trần Thị Lan', '0901000002');

  // ---------- Sản phẩm giá cố định ----------
  const fixedProducts = [
    {
      name: 'Giáo trình Lập trình C++',
      category: 'sach',
      condition: 'used',
      description: 'Giáo trình Lập trình C++ của trường, còn sử dụng tốt 90%, có ghi chú nhẹ bằng bút chì.',
      price: 150000,
      status: 'active',
      seed: 'cpp-book',
    },
    {
      name: 'Tai nghe Bluetooth',
      category: 'phu-kien',
      condition: 'like-new',
      description: 'Tai nghe Bluetooth, dùng 2 tháng, đầy đủ hộp và cáp sạc, pin tốt.',
      price: 250000,
      status: 'active',
      seed: 'earbuds',
    },
    {
      name: 'Áo thun đại học (đã bán)',
      category: 'quan-ao',
      condition: 'used',
      description: 'Áo thun đồng phục size M, đã bán rồi để demo trạng thái.',
      price: 50000,
      status: 'sold',
      seed: 'tshirt',
    },
  ];

  console.log('-- Sản phẩm giá cố định --');
  const fixedIds = [];
  for (const p of fixedProducts) {
    const ref = await db.collection('products').add({
      sellerId,
      name: p.name,
      description: p.description,
      category: p.category,
      images: [img(p.seed)],
      condition: p.condition,
      saleType: 'fixed',
      price: p.price,
      status: p.status,
      createdAt: NOW - 2 * DAY,
    });
    fixedIds.push(ref.id);
    console.log(`  ✓ ${p.name} - ${p.price.toLocaleString('vi-VN')}đ [${p.status}]`);
  }

  // ---------- Sản phẩm đấu giá đang diễn ra ----------
  const activeAuctions = [
    {
      name: 'Laptop Dell cũ',
      category: 'laptop',
      condition: 'used',
      description: 'Laptop Dell cũ, cấu hình văn phòng ổn định, pin ~2h, màn hình sạch.',
      startingPrice: 2000000,
      bidIncrement: 100000,
      endIn: DAY,
      seed: 'dell-laptop',
    },
    {
      name: 'Bàn phím cơ',
      category: 'phu-kien',
      condition: 'used',
      description: 'Bàn phím cơ switch red, keycap đầy đủ, LED đỏ, hoạt động tốt.',
      startingPrice: 300000,
      bidIncrement: 20000,
      endIn: 2 * HOUR,
      seed: 'mech-kb',
    },
    {
      name: 'Máy tính Casio',
      category: 'dien-tu',
      condition: 'new',
      description: 'Máy tính Casio fx-580VN X mới 100%, còn nguyên hộp.',
      startingPrice: 150000,
      bidIncrement: 10000,
      endIn: 3 * DAY,
      seed: 'casio',
    },
  ];

  console.log('\n-- Đấu giá đang diễn ra --');
  const auctionIds = [];
  for (const p of activeAuctions) {
    const ref = await db.collection('products').add({
      sellerId,
      name: p.name,
      description: p.description,
      category: p.category,
      images: [img(p.seed)],
      condition: p.condition,
      saleType: 'auction',
      startingPrice: p.startingPrice,
      currentPrice: p.startingPrice,
      bidIncrement: p.bidIncrement,
      startTime: NOW,
      endTime: NOW + p.endIn,
      bidsCount: 0,
      winnerId: null,
      status: 'auction_active',
      createdAt: NOW - 3 * HOUR,
    });
    auctionIds.push(ref.id);
    console.log(
      `  ✓ ${p.name} - khởi điểm ${p.startingPrice.toLocaleString('vi-VN')}đ, bước ${p.bidIncrement.toLocaleString('vi-VN')}đ`,
    );
  }

  // Thêm vài lượt đấu cho phiên đang diễn ra
  const seedBids = [
    { productIndex: 0, amounts: [2100000, 2200000, 2300000] },
    { productIndex: 1, amounts: [320000, 340000] },
  ];
  console.log('\n-- Lượt đấu cho phiên đang diễn ra --');
  for (const { productIndex, amounts } of seedBids) {
    const productId = auctionIds[productIndex];
    for (let i = 0; i < amounts.length; i++) {
      const bid = await db.collection('bids').add({
        productId,
        bidderId: buyerId,
        amount: amounts[i],
        createdAt: NOW - 2 * HOUR + i * 30 * 60_000,
      });
      void bid;
      console.log(`  ✓ ${activeAuctions[productIndex].name}: ${amounts[i].toLocaleString('vi-VN')}đ`);
    }
    await db.collection('products').doc(productId).update({
      currentPrice: amounts[amounts.length - 1],
      bidsCount: amounts.length,
    });
  }

  // ---------- Đấu giá đã kết thúc ----------
  console.log('\n-- Đấu giá đã kết thúc --');
  const endedRef = await db.collection('products').add({
    sellerId,
    name: 'Túi chống sốc laptop',
    category: 'phu-kien',
    condition: 'used',
    description: 'Túi chống sốc laptop 15.6 inch, đã kết thúc đấu giá, người thắng là Trần Thị Lan.',
    images: [img('laptop-bag')],
    saleType: 'auction',
    startingPrice: 100000,
    currentPrice: 150000,
    bidIncrement: 10000,
    startTime: NOW - 2 * DAY,
    endTime: NOW - 6 * HOUR,
    bidsCount: 2,
    winnerId: buyerId,
    status: 'auction_ended',
    createdAt: NOW - 2 * DAY,
  });
  const endedBids = [
    { amount: 120000, at: NOW - 1 * DAY },
    { amount: 150000, at: NOW - 7 * HOUR },
  ];
  for (const b of endedBids) {
    await db.collection('bids').add({
      productId: endedRef.id,
      bidderId: buyerId,
      amount: b.amount,
      createdAt: b.at,
    });
  }
  console.log('  ✓ Túi chống sốc laptop - kết thúc, winner = Trần Thị Lan (150.000đ)');

  // ---------- Đơn hàng mẫu ----------
  console.log('\n-- Đơn hàng mẫu --');
  const orderRef = await db.collection('orders').add({
    buyerId,
    buyerName: 'Trần Thị Lan',
    sellerIds: [sellerId],
    items: [
      {
        productId: fixedIds[1],
        name: 'Tai nghe Bluetooth',
        image: img('earbuds'),
        price: 250000,
        quantity: 1,
        saleType: 'fixed',
      },
    ],
    totalAmount: 250000,
    receiverName: 'Trần Thị Lan',
    phone: '0901000002',
    address: 'Ký túc xá KTX A, TP. Hồ Chí Minh',
    note: '',
    paymentMethod: 'cod',
    status: 'pending',
    createdAt: NOW - 5 * HOUR,
  });
  void orderRef;
  console.log('  ✓ Đơn hàng "Tai nghe Bluetooth" - 250.000đ [pending]');

  console.log('\n== Hoàn tất seed dữ liệu ==');
  console.log('Đăng nhập demo:');
  console.log('  seller@demo.com / 123456');
  console.log('  buyer@demo.com  / 123456');
}

seed().catch((e) => {
  console.error('✖ Lỗi khi seed:', e);
  process.exit(1);
});