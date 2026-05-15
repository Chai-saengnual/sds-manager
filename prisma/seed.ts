import { PrismaClient, UserRole, FlammableStatus, RecordStatus, FileType, AnalysisStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // CREATE USERS
  // ============================================
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sdsmanager.com' },
    update: {},
    create: {
      email: 'admin@sdsmanager.com',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });

  const editor = await prisma.user.upsert({
    where: { email: 'editor@sdsmanager.com' },
    update: {},
    create: {
      email: 'editor@sdsmanager.com',
      name: 'Editor User',
      password: hashedPassword,
      role: UserRole.EDITOR,
      emailVerified: new Date(),
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@sdsmanager.com' },
    update: {},
    create: {
      email: 'viewer@sdsmanager.com',
      name: 'Viewer User',
      password: hashedPassword,
      role: UserRole.VIEWER,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Users created');

  // ============================================
  // CREATE CATEGORIES
  // ============================================
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Cleaning Products' },
      update: {},
      create: {
        name: 'Cleaning Products',
        nameTh: 'ผลิตภัณฑ์ทำความสะอาด',
        description: 'Industrial cleaning agents and detergents',
        color: '#3b82f6',
        icon: 'spray-can',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Lubricants' },
      update: {},
      create: {
        name: 'Lubricants',
        nameTh: 'สารหล่อลื่น',
        description: 'Industrial lubricants and greases',
        color: '#f59e0b',
        icon: 'droplet',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Solvents' },
      update: {},
      create: {
        name: 'Solvents',
        nameTh: 'ตัวทำละลาย',
        description: 'Industrial solvents and thinners',
        color: '#ef4444',
        icon: 'flask-conical',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Adhesives' },
      update: {},
      create: {
        name: 'Adhesives',
        nameTh: 'กาวและสารยึดติด',
        description: 'Industrial adhesives and sealants',
        color: '#8b5cf6',
        icon: 'package',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Coatings' },
      update: {},
      create: {
        name: 'Coatings',
        nameTh: 'สารเคลือบ',
        description: 'Paints, coatings, and finishes',
        color: '#10b981',
        icon: 'paint-brush',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Maintenance Products' },
      update: {},
      create: {
        name: 'Maintenance Products',
        nameTh: 'ผลิตภัณฑ์บำรุงรักษา',
        description: 'General maintenance and repair products',
        color: '#6366f1',
        icon: 'wrench',
      },
    }),
  ]);

  console.log('✅ Categories created');

  // ============================================
  // CREATE SAMPLE SDS RECORDS
  // ============================================
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysLater = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysLater = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
  const twoYearsAgo = new Date(today.getTime() - 730 * 24 * 60 * 60 * 1000);

  const sdsRecords = [
    {
      partNumber: 'CLN-001',
      productNameEn: 'Industrial Degreaser Pro',
      productNameTh: 'น้ำยาทำความสะอาดอุตสาหกรรมพรี',
      categoryId: categories[0].id,
      hazardSummary: 'Causes skin irritation. May be harmful if swallowed. Avoid contact with eyes.',
      hazardClass: ['GHS05', 'GHS07'],
      flammableStatus: FlammableStatus.NON_FLAMMABLE,
      status: RecordStatus.ACTIVE,
      revisionDate: oneYearAgo,
      followUpDate: thirtyDaysAgo,
      supplier: 'ChemTech Industries',
      manufacturer: 'ChemTech Manufacturing Co.',
      tags: ['degreaser', 'heavy-duty', 'industrial'],
      notes: 'Review annually or when formula changes',
      isOutdated: true,
      isMissingPdf: false,
    },
    {
      partNumber: 'LUB-002',
      productNameEn: 'Multi-Purpose Grease EP-2',
      productNameTh: 'จารบีอเนกประสงค์ EP-2',
      categoryId: categories[1].id,
      hazardSummary: 'Not classified as hazardous according to GHS criteria.',
      hazardClass: [],
      flammableStatus: FlammableStatus.NON_FLAMMABLE,
      status: RecordStatus.ACTIVE,
      revisionDate: twoYearsAgo,
      followUpDate: sixtyDaysLater,
      supplier: 'LubeMax Corp',
      manufacturer: 'LubeMax International',
      tags: ['grease', 'ep-grade', 'multi-purpose'],
      notes: 'High-temperature applications',
      isOutdated: true,
      isMissingPdf: false,
    },
    {
      partNumber: 'SOL-003',
      productNameEn: 'Acetone Technical Grade',
      productNameTh: 'อะซิโตนเกรดเทคนิคัล',
      categoryId: categories[2].id,
      hazardSummary: 'Highly flammable liquid and vapor. Causes serious eye irritation. May cause drowsiness.',
      hazardClass: ['GHS02', 'GHS07'],
      flammableStatus: FlammableStatus.FLAMMABLE,
      status: RecordStatus.ACTIVE,
      revisionDate: sixtyDaysLater,
      followUpDate: ninetyDaysLater,
      supplier: 'Solvent Solutions',
      manufacturer: 'PureChem Ltd.',
      tags: ['solvent', 'flammable', 'technical-grade'],
      notes: 'Store in well-ventilated area away from heat sources',
      isOutdated: false,
      isMissingPdf: false,
    },
    {
      partNumber: 'ADH-004',
      productNameEn: 'Industrial Epoxy Adhesive',
      productNameTh: 'กาวอีพ็อกซี่อุตสาหกรรม',
      categoryId: categories[3].id,
      hazardSummary: 'Causes skin sensitization. May cause allergic skin reaction. Harmful to aquatic life.',
      hazardClass: ['GHS07', 'GHS09'],
      flammableStatus: FlammableStatus.NON_FLAMMABLE,
      status: RecordStatus.ACTIVE,
      revisionDate: oneYearAgo,
      followUpDate: thirtyDaysAgo,
      supplier: 'BondRight Industries',
      manufacturer: 'BondRight Manufacturing',
      tags: ['epoxy', 'two-component', 'strong-bond'],
      isOutdated: true,
      isMissingPdf: true,
    },
    {
      partNumber: 'COT-005',
      productNameEn: 'Industrial Enamel Paint - Safety Red',
      productNameTh: 'สีน้ำมันเคลือบเงานุ่งสีแดงความปลอดภัย',
      categoryId: categories[4].id,
      hazardSummary: 'Flammable liquid and vapor. May cause drowsiness. Toxic to aquatic organisms.',
      hazardClass: ['GHS02', 'GHS07', 'GHS09'],
      flammableStatus: FlammableStatus.FLAMMABLE,
      status: RecordStatus.ACTIVE,
      revisionDate: twoYearsAgo,
      followUpDate: thirtyDaysAgo,
      supplier: 'PaintPro Solutions',
      manufacturer: 'ColorCoat Industries',
      tags: ['paint', 'enamel', 'safety-color'],
      isOutdated: true,
      isMissingPdf: false,
    },
    {
      partNumber: 'MNT-006',
      productNameEn: 'Rust Converter Treatment',
      productNameTh: 'น้ำยาแปลงสนิม',
      categoryId: categories[5].id,
      hazardSummary: 'Causes severe skin burns and eye damage. May be corrosive to metals.',
      hazardClass: ['GHS05'],
      flammableStatus: FlammableStatus.NON_FLAMMABLE,
      status: RecordStatus.ACTIVE,
      revisionDate: sixtyDaysLater,
      followUpDate: ninetyDaysLater,
      supplier: 'RustFree Inc.',
      manufacturer: 'MetalPro Co.',
      tags: ['rust-treatment', 'corrosion', 'maintenance'],
      isOutdated: false,
      isMissingPdf: false,
    },
    {
      partNumber: 'CLN-007',
      productNameEn: 'Glass Surface Cleaner',
      productNameTh: 'น้ำยาทำความสะอาดผิวกระจก',
      categoryId: categories[0].id,
      hazardSummary: 'Causes serious eye irritation. Very toxic to aquatic life.',
      hazardClass: ['GHS07', 'GHS09'],
      flammableStatus: FlammableStatus.NON_FLAMMABLE,
      status: RecordStatus.ACTIVE,
      revisionDate: oneYearAgo,
      followUpDate: sixtyDaysLater,
      supplier: 'CleanPro Thailand',
      manufacturer: 'CleanPro Asia',
      tags: ['glass', 'cleaner', 'streak-free'],
      isOutdated: false,
      isMissingPdf: false,
    },
    {
      partNumber: 'LUB-008',
      productNameEn: 'Penetrating Oil Spray',
      productNameTh: 'น้ำมันซึมเข้าพวงมาลัย',
      categoryId: categories[1].id,
      hazardSummary: 'Extremely flammable aerosol. Pressurized container. May cause drowsiness.',
      hazardClass: ['GHS02', 'GHS07', 'GHS08'],
      flammableStatus: FlammableStatus.FLAMMABLE,
      status: RecordStatus.INACTIVE,
      revisionDate: twoYearsAgo,
      followUpDate: thirtyDaysAgo,
      supplier: 'LubeMax Corp',
      manufacturer: 'LubeMax International',
      tags: ['spray', 'penetrating', 'aerosol'],
      isOutdated: true,
      isMissingPdf: false,
    },
  ];

  for (const record of sdsRecords) {
    await prisma.sdsRecord.create({
      data: {
        ...record,
        createdById: admin.id,
        updatedById: admin.id,
      },
    });
  }

  console.log('✅ SDS Records created');

  // ============================================
  // CREATE SYSTEM SETTINGS
  // ============================================
  const settings = [
    { key: 'email_reminder_30_days', value: 'true', type: 'boolean', group: 'notifications' },
    { key: 'email_reminder_60_days', value: 'true', type: 'boolean', group: 'notifications' },
    { key: 'email_reminder_90_days', value: 'false', type: 'boolean', group: 'notifications' },
    { key: 'default_language', value: 'en', type: 'string', group: 'general' },
    { key: 'ai_auto_analyze', value: 'false', type: 'boolean', group: 'ai' },
    { key: 'ai_update_threshold_days', value: '30', type: 'number', group: 'ai' },
    { key: 'company_name', value: 'SDS Manager Demo', type: 'string', group: 'company' },
    { key: 'items_per_page', value: '20', type: 'number', group: 'general' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ System Settings created');

  // ============================================
  // CREATE SAMPLE AUDIT LOG
  // ============================================
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'CREATE',
      entityType: 'sds_record',
      description: 'Created new SDS record: Industrial Degreaser Pro',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    },
  });

  console.log('✅ Audit Log created');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('📧 Demo Accounts:');
  console.log('   Admin:  admin@sdsmanager.com / admin123');
  console.log('   Editor: editor@sdsmanager.com / admin123');
  console.log('   Viewer: viewer@sdsmanager.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });