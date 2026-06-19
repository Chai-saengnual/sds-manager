import { PrismaClient, UserRole, FlammableStatus, RecordStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaClient as DirectPrismaClient } from '@prisma/client';

const prisma = new DirectPrismaClient();

function parseMDY(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, mo, d, y] = m;
  return new Date(parseInt(y), parseInt(mo) - 1, parseInt(d));
}

interface SeedRecord {
  id: number;
  title: string;
  thName: string;
  pn: string;
  flammable: 'flammable' | 'nonflammable' | '';
  status: 'active' | 'inactive';
  revDate: string;
  followUp: string;
  subject: string;
  needPrint: boolean;
  halEN: boolean;
  halTH: boolean;
  hazard: string;
  enLabel: string;
  enUrl: string;
  thLabel: string;
  thUrl: string;
  productInfo: string;
}

const BUILTIN: SeedRecord[] = [
  {id:1, title:"1605 DUOLEC® Vari-Purpose Gear Lubricant", thName:"น้ำมันหล่อลื่นเกียร์ DUOLEC® 1605", pn:"100006759", flammable:"nonflammable", status:"active", revDate:"4/18/2025", followUp:"4/17/2030", subject:"Lubricant", needPrint:true, halEN:true, halTH:true, hazard:"Refer to Lubrication Engineers SDS page.", enLabel:"SDS - 1605 DUOLEC Gear Lubricant", enUrl:"https://products.lelubricants.com/item/industrial/duolec-industrial-gear-oil-1601-1610-1302-1304/1605-dr", thLabel:"SDS - น้ำมันเกียร์ DUOLEC 1605", thUrl:"", productInfo:"https://www.lelubricants.com"},
  {id:2, title:"Aerosol All-Purpose Spray Paint", thName:"สเปรย์สีอเนกประสงค์แบบละออง", pn:"", flammable:"flammable", status:"active", revDate:"10/16/2019", followUp:"10/15/2024", subject:"Aerosol", needPrint:false, halEN:false, halTH:false, hazard:"Extremely flammable aerosol, suspected carcinogen, harmful to aquatic life.", enLabel:"SDS - Aerosol Spray Paint", enUrl:"https://www.hpadhesives.com/wp-content/uploads/2024/01/SPRAY-PAINT_SDS.pdf", thLabel:"SDS - สเปรย์สีอเนกประสงค์", thUrl:"", productInfo:"https://www.toagroup.com"},
  {id:3, title:"Breakthrough", thName:"เบรคธรู", pn:"101977394", flammable:"flammable", status:"active", revDate:"6/11/2020", followUp:"6/10/2025", subject:"Solvent", needPrint:true, halEN:true, halTH:false, hazard:"Combustible liquid, aspiration hazard.", enLabel:"SDS - Breakthrough", enUrl:"https://cdn11.bigcommerce.com/s-jifykode7m/product_images/uploaded_images/msds/SGP101402.pdf", thLabel:"SDS - เบรคธรู", thUrl:"", productInfo:"https://www.inlandtech.com"},
  {id:4, title:"CRC CO Contact Cleaner", thName:"น้ำยาทำความสะอาดหน้าสัมผัส CRC CO", pn:"98819", flammable:"flammable", status:"active", revDate:"6/13/2021", followUp:"6/12/2026", subject:"Cleaner", needPrint:true, halEN:false, halTH:false, hazard:"Pressurized container, skin and eye irritation, respiratory irritation.", enLabel:"SDS - CRC CO Contact Cleaner", enUrl:"https://www.crcindustries.ca/media/msdsen/crc_ca/msds_en-1006114.pdf", thLabel:"SDS - น้ำยาทำความสะอาด CRC CO", thUrl:"", productInfo:"https://www.crcindustries.com"},
  {id:5, title:"Hexane", thName:"เฮกเซน", pn:"", flammable:"flammable", status:"active", revDate:"12/24/2021", followUp:"12/23/2026", subject:"Solvent", needPrint:true, halEN:false, halTH:false, hazard:"Highly flammable, aspiration hazard, suspected reproductive toxicity, CNS effects.", enLabel:"SDS - Hexane", enUrl:"https://www.modernchemical.co.th/products/pdf/msds-en/Hydrocarbons/SDS_Hexane_MCC_En.pdf", thLabel:"SDS - เฮกเซน", thUrl:"https://www.rcilabscan.com/wp-content/uploads/2019/11/n-Hexane-95-T-010421.pdf", productInfo:"https://www.modernchemical.co.th"},
  {id:6, title:"Isopropyl Alcohol 99.9%", thName:"ไอโซโพรพิลแอลกอฮอล์ 99.9%", pn:"", flammable:"flammable", status:"active", revDate:"", followUp:"", subject:"Solvent", needPrint:false, halEN:false, halTH:false, hazard:"Highly flammable, eye and skin irritant, CNS depressant at high concentrations.", enLabel:"SDS - Isopropyl Alcohol 99.9%", enUrl:"#", thLabel:"SDS - ไอโซโพรพิลแอลกอฮอล์ 99.9%", thUrl:"", productInfo:""},
  {id:7, title:"LOCTITE 243", thName:"กาวล็อคไทท์ 243", pn:"", flammable:"flammable", status:"active", revDate:"6/10/2022", followUp:"6/9/2027", subject:"Adhesive", needPrint:false, halEN:false, halTH:false, hazard:"Skin sensitizer, eye irritation, harmful to aquatic life.", enLabel:"SDS - LOCTITE 243", enUrl:"https://siameastsolutions.com/datasheet/loctite/SDS/Loctite-243-SDS-250ML-2024.PDF", thLabel:"SDS - กาวล็อคไทท์ 243", thUrl:"", productInfo:"https://www.henkel.com"},
  {id:8, title:"LOCTITE LB8008 Anti-Seize", thName:"สารป้องกันการติดล็อคไทท์ LB8008", pn:"", flammable:"nonflammable", status:"active", revDate:"12/19/2022", followUp:"12/18/2027", subject:"Lubricant", needPrint:true, halEN:false, halTH:false, hazard:"Skin irritation, serious eye damage, chronic aquatic toxicity.", enLabel:"SDS - LOCTITE LB8008 Anti-Seize", enUrl:"https://www1.mscdirect.com/MSDS/MSDS00020/00129189-20250803.PDF", thLabel:"SDS - สารป้องกัน LB8008", thUrl:"", productInfo:"https://www.henkel.com"},
  {id:9, title:"Mobil Rarus SHC 1024", thName:"น้ำมันคอมเพรสเซอร์ โมบิล Rarus SHC 1024", pn:"120157690", flammable:"nonflammable", status:"active", revDate:"1/30/2021", followUp:"1/29/2026", subject:"Oil", needPrint:false, halEN:false, halTH:false, hazard:"Not classified as hazardous; high-pressure injection risk.", enLabel:"SDS - Mobil Rarus SHC 1024", enUrl:"https://avepetroleum.com/uploads/msds_docs/MOBIL-RARUS-SHC-1024-MSDS.pdf", thLabel:"SDS - โมบิล Rarus SHC 1024", thUrl:"", productInfo:"https://www.esso.co.th"},
  {id:10, title:"Mobil Vacuum Pump Oil", thName:"น้ำมันปั๊มสุญญากาศ โมบิล", pn:"120161899", flammable:"nonflammable", status:"active", revDate:"5/20/2020", followUp:"5/19/2025", subject:"Oil", needPrint:false, halEN:false, halTH:false, hazard:"Not classified as hazardous; avoid high-pressure injection injuries.", enLabel:"SDS - Mobil Vacuum Pump Oil", enUrl:"https://www1.mscdirect.com/MSDS/MSDS00009/60002573-20230909.PDF", thLabel:"SDS - น้ำมันปั๊มสุญญากาศโมบิล", thUrl:"", productInfo:"https://www.exxonmobil.com"},
  {id:11, title:"Molykote 111 Compound", thName:"โมลิโค้ท 111 คอมพาวด์", pn:"100000511", flammable:"nonflammable", status:"active", revDate:"7/13/2020", followUp:"7/12/2025", subject:"Lubricant", needPrint:true, halEN:false, halTH:false, hazard:"Not classified as hazardous; silicone-based compound.", enLabel:"SDS - Molykote 111 Compound", enUrl:"https://www.dupont.com/content/dam/dupont/amer/us/en/Molykote/public/sds/en/molykote-111-compound-US-SDS-000000853096.pdf", thLabel:"SDS - โมลิโค้ท 111", thUrl:"", productInfo:"https://www.dupont.com"},
  {id:12, title:"Peanut Oil (HWST Transducer)", thName:"น้ำมันถั่วลิสง (สำหรับ HWST Transducer)", pn:"", flammable:"nonflammable", status:"active", revDate:"1/21/2021", followUp:"1/20/2026", subject:"Oil", needPrint:false, halEN:false, halTH:false, hazard:"Food-grade oil; low hazard. Mild skin/eye irritation possible.", enLabel:"SDS - Peanut Oil", enUrl:"#", thLabel:"SDS - น้ำมันถั่วลิสง", thUrl:"", productInfo:""},
  {id:13, title:"PMX-200 Silicone Fluid 100 cst", thName:"ของเหลวซิลิโคน PMX-200 ความหนืด 100 cst", pn:"100009715", flammable:"nonflammable", status:"active", revDate:"7/26/2022", followUp:"7/25/2027", subject:"Silicone", needPrint:true, halEN:false, halTH:false, hazard:"Low hazard; silicone fluid, mild skin/eye irritant.", enLabel:"SDS - PMX-200 Silicone Fluid 100 cst", enUrl:"#", thLabel:"SDS - ของเหลวซิลิโคน PMX-200 100 cst", thUrl:"", productInfo:"https://www.dow.com"},
  {id:14, title:"PMX-200 Silicone Fluid 500 cst", thName:"ของเหลวซิลิโคน PMX-200 ความหนืด 500 cst", pn:"", flammable:"nonflammable", status:"active", revDate:"5/31/2019", followUp:"5/30/2024", subject:"Silicone", needPrint:true, halEN:false, halTH:false, hazard:"Low hazard; silicone fluid, mild skin/eye irritant.", enLabel:"SDS - PMX-200 Silicone Fluid 500 cst", enUrl:"#", thLabel:"SDS - ของเหลวซิลิโคน PMX-200 500 cst", thUrl:"", productInfo:"https://www.dow.com"},
  {id:15, title:"Polydimethylsiloxane", thName:"โพลีไดเมทิลซิลอกเซน", pn:"100000816", flammable:"nonflammable", status:"active", revDate:"1/9/2017", followUp:"1/8/2022", subject:"Silicone", needPrint:false, halEN:false, halTH:false, hazard:"Low hazard; silicone polymer, mild irritant.", enLabel:"SDS - Polydimethylsiloxane", enUrl:"#", thLabel:"SDS - โพลีไดเมทิลซิลอกเซน", thUrl:"", productInfo:"https://www.dow.com"},
  {id:16, title:"Pyroshield Aerosol (LEs100)", thName:"สเปรย์ไพโรชิลด์ LEs100", pn:"100006759", flammable:"flammable", status:"active", revDate:"11/1/2019", followUp:"10/31/2024", subject:"Aerosol", needPrint:false, halEN:false, halTH:false, hazard:"Flammable aerosol; lubricant spray. Eye and skin irritant.", enLabel:"SDS - Pyroshield Aerosol LEs100", enUrl:"#", thLabel:"SDS - สเปรย์ไพโรชิลด์ LEs100", thUrl:"", productInfo:"https://www.lelubricants.com"},
  {id:17, title:"Reseal 104 HP Valve Lubricant/Sealant", thName:"น้ำมันหล่อลื่น/ซีลวาล์ว Reseal 104 HP", pn:"120138923", flammable:"nonflammable", status:"active", revDate:"1/1/2017", followUp:"12/31/2021", subject:"Lubricant", needPrint:false, halEN:false, halTH:false, hazard:"Lubricant/sealant; low hazard under normal use.", enLabel:"SDS - Reseal 104 HP", enUrl:"#", thLabel:"SDS - น้ำมันหล่อลื่น Reseal 104 HP", thUrl:"", productInfo:""},
  {id:18, title:"RTV-3145 Clear – Dow Corning", thName:"ซิลิโคนใส RTV-3145 ของ Dow Corning", pn:"100000153", flammable:"nonflammable", status:"active", revDate:"9/4/2020", followUp:"9/3/2025", subject:"Silicone", needPrint:false, halEN:false, halTH:false, hazard:"Silicone sealant; skin and eye irritant, may cause sensitization.", enLabel:"SDS - RTV-3145 Clear", enUrl:"#", thLabel:"SDS - ซิลิโคนใส RTV-3145", thUrl:"", productInfo:"https://www.dow.com"},
  {id:19, title:"SKC-S Aerosol Magnaflux", thName:"สเปรย์ตรวจสอบรอยร้าว SKC-S Magnaflux", pn:"101355694", flammable:"flammable", status:"active", revDate:"6/22/2021", followUp:"6/21/2026", subject:"Aerosol", needPrint:false, halEN:false, halTH:false, hazard:"Flammable aerosol; NDT cleaner/remover. Skin and eye irritant.", enLabel:"SDS - SKC-S Aerosol Magnaflux", enUrl:"#", thLabel:"SDS - สเปรย์ SKC-S Magnaflux", thUrl:"", productInfo:"https://www.magnaflux.com"},
  {id:20, title:"SKD-S2 Aerosol Magnaflux", thName:"สเปรย์ตรวจสอบรอยร้าว SKD-S2 Magnaflux", pn:"101355695", flammable:"flammable", status:"active", revDate:"2/23/2021", followUp:"2/22/2026", subject:"Aerosol", needPrint:false, halEN:false, halTH:false, hazard:"Flammable aerosol; NDT developer. Skin and eye irritant.", enLabel:"SDS - SKD-S2 Aerosol Magnaflux", enUrl:"#", thLabel:"SDS - สเปรย์ SKD-S2 Magnaflux", thUrl:"", productInfo:"https://www.magnaflux.com"},
  {id:21, title:"SKL-SP2 Aerosol Magnaflux", thName:"สเปรย์ตรวจสอบรอยร้าว SKL-SP2 Magnaflux", pn:"101355696", flammable:"flammable", status:"active", revDate:"6/24/2021", followUp:"6/23/2026", subject:"Aerosol", needPrint:false, halEN:false, halTH:false, hazard:"Flammable aerosol; NDT penetrant. Skin sensitizer, eye irritant.", enLabel:"SDS - SKL-SP2 Aerosol Magnaflux", enUrl:"#", thLabel:"SDS - สเปรย์ SKL-SP2 Magnaflux", thUrl:"", productInfo:"https://www.magnaflux.com"},
  {id:22, title:"Smoke Test – 2.5 Oz", thName:"สเปรย์ทดสอบควัน 2.5 ออนซ์", pn:"", flammable:"flammable", status:"active", revDate:"6/18/2022", followUp:"6/17/2027", subject:"Aerosol", needPrint:false, halEN:false, halTH:false, hazard:"Pressurized aerosol; may contain irritant smoke-generating compounds.", enLabel:"SDS - Smoke Test 2.5 Oz", enUrl:"#", thLabel:"SDS - สเปรย์ทดสอบควัน 2.5 ออนซ์", thUrl:"", productInfo:""},
  {id:23, title:"Solder wires: 60EN 105 Henkel (Low Temp)", thName:"ลวดบัดกรี 60EN 105 5C Henkel (อุณหภูมิต่ำ)", pn:"", flammable:"", status:"active", revDate:"9/20/2017", followUp:"9/19/2022", subject:"Solder", needPrint:false, halEN:false, halTH:false, hazard:"Solder fumes may irritate respiratory tract; flux residue may cause skin sensitization.", enLabel:"SDS - Solder 60EN 105 Henkel", enUrl:"#", thLabel:"SDS - ลวดบัดกรี 60EN 105 Henkel", thUrl:"", productInfo:"https://www.henkel.com"},
  {id:24, title:"Solder wires: 60EN CRYSTAL 400 Henkel (Low Temp)", thName:"ลวดบัดกรี 60EN CRYSTAL 400 5C Henkel (อุณหภูมิต่ำ)", pn:"", flammable:"", status:"active", revDate:"4/6/2022", followUp:"4/5/2027", subject:"Solder", needPrint:false, halEN:false, halTH:false, hazard:"Solder fumes may irritate respiratory tract; flux residue may cause skin sensitization.", enLabel:"SDS - Solder 60EN CRYSTAL 400 Henkel", enUrl:"#", thLabel:"SDS - ลวดบัดกรี 60EN CRYSTAL 400 Henkel", thUrl:"", productInfo:"https://www.henkel.com"},
  {id:25, title:"Solder wires: Flux-Core Wire", thName:"ลวดบัดกรีชนิดมีฟลักซ์ในแกน", pn:"", flammable:"", status:"active", revDate:"5/17/2021", followUp:"5/16/2026", subject:"Solder", needPrint:false, halEN:false, halTH:false, hazard:"Solder fumes may irritate respiratory tract; rosin flux may cause sensitization.", enLabel:"SDS - Solder Flux-Core Wire", enUrl:"#", thLabel:"SDS - ลวดบัดกรีชนิดมีฟลักซ์ในแกน", thUrl:"", productInfo:""},
  {id:26, title:"Solder wires: Loctite 366 HMP 5C 0.71mm", thName:"ลวดบัดกรี Loctite 366 HMP 5C 0.71 มม.", pn:"", flammable:"", status:"active", revDate:"4/24/2019", followUp:"4/23/2024", subject:"Solder", needPrint:false, halEN:false, halTH:false, hazard:"Solder fumes; flux residue irritant. Lead-free formulation.", enLabel:"SDS - Solder Loctite 366 HMP", enUrl:"#", thLabel:"SDS - ลวดบัดกรี Loctite 366 HMP", thUrl:"", productInfo:"https://www.henkel.com"},
  {id:27, title:"Solder wires: Multicomp (Sondex)", thName:"ลวดบัดกรี Multicomp (Sondex)", pn:"", flammable:"", status:"active", revDate:"8/25/2021", followUp:"8/24/2026", subject:"Solder", needPrint:false, halEN:false, halTH:false, hazard:"Low hazard under normal use; fumes may irritate respiratory tract.", enLabel:"SDS - Solder Multicomp (Sondex)", enUrl:"#", thLabel:"SDS - ลวดบัดกรี Multicomp (Sondex)", thUrl:"", productInfo:""},
  {id:28, title:"Solder wires: RS-60/40 Water Soluble", thName:"ลวดบัดกรี RS-60/40 แบบละลายน้ำได้", pn:"", flammable:"", status:"active", revDate:"", followUp:"", subject:"Solder", needPrint:false, halEN:false, halTH:false, hazard:"Contains lead; toxic if ingested. Fumes irritate respiratory tract.", enLabel:"SDS - Solder RS-60/40", enUrl:"#", thLabel:"SDS - ลวดบัดกรี RS-60/40", thUrl:"", productInfo:""},
  {id:29, title:"Solder wires: SN100C Lead-Free Solder Bar", thName:"ลวดบัดกรี SN100C ปลอดตะกั่ว", pn:"", flammable:"", status:"active", revDate:"", followUp:"", subject:"Solder", needPrint:false, halEN:false, halTH:false, hazard:"Lead-free; low hazard. Fumes may irritate at elevated temperatures.", enLabel:"SDS - Solder SN100C Lead-Free", enUrl:"#", thLabel:"SDS - ลวดบัดกรี SN100C ปลอดตะกั่ว", thUrl:"", productInfo:""},
  {id:30, title:"Solder wires: Weller SAC LO 0.5mm 500g", thName:"ลวดบัดกรี Weller SAC LO 0.5 มม. 500 กรัม", pn:"", flammable:"", status:"active", revDate:"6/22/2022", followUp:"6/21/2027", subject:"Solder", needPrint:false, halEN:false, halTH:false, hazard:"Lead-free solder; fumes may irritate respiratory tract.", enLabel:"SDS - Solder Weller SAC LO", enUrl:"#", thLabel:"SDS - ลวดบัดกรี Weller SAC LO", thUrl:"", productInfo:"https://www.weller-tools.com"},
  {id:31, title:"SP 400 Aerosol", thName:"สเปรย์ SP 400", pn:"100037811", flammable:"flammable", status:"active", revDate:"5/23/2022", followUp:"5/22/2027", subject:"Aerosol", needPrint:false, halEN:false, halTH:false, hazard:"Flammable aerosol; skin and eye irritant.", enLabel:"SDS - SP 400 Aerosol", enUrl:"#", thLabel:"SDS - สเปรย์ SP 400", thUrl:"", productInfo:""},
  {id:32, title:"STP Oil Treatment 24/450 ml", thName:"น้ำยาปรับปรุงคุณภาพน้ำมัน STP 24/450 มล.", pn:"", flammable:"nonflammable", status:"active", revDate:"11/18/2020", followUp:"11/17/2025", subject:"Oil", needPrint:false, halEN:false, halTH:false, hazard:"Low hazard; petroleum-based oil treatment. Mild skin irritant.", enLabel:"SDS - STP Oil Treatment", enUrl:"#", thLabel:"SDS - น้ำยา STP Oil Treatment", thUrl:"", productInfo:"https://www.stp.com"},
  {id:33, title:"SYLGARD™ 184 Silicone Elastomer Base", thName:"ซิลิโคนอีลาสโตเมอร์ SYLGARD™ 184", pn:"", flammable:"nonflammable", status:"active", revDate:"", followUp:"", subject:"Silicone", needPrint:false, halEN:false, halTH:false, hazard:"Silicone elastomer; low hazard. Curing agent may cause sensitization.", enLabel:"SDS - SYLGARD 184 Base", enUrl:"#", thLabel:"SDS - SYLGARD 184 ซิลิโคน", thUrl:"", productInfo:""},
  {id:34, title:"Thermal Cote I", thName:"เทอร์มอลโค้ท I", pn:"100124429", flammable:"nonflammable", status:"active", revDate:"7/30/2019", followUp:"7/29/2024", subject:"Other", needPrint:true, halEN:false, halTH:false, hazard:"Thermal compound; low hazard. Mild skin and eye irritant.", enLabel:"SDS - Thermal Cote I", enUrl:"#", thLabel:"SDS - เทอร์มอลโค้ท I", thUrl:"", productInfo:""},
  {id:35, title:"Toluene", thName:"โทลูอีน", pn:"", flammable:"flammable", status:"active", revDate:"4/1/2020", followUp:"3/31/2025", subject:"Solvent", needPrint:true, halEN:false, halTH:false, hazard:"Highly flammable, reproductive toxicity, CNS depressant, aspiration hazard.", enLabel:"SDS - Toluene", enUrl:"#", thLabel:"SDS - โทลูอีน", thUrl:"", productInfo:"https://www.sigmaaldrich.com"},
  {id:36, title:"Triethylene Glycol", thName:"ไตรเอทิลีนไกลคอล", pn:"", flammable:"nonflammable", status:"active", revDate:"7/1/2022", followUp:"6/30/2027", subject:"Solvent", needPrint:true, halEN:false, halTH:false, hazard:"Generally not classified as hazardous; may cause mild irritation.", enLabel:"SDS - Triethylene Glycol", enUrl:"https://www.sigmaaldrich.com/GB/en/sds/sial/t59455", thLabel:"SDS - ไตรเอทิลีนไกลคอล", thUrl:"https://productsandsolutions.pttgcgroup.com/customer-support/files/TRIETHYLENE-GLYCOL-SAFETY-DATA-SHEET-20221027145001.pdf", productInfo:"https://www.sigmaaldrich.com"},
  {id:37, title:"Turbo Oil 2380 – Eastman", thName:"น้ำมันเทอร์โบ 2380 ของ Eastman", pn:"100121475", flammable:"nonflammable", status:"active", revDate:"4/7/2025", followUp:"4/6/2030", subject:"Oil", needPrint:true, halEN:true, halTH:true, hazard:"Aviation turbine oil; refer to Eastman SDS. Skin and eye irritant.", enLabel:"SDS - Turbo Oil 2380 Eastman", enUrl:"#", thLabel:"SDS - น้ำมันเทอร์โบ 2380 Eastman", thUrl:"", productInfo:"https://www.eastman.com"},
  {id:38, title:"Univis Oil HVI DH", thName:"น้ำมัน Univis HVI DH", pn:"100010553", flammable:"nonflammable", status:"active", revDate:"3/17/2015", followUp:"3/16/2020", subject:"Oil", needPrint:false, halEN:false, halTH:false, hazard:"Hydraulic oil; low hazard. Prolonged skin contact may cause dermatitis.", enLabel:"SDS - Univis Oil HVI DH", enUrl:"#", thLabel:"SDS - น้ำมัน Univis HVI DH", thUrl:"", productInfo:""},
  {id:39, title:"USPI 50EP Grease", thName:"จาระบี USPI 50EP", pn:"100124501", flammable:"nonflammable", status:"active", revDate:"1/22/2020", followUp:"1/21/2025", subject:"Lubricant", needPrint:true, halEN:false, halTH:false, hazard:"Grease; low hazard. Mild skin and eye irritant.", enLabel:"SDS - USPI 50EP Grease", enUrl:"#", thLabel:"SDS - จาระบี USPI 50EP", thUrl:"", productInfo:""},
  {id:40, title:"WD-40 Aerosol", thName:"สเปรย์ WD-40", pn:"", flammable:"flammable", status:"active", revDate:"8/3/2021", followUp:"8/2/2026", subject:"Aerosol", needPrint:true, halEN:false, halTH:false, hazard:"Extremely flammable aerosol, aspiration hazard.", enLabel:"SDS - WD-40 Aerosol", enUrl:"https://www.wd40.com/products/msds/", thLabel:"SDS - สเปรย์ WD-40", thUrl:"", productInfo:"https://www.wd40.com"},
  {id:41, title:"WD-40 Multi-Use Product Bulk Liquid", thName:"น้ำมันหล่อลื่น WD-40 แบบแกลลอน", pn:"", flammable:"flammable", status:"active", revDate:"8/3/2021", followUp:"8/2/2026", subject:"Lubricant", needPrint:true, halEN:false, halTH:false, hazard:"Extremely flammable liquid; aspiration hazard.", enLabel:"SDS - WD-40 Bulk Liquid", enUrl:"https://www.wd40.com/products/msds/", thLabel:"SDS - WD-40 แบบแกลลอน", thUrl:"", productInfo:"https://www.wd40.com"},
];

function flammableMap(v: SeedRecord['flammable']): FlammableStatus {
  if (v === 'flammable') return FlammableStatus.FLAMMABLE;
  if (v === 'nonflammable') return FlammableStatus.NON_FLAMMABLE;
  return FlammableStatus.UNKNOWN;
}

function statusMap(s: SeedRecord['status']): RecordStatus {
  return s === 'active' ? RecordStatus.ACTIVE : RecordStatus.INACTIVE;
}

function isMissingPdf(r: SeedRecord): boolean {
  return !r.enUrl || r.enUrl === '#';
}

function isOutdated(r: SeedRecord): boolean {
  if (!r.followUp) return false;
  const d = parseMDY(r.followUp);
  if (!d) return false;
  return d.getTime() < Date.now();
}

async function main() {
  console.log('🌱 Seeding database...');

  // ---------------- USERS ----------------
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

  await prisma.user.upsert({
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

  await prisma.user.upsert({
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

  // ---------------- CATEGORIES (matched to HTML subjects) ----------------
  const categorySeeds = [
    { name: 'Lubricant',  nameTh: 'สารหล่อลื่น',     color: '#7B4F00', icon: 'droplet',     description: 'Industrial lubricants and greases' },
    { name: 'Aerosol',    nameTh: 'สเปรย์',          color: '#C2410C', icon: 'spray-can',   description: 'Aerosol products and sprays' },
    { name: 'Solvent',    nameTh: 'ตัวทำละลาย',      color: '#B91C1C', icon: 'flask-conical', description: 'Solvents and thinners' },
    { name: 'Cleaner',    nameTh: 'น้ำยาทำความสะอาด', color: '#065F46', icon: 'spray-can',   description: 'Cleaning agents and degreasers' },
    { name: 'Adhesive',   nameTh: 'กาวและสารยึดติด', color: '#6A1B9A', icon: 'package',     description: 'Adhesives, sealants, threadlockers' },
    { name: 'Oil',        nameTh: 'น้ำมัน',           color: '#0055A4', icon: 'droplet',     description: 'Industrial oils and lubricants' },
    { name: 'Silicone',   nameTh: 'ซิลิโคน',         color: '#1D4ED8', icon: 'flask-conical', description: 'Silicone fluids, sealants, elastomers' },
    { name: 'Solder',     nameTh: 'ลวดบัดกรี',       color: '#166534', icon: 'flame',       description: 'Solder wires, bars, and fluxes' },
    { name: 'Other',      nameTh: 'อื่นๆ',            color: '#6B7280', icon: 'package',     description: 'Miscellaneous chemical products' },
  ];

  const categoryMap = new Map<string, string>();
  for (const c of categorySeeds) {
    const upserted = await prisma.category.upsert({
      where: { name: c.name },
      update: { nameTh: c.nameTh, color: c.color, icon: c.icon, description: c.description },
      create: c,
    });
    categoryMap.set(c.name, upserted.id);
  }
  console.log('✅ Categories created');

  // ---------------- SDS RECORDS (41 built-in) ----------------
  let created = 0, updated = 0;
  for (const r of BUILTIN) {
    const categoryId = categoryMap.get(r.subject) ?? null;
    const data = {
      partNumber: r.pn || null,
      productNameEn: r.title,
      productNameTh: r.thName || null,
      categoryId,
      hazardSummary: r.hazard || null,
      flammableStatus: flammableMap(r.flammable),
      status: statusMap(r.status),
      revisionDate: parseMDY(r.revDate),
      followUpDate: parseMDY(r.followUp),
      productImageUrl: null,
      sdsPdfEnUrl: r.enUrl && r.enUrl !== '#' ? r.enUrl : null,
      sdsPdfThUrl: r.thUrl && r.thUrl !== '' ? r.thUrl : null,
      externalLink: r.productInfo || null,
      language: ['en', 'th'],
      tags: [r.subject, r.flammable === 'flammable' ? 'flammable' : r.flammable === 'nonflammable' ? 'non-flammable' : 'unknown-flammable'].filter(Boolean),
      isOutdated: isOutdated(r),
      isMissingPdf: isMissingPdf(r),
      createdById: admin.id,
      updatedById: admin.id,
    };
    const existing = await prisma.sdsRecord.findFirst({ where: { productNameEn: r.title } });
    if (existing) {
      await prisma.sdsRecord.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.sdsRecord.create({ data });
      created++;
    }
  }
  console.log(`✅ SDS records: ${created} created, ${updated} updated (target: 41)`);

  // ---------------- SYSTEM SETTINGS ----------------
  const settings = [
    { key: 'email_reminder_30_days',  value: 'true',  type: 'boolean', group: 'notifications' },
    { key: 'email_reminder_60_days',  value: 'true',  type: 'boolean', group: 'notifications' },
    { key: 'email_reminder_90_days',  value: 'false', type: 'boolean', group: 'notifications' },
    { key: 'default_language',        value: 'en',    type: 'string',  group: 'general' },
    { key: 'ai_auto_analyze',         value: 'false', type: 'boolean', group: 'ai' },
    { key: 'ai_update_threshold_days', value: '365',  type: 'number',  group: 'ai' },
    { key: 'company_name',            value: 'Lab Sonde / SKL', type: 'string', group: 'company' },
    { key: 'items_per_page',          value: '20',    type: 'number',  group: 'general' },
    { key: 'outdated_threshold_days', value: '365',   type: 'number',  group: 'notifications' },
  ];
  for (const s of settings) {
    await prisma.systemSetting.upsert({ where: { key: s.key }, update: s, create: s });
  }
  console.log('✅ System settings created');

  // ---------------- AUDIT LOG ----------------
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'CREATE',
      entityType: 'system',
      description: `Seeded ${BUILTIN.length} built-in SDS records`,
    },
  });
  console.log('✅ Audit log created');

  console.log('\n🎉 Done.\n');
  console.log('📧 Demo accounts:');
  console.log('   admin@sdsmanager.com  / admin123  (ADMIN)');
  console.log('   editor@sdsmanager.com / admin123  (EDITOR)');
  console.log('   viewer@sdsmanager.com / admin123  (VIEWER)');
  console.log(`\n📦 Seeded ${BUILTIN.length} SDS records (Lab Sonde / SKL list)\n`);
}

main()
  .catch((e) => { console.error('❌ Seeding failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
