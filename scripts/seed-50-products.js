/**
 * Script thêm 50 sản phẩm mẫu vào MiniShop.
 *
 * Cách dùng:
 *   npm run seed:50
 *
 * Phụ thuộc: FIREBASE_SERVICE_ACCOUNT_PATH trong .env (giống seed-firestore.js)
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
  console.error('✖ Không tìm thấy service account:', path.resolve(serviceAccountPath));
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

const img = (seed) => `https://picsum.photos/seed/${seed}/600/600`;

// ---------- 50 sản phẩm mẫu ----------
// Giá cố định (fixed)
const fixedProducts = [
  { name: 'Sách lập trình Python', category: 'sach', condition: 'new', description: 'Sách Python cơ bản đến nâng cao, bản mới 2024, chưa bóc seal.', price: 280000, seed: 'py-book' },
  { name: 'Atomat HTML5', category: 'sach', condition: 'used', description: 'Giáo trình thiết kế web HTML5, còn 85%, viết nhẹ đầu trang.', price: 120000, seed: 'html-book' },
  { name: 'Sách Kinh tế vi mô', category: 'sach', condition: 'used', description: 'Sách giáo trình Kinh tế vi mô đại học, không ghi chú.', price: 90000, seed: 'micro-eco' },
  { name: 'Tiểu thuyết Nhà giả kim', category: 'sach', condition: 'like-new', description: 'Nhà giả kim bản đẹp, đọc 1 lần, bìa còn mới.', price: 70000, seed: 'alchemist' },
  { name: 'Truyện tranh Conan tập 90', category: 'sach', condition: 'used', description: 'Truyện Conan tập 90, giấy còn tốt.', price: 25000, seed: 'conan90' },
  { name: 'Sách IELTS Speaking', category: 'sach', condition: 'like-new', description: 'Sách luyện IELTS Speaking + CD, ghi chú bằng bút chì.', price: 110000, seed: 'ielts-book' },
  { name: 'Sách Cấu trúc dữ liệu', category: 'sach', condition: 'used', description: 'Giáo trình CTDL&GT, dùng kỳ 2, còn khá mới.', price: 135000, seed: 'dsa-book' },
  { name: 'Sách Luật giao thông', category: 'sach', condition: 'new', description: 'Sách luật giao thông mới nhất, dành ôn thi bằng lái.', price: 65000, seed: 'traffic-law' },
  { name: 'Tai nghe có dây Sony', category: 'phu-kien', condition: 'used', description: 'Tai nghe có dây Sony MDR, âm chuẩn, jack 3.5mm.', price: 180000, seed: 'sony-ear' },
  { name: 'Ốp lưng iPhone 13', category: 'phu-kien', condition: 'new', description: 'Ốp lưng trong suốt chống sốc iPhone 13, mới 100%.', price: 80000, seed: 'case13' },
  { name: 'Cáp type C nhanh', category: 'phu-kien', condition: 'new', description: 'Cáp Type-C 3A dài 2m, hỗ trợ sạc nhanh.', price: 50000, seed: 'usbc-cable' },
  { name: 'Đế tản nhiệt laptop', category: 'phu-kien', condition: 'like-new', description: 'Đế tản nhiệt 2 quạt, dùng 3 tháng, đèn LED.', price: 220000, seed: 'coolpad' },
  { name: 'Chuột gaming Logitech', category: 'phu-kien', condition: 'used', description: 'Chuột G102 đã dùng 1 năm, còn tốt, không cháy LED.', price: 250000, seed: 'g102' },
  { name: 'Kẹp tóc xinh xắn', category: 'phu-kien', condition: 'new', description: 'Bộ kẹp tóc nhiều màu, mới, tặng kèm nơ.', price: 30000, seed: 'hairclip' },
  { name: 'Balo học sinh', category: 'phu-kien', condition: 'used', description: 'Balo 2 ngăn học sinh, còn 80%, khóa kéo tốt.', price: 150000, seed: 'school-bag' },
  { name: 'Áo khoác jean nam', category: 'quan-ao', condition: 'used', description: 'Áo khoác jean size L, màu đen, còn đẹp.', price: 200000, seed: 'jean-jacket' },
  { name: 'Áo thun trắng size M', category: 'quan-ao', condition: 'new', description: 'Áo thun trắng cotton, chưa giặt lần nào, size M.', price: 90000, seed: 'white-tee' },
  { name: 'Quần jean nam ống suông', category: 'quan-ao', condition: 'like-new', description: 'Quần jean nam mặc 2 lần, size 30, form chuẩn.', price: 250000, seed: 'jean-pants' },
  { name: 'Váy công sở nữ', category: 'quan-ao', condition: 'used', description: 'Váy công sở nữ size M, màu đen, còn mới 90%.', price: 180000, seed: 'office-dress' },
  { name: 'Áo sơ mi sọc tay dài', category: 'quan-ao', condition: 'like-new', description: 'Áo sơ mi sọc nam size L, màu trắng xanh.', price: 130000, seed: 'shirt-stripe' },
  { name: 'Giày sneaker trắng', category: 'giay-dep', condition: 'like-new', description: 'Giày sneaker trắng size 42, đi 3 lần, sạch.', price: 320000, seed: 'white-sneaker' },
  { name: 'Dép quai ngang nam', category: 'giay-dep', condition: 'new', description: 'Dép quai ngang size 41, còn nguyên hộp.', price: 95000, seed: 'flipflop' },
  { name: 'Giày da công sở', category: 'giay-dep', condition: 'used', description: 'Giày da nam size 41, đã đi 6 tháng, vẫn sáng bóng.', price: 350000, seed: 'leather-shoes' },
  { name: 'iPhone 11 cũ', category: 'dien-thoai', condition: 'used', description: 'iPhone 11 64GB, pin 85%, không lỗi, kèm ốp.', price: 5200000, seed: 'iphone11' },
  { name: 'Samsung Galaxy A32', category: 'dien-thoai', condition: 'used', description: 'Samsung A32 128GB, dùng 1 năm, pin tốt.', price: 2800000, seed: 'a32' },
  { name: 'Xiaomi Redmi Note 12', category: 'dien-thoai', condition: 'like-new', description: 'Redmi Note 12 128GB, máy như mới, kèm củ cáp.', price: 3500000, seed: 'redmi12' },
  { name: 'Máy tính Casio fx-580', category: 'dien-tu', condition: 'new', description: 'Casio fx-580VN X mới 100%, chống nước.', price: 300000, seed: 'casio580' },
  { name: 'Loa bluetooth mini', category: 'dien-tu', condition: 'used', description: 'Loa bluetooth mini công suất 5W, pin 6h.', price: 180000, seed: 'mini-speaker' },
  { name: 'Bàn phím cơ AKKO', category: 'dien-tu', condition: 'like-new', description: 'Bàn phím cơ AKKO 87 phím switch red, RGB.', price: 700000, seed: 'akko-kb' },
  { name: 'Router wifi TP-Link', category: 'dien-tu', condition: 'used', description: 'Router wifi TP-Link 300Mbps, hoạt động ổn định.', price: 150000, seed: 'router' },
  { name: 'Tivi cũ 43 inch', category: 'dien-tu', condition: 'used', description: 'Tivi LED 43 inch màn hình sạch, đầy đủ điều khiển.', price: 2500000, seed: 'tv43' },
  { name: 'Laptop HP văn phòng', category: 'laptop', condition: 'used', description: 'HP 250 i5/8GB/256GB SSD, pin ~3h, màn hình FullHD.', price: 4500000, seed: 'hp-laptop' },
  { name: 'MacBook Air M1', category: 'laptop', condition: 'like-new', description: 'MacBook Air M1 8GB/256GB, pin 90%, đẹp 99%.', price: 12500000, seed: 'mba-m1' },
  { name: 'Bàn gấp gọn đa năng', category: 'khac', condition: 'new', description: 'Bàn gấp gọn học tập, mặt rộng 60x40cm.', price: 350000, seed: 'fold-table' },
  { name: 'Đèn bàn LED', category: 'khac', condition: 'like-new', description: 'Đèn bàn LED 3 chế độ sáng, sạc pin.', price: 190000, seed: 'lamp' },
];

// Đấu giá đang diễn ra (auction_active)
const activeAuctions = [
  { name: 'Laptop Dell Latitude i5', category: 'laptop', condition: 'used', description: 'Dell Latitude i5/8GB/256GB SSD, pin chai nhẹ.', startingPrice: 3800000, bidIncrement: 100000, endIn: DAY, seed: 'dell-lat' },
  { name: 'Tai nghe AirPods Pro', category: 'phu-kien', condition: 'used', description: 'AirPods Pro 1, thay pin mới, hộp sạc OK.', startingPrice: 1200000, bidIncrement: 50000, endIn: 5 * HOUR, seed: 'airpods' },
  { name: 'Camera Canon M50', category: 'dien-tu', condition: 'used', description: 'Canon M50 body, màn hình sạch, kèm pin.', startingPrice: 6000000, bidIncrement: 200000, endIn: 2 * DAY, seed: 'canon-m50' },
  { name: 'Đồng hồ G-Shock', category: 'phu-kien', condition: 'like-new', description: 'G-Shock GA-100, dây còn mới, nguyên hộp.', startingPrice: 900000, bidIncrement: 50000, endIn: 8 * HOUR, seed: 'gshock' },
  { name: 'iPhone XR 64GB', category: 'dien-thoai', condition: 'used', description: 'iPhone XR 64GB, pin 88%, màn hình nguyên bản.', startingPrice: 3200000, bidIncrement: 100000, endIn: 12 * HOUR, seed: 'xr' },
  { name: 'Máy khoan Bosch', category: 'khac', condition: 'used', description: 'Máy khoan Bosch 550W, phụ kiện đầy đủ.', startingPrice: 700000, bidIncrement: 50000, endIn: 3 * DAY, seed: 'bosch-drill' },
  { name: 'Bộ ấm trà gốm', category: 'khac', condition: 'new', description: 'Bộ ấm trà gốm Bát Tràng, mới, đủ 6 chén.', startingPrice: 400000, bidIncrement: 20000, endIn: DAY, seed: 'teaset' },
  { name: 'Áo dài nữ thổ cẩm', category: 'quan-ao', condition: 'new', description: 'Áo dài thổ cẩm size 38-40, mới, tặng kèm khăn.', startingPrice: 850000, bidIncrement: 30000, endIn: DAY, seed: 'aodai' },
  { name: 'Giày Jordan 4', category: 'giay-dep', condition: 'used', description: 'Jordan 4 size 43, chính hãng, form 9/10.', startingPrice: 3200000, bidIncrement: 100000, endIn: 6 * HOUR, seed: 'jordan4' },
  { name: 'Sách bộ 5 Nobel văn học', category: 'sach', condition: 'used', description: 'Bộ 5 cuốn văn học Nobel, bản đẹp, còn 90%.', startingPrice: 300000, bidIncrement: 20000, endIn: 2 * DAY, seed: 'nobel-set' },
];

// Đấu giá đã kết thúc (auction_ended)
const endedAuctions = [
  { name: 'Robot hút bụi Xiaomi', category: 'dien-tu', condition: 'used', description: 'Robot hút bụi Xiaomi, đã kết thúc, winner đã chốt.', finalPrice: 1800000, seed: 'x-robo' },
  { name: 'Bàn phím Keychron K6', category: 'phu-kien', condition: 'like-new', description: 'Keychron K6 bluetooth, đã kết thúc đấu giá.', finalPrice: 950000, seed: 'keychron' },
  { name: 'Điện thoại Nokia 1280', category: 'dien-thoai', condition: 'used', description: 'Nokia 1280 huyền thoại, đã kết thúc đấu giá.', finalPrice: 200000, seed: 'nokia' },
  { name: 'Máy in HP P1102', category: 'khac', condition: 'used', description: 'Máy in HP LaserJet P1102, đã kết thúc, còn mực.', finalPrice: 900000, seed: 'printer' },
];

console.log('== Thêm 50 sản phẩm mẫu vào MiniShop ==\n');

async function seed() {
  // Lấy UID seller demo
  let sellerId;
  try {
    const u = await auth.getUserByEmail('seller@demo.com');
    sellerId = u.uid;
  } catch {
    console.error('✖ Chưa có tài khoản seller@demo.com. Hãy chạy `npm run seed` trước.');
    process.exit(1);
  }

  let total = 0;

  console.log('-- Sản phẩm giá cố định --');
  for (const p of fixedProducts) {
    await db.collection('products').add({
      sellerId,
      name: p.name,
      description: p.description,
      category: p.category,
      images: [img(p.seed)],
      condition: p.condition,
      saleType: 'fixed',
      price: p.price,
      status: 'active',
      createdAt: NOW - 2 * DAY,
    });
    total++;
    console.log(`  ✓ [fixed] ${p.name}`);
  }

  console.log('\n-- Đấu giá đang diễn ra --');
  for (const p of activeAuctions) {
    await db.collection('products').add({
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
    total++;
    console.log(`  ✓ [auction] ${p.name}`);
  }

  console.log('\n-- Đấu giá đã kết thúc --');
  for (const p of endedAuctions) {
    await db.collection('products').add({
      sellerId,
      name: p.name,
      description: p.description,
      category: p.category,
      images: [img(p.seed)],
      condition: p.condition,
      saleType: 'auction',
      startingPrice: Math.round(p.finalPrice * 0.7),
      currentPrice: p.finalPrice,
      bidIncrement: 50000,
      startTime: NOW - 2 * DAY,
      endTime: NOW - 6 * HOUR,
      bidsCount: 2,
      winnerId: sellerId,
      status: 'auction_ended',
      createdAt: NOW - 2 * DAY,
    });
    total++;
    console.log(`  ✓ [ended] ${p.name}`);
  }

  console.log(`\n== Hoàn tất: đã thêm ${total} sản phẩm ==`);
}

seed().catch((e) => {
  console.error('✖ Lỗi khi seed:', e);
  process.exit(1);
});