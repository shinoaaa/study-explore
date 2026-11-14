import { validateAndBuildGraph } from "@/lib/validator";
import { normalizeVault } from "@/lib/vault-storage";
import { KnowledgeEdge, KnowledgeNode, KnowledgeVault } from "@/types/knowledge";

function createVerifiedVault(
  rawVault: Omit<KnowledgeVault, "validation">,
  favoriteNodeIds: string[] = []
): KnowledgeVault {
  const favSet = new Set(favoriteNodeIds);
  const { nodes, edges, validation } = validateAndBuildGraph(
    rawVault.nodes.map((n) => ({
      ...n,
      isFavorite: favSet.has(n.id),
      origin: n.origin || "ai_generated",
    })),
    rawVault.edges
  );
  return normalizeVault({
    ...rawVault,
    nodes,
    edges,
    validation,
  });
}

const MEDIS_NODES: KnowledgeNode[] = [
  {
    id: "root",
    title: "Sistem Pernapasan Manusia",
    region: "REG-01",
    relationToOrigin: "root",
    difficulty: "Foundation",
    x: 45,
    y: 65,
    explored: true,
    mastered: true,
    summary:
      "Titik awal materi Biologi Kelas XI: ventilasi paru dan pertukaran gas O2/CO2 di alveolus.",
    levels: {
      simple:
        "Bayangkan paru-paru seperti pelabuhan logistik: udara masuk membawa paket oksigen ke dalam darah, dan membuang limbah karbon dioksida keluar tubuh.",
      standard:
        "Sistem organ yang memfasilitasi ventilasi mekanis (inspirasi-ekspirasi) serta pertukaran gas O2 dan CO2 secara difusi pasif pada membran alveolus-kapiler.",
      deep:
        "Sistem pertukaran gas konvektif-difusif yang diatur oleh kemoreseptor pusat di medula oblongata dan badan karotis untuk menjaga homeostasis pH darah serta PaO2/PaCO2.",
    },
    formula: "ΔP_difusi = P_alveolus(O2: 104 mmHg) - P_kapiler(O2: 40 mmHg)",
    application:
      "Dasar pemeriksaan auskultasi suara napas dan interpretasi awal saturasi oksigen pasien di klinik.",
    reference: "Campbell Biology 12th Ed., Ch. 42; OpenStax Biology 2e Ch. 39",
    quickCheck: {
      question:
        "Mengapa oksigen dapat berpindah dari alveolus ke kapiler darah tanpa memerlukan pompa energi ATP?",
      options: [
        {
          text: "Karena tekanan parsial O2 di alveolus lebih tinggi daripada di kapiler darah (difusi pasif)",
          correct: true,
        },
        {
          text: "Karena dinding alveolus memompa molekul O2 secara aktif",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_difusi",
    title: "Difusi Membran & Hukum Gas Fick",
    region: "REG-01",
    relationToOrigin: "prerequisite",
    difficulty: "Basic",
    x: 45,
    y: 165,
    explored: true,
    mastered: false,
    summary:
      "Konsep fisika-kimia prasyarat tentang laju perpindahan gas menembus membran tipis.",
    levels: {
      simple:
        "Molekul gas selalu bergerak otomatis dari ruangan yang padat ke ruangan yang lengang, dan makin tipis dinding pemisahnya, makin cepat mereka menyeberang.",
      standard:
        "Laju difusi gas menembus membran berbanding lurus dengan luas permukaan alveolus serta selisih tekanan parsial, dan berbanding terbalik dengan ketebalan membran.",
      deep:
        "Secara kuantitatif mengikuti Hukum Difusi Fick: koefisien difusi CO2 20 kali lebih larut dalam cairan membran dibanding O2 sehingga gangguan membran lebih dulu menurunkan O2.",
    },
    formula: "V_gas = (A / T) × D × (P1 - P2)  [Hukum Difusi Fick]",
    application:
      "Menjelaskan mengapa pada pasien pneumonia atau edema paru (membran T menebal), oksigen gagal masuk ke darah.",
    reference: "Guyton and Hall Textbook of Medical Physiology, Ch. 40",
    quickCheck: {
      question:
        "Apa dampak langsung terhadap difusi oksigen apabila membran alveolus menebal akibat penumpukan cairan?",
      options: [
        {
          text: "Laju difusi oksigen ke kapiler darah menurun drastis",
          correct: true,
        },
        {
          text: "Laju difusi oksigen meningkat dua kali lipat",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_respsel",
    title: "Respirasi Seluler & Rantai Mitokondria",
    region: "REG-01",
    relationToOrigin: "extension",
    difficulty: "Intermediate",
    x: 175,
    y: 115,
    explored: true,
    mastered: false,
    summary:
      "Menjawab pertanyaan 'untuk apa oksigen yang kita hirup?': mencetak ATP di dalam mitokondria sel.",
    levels: {
      simple:
        "Jika paru-paru adalah pelabuhan penerima oksigen, maka mitokondria di dalam sel adalah 'pabrik pembangkit listrik' yang memakai oksigen itu untuk membakar gula menjadi baterai energi (ATP).",
      standard:
        "Rangkaian reaksi katabolik di dalam sel (Glikolisis, Siklus Krebs, dan Fosforilasi Oksidatif) yang menggunakan O2 untuk mengubah glukosa menjadi energi ATP, H2O, dan CO2.",
      deep:
        "Oksigen bertindak sebagai akseptor elektron terakhir pada Kompleks IV rantai transpor elektron membran dalam mitokondria, menjaga gaya gerak proton untuk enzim ATP sintase.",
    },
    formula: "C6H12O6 + 6 O2 → 6 CO2 + 6 H2O + ~30–32 ATP",
    application:
      "Menghubungkan Bab Sistem Pernapasan dengan Bab Metabolisme Sel: menjelaskan bahwa CO2 yang kita embuskan berasal dari Siklus Krebs di tingkat sel.",
    reference: "Campbell Biology 12th Ed., Ch. 9: Cellular Respiration",
    quickCheck: {
      question:
        "Di tahap manakah oksigen yang kita hirup dari paru-paru benar-benar digunakan secara langsung di dalam sel?",
      options: [
        {
          text: "Sebagai akseptor elektron terakhir di rantai transpor elektron mitokondria",
          correct: true,
        },
        {
          text: "Saat udara melewati rongga hidung dan trakea",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_hb",
    title: "Hemoglobin & Kurva Disosiasi O2 (Efek Bohr)",
    region: "REG-02",
    relationToOrigin: "extension",
    difficulty: "Intermediate",
    x: 345,
    y: 65,
    explored: true,
    mastered: false,
    summary:
      "Mekanisme biokimia-medis pengangkutan O2 oleh eritrosit dan pelepasan O2 di jaringan aktif.",
    levels: {
      simple:
        "Hemoglobin adalah 'mobil kurir' di sel darah merah yang punya 4 kursi khusus untuk menggendong oksigen dari paru-paru lalu menurunkannya tepat di organ yang sedang sibuk bekerja.",
      standard:
        "Protein tetramerik bergugus heme (Fe2+) pada eritrosit yang mengikat 4 molekul O2 secara reversibel. Di jaringan yang asam (banyak CO2), daya ikatnya turun agar O2 mudah dilepas (Efek Bohr).",
      deep:
        "Kooperativitas alosterik menghasilkan kurva disosiasi oksihemoglobin berbentuk sigmoid (P50 ≈ 27 mmHg). Peningkatan [H+], PaCO2, suhu, dan 2,3-BPG menggeser kurva ke kanan.",
    },
    formula: "Hb + 4 O2 ⇌ Hb(O2)4  (Pergeseran kanan oleh ↑CO2, ↑H+, ↑Suhu)",
    application:
      "Konteks Medis: Keracunan gas CO berbahaya karena afinitas CO terhadap Hemoglobin ~200 kali lebih kuat dibanding O2, mengunci Hb menjadi karboksihemoglobin.",
    reference: "OpenStax Biology 2e, Section 39.4; Guyton Physiology Ch. 41",
    quickCheck: {
      question:
        "Mengapa jaringan otot atau organ yang sedang bekerja aktif (pH lebih asam & suhu naik) justru lebih mudah menerima oksigen dari Hemoglobin?",
      options: [
        {
          text: "Karena Efek Bohr menggeser kurva disosiasi sehingga Hemoglobin lebih mudah melepaskan O2",
          correct: true,
        },
        {
          text: "Karena sel darah merah hancur saat melewati jaringan hangat",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_hipoksia",
    title: "Patofisiologi Hipoksia & Asidosis Respiratorik",
    region: "REG-02",
    relationToOrigin: "application",
    difficulty: "Advanced",
    x: 475,
    y: 165,
    explored: false,
    mastered: false,
    summary:
      "Penerapan klinis di IGD: dampak kegagalan pertukaran gas terhadap pH darah dan fungsi organ.",
    levels: {
      simple:
        "Ketika pasokan oksigen macet dan karbon dioksida gagal dibuang, darah pasien berubah menjadi terlalu asam dan sel-sel tubuh mengalami krisis energi.",
      standard:
        "Defisiensi oksigen di tingkat jaringan (hipoksia) dan retensi CO2 (hiperkapnia) yang menggeser sistem penyangga bikarbonat darah sehingga pH darah turun di bawah 7,35 (asidosis).",
      deep:
        "Kegagalan ventilasi alveolar meningkatkan PaCO2 (>45 mmHg), mendorong reaksi anhidrase karbonat menghasilkan akumulasi ion H+ yang memerlukan kompensasi ginjal.",
    },
    formula: "CO2 + H2O ⇌ H2CO3 ⇌ H+ + HCO3-  (pH Normal Arteri: 7.35 – 7.45)",
    application:
      "Digunakan dokter dalam menginterpretasi pemeriksaan Analisis Gas Darah (AGD) pada pasien serangan asma berat atau gagal napas.",
    reference: "Guyton and Hall Medical Physiology, Ch. 31 & 42",
    quickCheck: {
      question:
        "Mengapa kegagalan paru-paru membuang CO2 dapat menyebabkan darah pasien menjadi asam (asidosis)?",
      options: [
        {
          text: "Karena CO2 bereaksi dengan air membentuk asam karbonat (H2CO3) yang terurai menjadi ion H+",
          correct: true,
        },
        {
          text: "Karena CO2 menyerap seluruh kalsium dari tulang",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_bioenergetika",
    title: "Bioenergetika & Energi Bebas Gibbs Seluler",
    region: "REG-05",
    relationToOrigin: "related_concept",
    difficulty: "Advanced",
    x: 350,
    y: 335,
    explored: false,
    mastered: false,
    summary:
      "Pemodelan kuantitatif termodinamika energi bebas pada reaksi oksidasi nutrisi di dalam sel.",
    levels: {
      simple:
        "Hitungan matematika tabungan energi tubuh: bagaimana energi dari pembakaran nutrisi dihitung dan mengapa sebagian berubah menjadi panas tubuh 37°C.",
      standard:
        "Kajian kuantitatif perubahan energi bebas Gibbs (ΔG) yang menggandeng reaksi pelepas energi (eksergonik) dari oksidasi glukosa dengan pembentukan ATP (endergonik).",
      deep:
        "Hidrolisis ikatan fosfoanhidrida terminal pada ATP memiliki ΔG°' = -30,5 kJ/mol (atau hingga -54 kJ/mol pada rasio konsentrasi fisiologis intraseluler).",
    },
    formula: "ΔG = ΔG°' + R·T·ln([ADP][Pi] / [ATP])",
    application:
      "Menghitung efisiensi termodinamika konversi energi kimia makanan menjadi kerja mekanis dan transpor aktif membran.",
    reference: "Lehninger Principles of Biochemistry, Ch. 13: Bioenergetics",
    quickCheck: {
      question:
        "Apa arti nilai ΔG negatif (reaksi eksergonik) pada proses oksidasi glukosa dengan oksigen?",
      options: [
        {
          text: "Reaksi tersebut melepaskan energi bebas yang dapat dimanfaatkan sel untuk membentuk ATP",
          correct: true,
        },
        {
          text: "Reaksi tersebut tidak dapat berlangsung di dalam sel hidup",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_oximetry",
    title: "Biomedical Engineering: Sensor Pulse Oximetry",
    region: "REG-04",
    relationToOrigin: "cross_disciplinary",
    difficulty: "Intermediate",
    x: 65,
    y: 345,
    explored: false,
    mastered: false,
    summary:
      "Cabang Lintas-Bidang (Sains Hayati → Rekayasa Biomedis): bagaimana sensor optik mengukur SpO2 darah tanpa jarum suntik.",
    levels: {
      simple:
        "Darah yang penuh oksigen berwarna merah terang, sedangkan yang kurang oksigen agak kebiruan. Alat jepit jari (oksimeter) menembakkan cahaya untuk membaca warna darahmu secara instan!",
      standard:
        "Instrumen rekayasa biomedis yang memancarkan cahaya merah (660 nm) dan inframerah (940 nm) menembus jaringan jari untuk menghitung persentase Hemoglobin yang mengikat oksigen (SpO2).",
      deep:
        "Menerapkan Hukum Beer-Lambert pada rasio modulasi absorbansi pulsatil arteri terhadap komponen statis jaringan untuk mengestimasi saturasi oksigen arteri secara non-invasif.",
    },
    formula: "A = ε · c · l  [Hukum Beer-Lambert pada λ = 660nm & 940nm]",
    application:
      "Membuka wawasan lintas bidang (mencegah Filter Bubble): siswa yang menyukai Biologi Pernapasan dan Medis dapat mengeksplorasi karier di bidang Teknik Biomedis (Biomedical Engineering).",
    reference: "J.G. Webster, Design of Pulse Oximeters (Biomedical Engineering Series)",
    quickCheck: {
      question:
        "Prinsip fisika-rekayasa apa yang dimanfaatkan alat Pulse Oximeter di ujung jari untuk mendeteksi kadar oksigen darah?",
      options: [
        {
          text: "Perbedaan penyerapan cahaya merah dan inframerah antara Hemoglobin kaya O2 dan miskin O2",
          correct: true,
        },
        {
          text: "Pengukuran tekanan mekanis kuku jari menggunakan pegas",
          correct: false,
        },
      ],
    },
  },
];

const MEDIS_EDGES: KnowledgeEdge[] = [
  {
    id: "e-med-1",
    source: "n_difusi",
    target: "root",
    relation: "prerequisite",
    reason:
      "Prasyarat wajib: Untuk memahami bagaimana pertukaran gas terjadi di alveolus paru-paru, pengguna harus memahami konsep gradien tekanan parsial dan difusi membran terlebih dahulu.",
  },
  {
    id: "e-med-2",
    source: "root",
    target: "n_respsel",
    relation: "extension",
    reason:
      "Oksigen yang diperoleh melalui mekanisme pernapasan di paru-paru digunakan secara langsung oleh mitokondria dalam respirasi seluler untuk memproduksi energi ATP.",
  },
  {
    id: "e-med-3",
    source: "root",
    target: "n_hb",
    relation: "extension",
    reason:
      "Menjembatani organ paru-paru dengan sel tubuh: Oksigen yang menembus alveolus membutuhkan molekul Hemoglobin di dalam sel darah merah agar dapat diangkut secara efisien.",
  },
  {
    id: "e-med-4",
    source: "n_hb",
    target: "n_respsel",
    relation: "related_concept",
    reason:
      "Pelepasan O2 oleh Hemoglobin melalui Efek Bohr dipicu oleh CO2 dan H+ yang dihasilkan dari proses Respirasi Seluler di jaringan aktif.",
  },
  {
    id: "e-med-5",
    source: "n_hb",
    target: "n_hipoksia",
    relation: "application",
    reason:
      "Penerapan klinis sesuai minat Medis: Gangguan ventilasi atau pengikatan Hb menyebabkan hipoksia jaringan dan ketidakseimbangan asam-basa darah (asidosis).",
  },
  {
    id: "e-med-6",
    source: "n_respsel",
    target: "n_bioenergetika",
    relation: "cross_disciplinary",
    reason:
      "Matematika & Termodinamika Kuantitatif: menganalisis efisiensi energi bebas Gibbs dari ATP yang dihasilkan respirasi seluler.",
  },
  {
    id: "e-med-7",
    source: "n_hb",
    target: "n_oximetry",
    relation: "cross_disciplinary",
    reason:
      "Rekayasa Biomedis: sifat optik ikatan O2 pada hemoglobin dimanfaatkan untuk merancang sensor pulse oximeter.",
  },
];

const OLAHRAGA_NODES: KnowledgeNode[] = [
  {
    id: "root",
    title: "Sistem Pernapasan Manusia",
    region: "REG-01",
    relationToOrigin: "root",
    difficulty: "Foundation",
    x: 45,
    y: 75,
    explored: true,
    mastered: true,
    summary:
      "Materi awal yang sama (Bab Sistem Pernapasan), tetapi dipetakan khusus untuk minat Fisiologi Olahraga & Performa Atlet.",
    levels: {
      simple:
        "Mesin penyuplai udara utama saat kamu berlari atau berolahraga agar otot terus mendapat oksigen dan tidak cepat lelah.",
      standard:
        "Sistem ventilasi paru dan pertukaran gas alveolar yang beradaptasi secara dinamis terhadap peningkatan kebutuhan metabolisme saat aktivitas fisik.",
      deep:
        "Koordinasi ventilasi semenit (VE) dan perfusi kapiler paru yang mampu meningkat hingga 15–20 kali lipat dari kondisi istirahat selama latihan aerobik maksimal.",
    },
    formula: "Ventilasi Semenit (VE) = Volume Tidal (TV) × Frekuensi Napas (f)",
    application:
      "Pengaturan irama napas diafragma pada pelari jarak jauh, perenang, dan pesepeda.",
    reference: "OpenStax Biology 2e Ch. 39; McArdle Exercise Physiology",
    quickCheck: {
      question:
        "Bagaimana cara sistem pernapasan meningkatkan total volume udara per menit saat seseorang mulai berlari?",
      options: [
        {
          text: "Dengan meningkatkan kedalaman tarikan napas (Volume Tidal) sekaligus frekuensi napas per menit",
          correct: true,
        },
        {
          text: "Dengan menyempitkan bronkus dan menahan napas",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_spirometri",
    title: "Volume & Kapasitas Vital Paru (Spirometri)",
    region: "REG-01",
    relationToOrigin: "prerequisite",
    difficulty: "Basic",
    x: 165,
    y: 155,
    explored: true,
    mastered: false,
    summary:
      "Prasyarat dasar memahami kapasitas tampung udara paru sebelum mempelajari metrik atletik VO2 Max.",
    levels: {
      simple:
        "Seberapa besar ukuran 'tangki udara' paru-parumu saat kamu menarik napas sedalam mungkin lalu mengembuskannya sekuat tenaga.",
      standard:
        "Penjumlahan Volume Tidal (TV), Volume Cadangan Inspirasi (IRV), dan Volume Cadangan Ekspirasi (ERV) yang membentuk Kapasitas Vital (VC) paru-paru.",
      deep:
        "Evaluasi mekanika paru menggunakan spirometri (FVC dan FEV1) yang mencerminkan komplians elastis jaringan paru dan kekuatan otot inspirasi.",
    },
    formula: "Kapasitas Vital (VC) = TV (500mL) + IRV (3000mL) + ERV (1100mL)",
    application:
      "Mengukur adaptasi volume paru pada atlet renang dan penyelam bebas (freediver).",
    reference: "Kemendikbud Biologi XI; Guyton Medical Physiology Ch. 38",
    quickCheck: {
      question:
        "Mengapa paru-paru manusia tidak pernah kempis total (0 mL) meskipun kita sudah mengembuskan napas sekuat tenaga?",
      options: [
        {
          text: "Karena adanya Volume Residu (~1200 mL) yang menjaga alveolus tetap mengembang",
          correct: true,
        },
        {
          text: "Karena udara berubah menjadi cairan di dalam bronkiolus",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_vo2max",
    title: "VO2 Max & Kapasitas Aerobik Maksimal",
    region: "REG-02",
    relationToOrigin: "extension",
    difficulty: "Intermediate",
    x: 350,
    y: 65,
    explored: true,
    mastered: false,
    summary:
      "Indikator emas kebugaran kardiorespirasi atlet: batas tertinggi penyerapan oksigen tubuh per menit.",
    levels: {
      simple:
        "Skor 'CC mesin' kebugaran tubuhmu: makin tinggi angka VO2 Max seorang atlet, makin kencang dan lama ia sanggup berlari tanpa kehabisan napas.",
      standard:
        "Volume maksimum oksigen (dalam mL O2/kg berat badan/menit) yang dapat dihirup, diangkut darah, dan digunakan oleh sel otot selama olahraga intensitas maksimal.",
      deep:
        "Diformulasikan melalui Persamaan Fick: hasil kali Curah Jantung Maksimal (Q_max) dengan selisih ekstraksi oksigen arteri-vena maksimal oleh mitokondria otot rangka.",
    },
    formula: "VO2 Max = Q_max × (CaO2 - CvO2)  [mL / kgBB / menit]",
    application:
      "Digunakan pelatih fisik sepak bola dan maraton untuk memantau peningkatan daya tahan (endurance) atlet.",
    reference: "McArdle, Katch & Katch: Exercise Physiology 8th Ed.",
    quickCheck: {
      question:
        "Dua komponen fisiologis apa yang secara langsung membatasi dan menentukan skor VO2 Max seorang atlet?",
      options: [
        {
          text: "Kemampuan jantung-paru menyuplai darah kaya O2 dan kemampuan otot mengekstraksi O2",
          correct: true,
        },
        {
          text: "Tinggi badan dan warna seragam olahraga",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_laktat",
    title: "Ambang Laktat & Transisi Aerob-Anaerob",
    region: "REG-02",
    relationToOrigin: "application",
    difficulty: "Intermediate",
    x: 475,
    y: 165,
    explored: true,
    mastered: false,
    summary:
      "Penerapan saat sprint cepat: apa yang terjadi ketika kebutuhan energi otot melampaui suplai oksigen napas.",
    levels: {
      simple:
        "Saat kamu sprint 100 meter, napasmu tidak sempat mengirim cukup oksigen ke kaki, sehingga otot menyalakan 'mode darurat tanpa oksigen' yang menghasilkan asam laktat dan rasa pegal.",
      standard:
        "Titik intensitas olahraga di mana suplai O2 tidak lagi mencukupi kebutuhan ATP secara aerobik, memicu glikolisis anaerobik dan akumulasi laktat di dalam darah.",
      deep:
        "Onset of Blood Lactate Accumulation (OBLA ~4 mmol/L) terjadi saat laju produksi piruvat melebihi kapasitas oksidasi mitokondria dan laju pembersihan siklus Cori di hati.",
    },
    formula: "Glukosa → 2 Piruvat → 2 Laktat + 2 ATP (Jalur Cepat Anaerobik)",
    application:
      "Menentukan zona latihan High-Intensity Interval Training (HIIT) vs lari pemulihan (recovery run).",
    reference: "Powers & Howley, Exercise Physiology: Theory and Application",
    quickCheck: {
      question:
        "Mengapa pelari jarak pendek (sprinter 100m) tetap dapat berlari sangat kencang walau hanya sempat menarik napas beberapa kali?",
      options: [
        {
          text: "Karena otot menggunakan sistem fosfagen dan glikolisis anaerobik yang mencetak ATP cepat tanpa O2",
          correct: true,
        },
        {
          text: "Karena otot sprinter tidak membutuhkan molekul ATP",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_wearable",
    title: "Sports Analytics & Algoritma Wearable Sensor",
    region: "REG-03",
    relationToOrigin: "cross_disciplinary",
    difficulty: "Intermediate",
    x: 650,
    y: 95,
    explored: false,
    mastered: false,
    summary:
      "Cabang Lintas-Bidang (Fisiologi Olahraga → Komputasi & Data Science): bagaimana smartwatch menghitung VO2 Max dari detak jantung dan GPS.",
    levels: {
      simple:
        "Jam tangan pintar (smartwatch) membandingkan seberapa cepat kamu berlari (GPS) dengan seberapa keras jantungmu berdetak untuk menebak skor VO2 Max paru-parumu!",
      standard:
        "Pemanfaatan sensor optik Photoplethysmography (PPG), akselerometer, dan model algoritma data science untuk mengestimasi VO2 Max serta beban latihan atlet di lapangan.",
      deep:
        "Memodelkan regresi hubungan linear antara persentase Heart Rate Reserve (%HRR) dan kecepatan mekanis terhadap konsumsi oksigen sub-maksimal.",
    },
    formula: "Target HR = ((HR_max - HR_rest) × %Intensity) + HR_rest",
    application:
      "Membuka jalur eksplorasi baru bagi siswa penyuka olahraga menuju bidang Sports Data Science dan Wearable IoT Engineering.",
    reference: "ACSM's Guidelines for Exercise Testing and Prescription",
    quickCheck: {
      question:
        "Kombinasi data sensor apakah yang digunakan smartwatch modern untuk mengestimasi VO2 Max tanpa masker laboratorium?",
      options: [
        {
          text: "Kecepatan lari (GPS/akselerometer) yang dipetakan terhadap respons detak jantung (PPG)",
          correct: true,
        },
        {
          text: "Sensor kamera depan dan mikrofon ponsel",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_kinematika",
    title: "Pemodelan Kuantitatif Kinetika Pengambilan O2",
    region: "REG-05",
    relationToOrigin: "related_concept",
    difficulty: "Advanced",
    x: 350,
    y: 335,
    explored: false,
    mastered: false,
    summary:
      "Pemodelan kurva eksponensial waktu adaptasi konsumsi oksigen saat transisi dari diam ke berlari.",
    levels: {
      simple:
        "Grafik matematika yang menghitung berapa detik waktu yang dibutuhkan paru-paru dan jantung untuk 'panas' sejak peluit tanda mulai lari dibunyikan.",
      standard:
        "Analisis kurva eksponensial kenaikan konsumsi oksigen (kinetika VO2) pada menit-menit awal olahraga dan fenomena defisit oksigen (oxygen deficit).",
      deep:
        "Persamaan diferensial orde pertama dengan konstanta waktu (tau, τ) yang mencerminkan kecepatan aktivasi fosforilasi oksidatif otot rangka.",
    },
    formula: "VO2(t) = VO2_baseline + ΔVO2 × (1 - e^(-t / τ))",
    application:
      "Menjelaskan secara matematis mengapa pemanasan (warm-up) sebelum bertanding memperkecil utang oksigen (oxygen deficit).",
    reference: "Poole & Jones, Oxygen Uptake Kinetics in Sport, Exercise and Medicine",
    quickCheck: {
      question:
        "Apa manfaat fisiologis dari melakukan pemanasan (warm-up) terhadap kurva kinetika pengambilan oksigen?",
      options: [
        {
          text: "Mempercepat adaptasi pengambilan O2 (memperkecil nilai τ) sehingga otot tidak cepat mengalami defisit oksigen",
          correct: true,
        },
        {
          text: "Menghentikan aliran darah menuju otot kaki",
          correct: false,
        },
      ],
    },
  },
];

const OLAHRAGA_EDGES: KnowledgeEdge[] = [
  {
    id: "e-sp-1",
    source: "n_spirometri",
    target: "root",
    relation: "prerequisite",
    reason:
      "Prasyarat konsep: Sebelum menganalisis performa napas saat olahraga, pengguna perlu memahami komponen volume dan kapasitas vital paru-paru.",
  },
  {
    id: "e-sp-2",
    source: "root",
    target: "n_vo2max",
    relation: "extension",
    reason:
      "Personalisasi minat Olahraga: Dari mekanisme pernapasan dasar, eksplorasi diperdalam ke metrik kapasitas penyerapan oksigen maksimal (VO2 Max).",
  },
  {
    id: "e-sp-3",
    source: "n_spirometri",
    target: "n_vo2max",
    relation: "prerequisite",
    reason:
      "Kapasitas ventilasi paru (Volume Tidal dan Kapasitas Vital) merupakan komponen penentu suplai udara menuju pencapaian VO2 Max.",
  },
  {
    id: "e-sp-4",
    source: "n_vo2max",
    target: "n_laktat",
    relation: "application",
    reason:
      "Penerapan pada latihan fisik: Ketika intensitas olahraga mendekati atau melampaui kapasitas VO2 Max, tubuh melewati ambang laktat.",
  },
  {
    id: "e-sp-5",
    source: "n_vo2max",
    target: "n_wearable",
    relation: "cross_disciplinary",
    reason:
      "Komputasi & AI: fisiologi VO2 Max diterjemahkan menjadi algoritma sensor pada smartwatch olahraga.",
  },
  {
    id: "e-sp-6",
    source: "n_vo2max",
    target: "n_kinematika",
    relation: "cross_disciplinary",
    reason:
      "Matematika & Logika: laju adaptasi konsumsi oksigen menuju VO2 Max dimodelkan dengan fungsi eksponensial.",
  },
];

const KANKER_NODES: KnowledgeNode[] = [
  {
    id: "n_sel",
    title: "1. Biologi Sel & Siklus Pembelahan Normal",
    region: "REG-01",
    relationToOrigin: "prerequisite",
    difficulty: "Basic",
    x: 40,
    y: 65,
    explored: true,
    mastered: true,
    summary:
      "Memahami bagaimana sel sehat mengatur jadwal pembelahannya secara teratur.",
    levels: {
      simple:
        "Sel tubuh yang sehat sangat disiplin: mereka punya jadwal ketat kapan harus membelah diri untuk menutup luka, dan kapan harus berhenti.",
      standard:
        "Tahapan siklus hidup sel (Interfase G1, Sintesis DNA, G2, dan Fase Mitosis) yang dikendalikan oleh pos pemeriksaan (checkpoint) molekuler.",
      deep:
        "Regulasi transisi fase G1/S dan G2/M oleh kompleks protein Cyclin dan enzim Cyclin-Dependent Kinases (CDK) untuk menjaga fidelitas pembelahan.",
    },
    formula: "Siklus Sel: Fase G1 → Fase S (Replikasi DNA) → Fase G2 → Mitosis",
    application:
      "Menjelaskan bagaimana jaringan kulit dan lapisan usus beregenerasi secara terkendali setiap minggu.",
    reference: "Campbell Biology 12th Ed., Ch. 12: The Cell Cycle",
    quickCheck: {
      question:
        "Mengapa seorang pelajar perlu memahami Siklus Sel Normal terlebih dahulu sebelum mempelajari sel kanker?",
      options: [
        {
          text: "Karena kanker pada dasarnya adalah rusaknya mekanisme pengendalian siklus pembelahan sel normal",
          correct: true,
        },
        {
          text: "Karena sel kanker tidak memiliki membran maupun materi genetik",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_dna",
    title: "2. Struktur DNA & Mekanisme Mutasi Genetik",
    region: "REG-01",
    relationToOrigin: "prerequisite",
    difficulty: "Intermediate",
    x: 175,
    y: 160,
    explored: true,
    mastered: false,
    summary:
      "Anak tangga prasyarat ke-2: memahami bagaimana 'buku instruksi' sel (DNA) dapat mengalami salah ketik (mutasi).",
    levels: {
      simple:
        "DNA adalah buku resep di dalam inti sel. Paparan asap rokok, sinar UV berlebih, atau kebetulan saat menyalin resep bisa membuat hurufnya salah ketik (mutasi).",
      standard:
        "Perubahan permanen pada urutan basa nukleotida DNA (mutasi titik, delesi, translokasi) akibat kegagalan enzim perbaikan DNA (DNA repair) mengatasi kerusakan karsinogen.",
      deep:
        "Akumulasi mutasi somatik akibat lesi DNA (aduk kimia atau dimer pirimidin) yang lolos dari jalur Nucleotide Excision Repair (NER) dan Mismatch Repair (MMR).",
    },
    formula: "Paparan Karsinogen / Error Replikasi → Lesi DNA → Mutasi Somatik",
    application:
      "Menjelaskan hubungan kausal antara karsinogen (tar tembakau, radiasi pengion, benzena) dengan kerusakan genetik sel.",
    reference: "OpenStax Biology 2e, Ch. 14 & Ch. 16",
    quickCheck: {
      question:
        "Apa yang terjadi apabila kerusakan basa DNA berhasil diperbaiki oleh enzim DNA repair sebelum sel membelah?",
      options: [
        {
          text: "Sel tetap normal dan kerusakan tidak diwariskan ke sel anakan",
          correct: true,
        },
        {
          text: "Sel langsung berubah menjadi tumor ganas seketika",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_regulasi",
    title: "3. Proto-Onkogen & Gen Supresor Tumor (p53)",
    region: "REG-02",
    relationToOrigin: "prerequisite",
    difficulty: "Intermediate",
    x: 345,
    y: 65,
    explored: true,
    mastered: false,
    summary:
      "Jembatan prasyarat ke-3: bagaimana mutasi pada 'pedal gas' dan 'pedal rem' sel memicu pembelahan liar.",
    levels: {
      simple:
        "Bayangkan sel seperti mobil: ia punya 'pedal gas' (proto-onkogen) dan 'pedal rem' (gen p53). Kanker terjadi ketika gasnya macet tertahan di posisi ngebut dan remnya blong!",
      standard:
        "Dua kelompok gen pengatur pertumbuhan: Proto-onkogen (bila bermutasi menjadi Onkogen yang memacu sel terus membelah) dan Gen Supresor Tumor (seperti p53 yang mengerem sel rusak atau memicu bunuh diri sel/apoptosis).",
      deep:
        "Hipotesis multi-hit: kombinasi mutasi gain-of-function dominan pada alel proto-onkogen (RAS/MYC) dan inaktivasi loss-of-function resesif bialelik pada TP53 atau RB1.",
    },
    formula: "Aktivasi Onkogen (Gas ↑) + Inaktivasi TP53 (Rem ✕) → Proliferasi Liar",
    application:
      "Protein p53 dijuluki 'Guardian of the Genome' karena ditemukan rusak pada lebih dari 50% kasus kanker manusia.",
    reference: "Robert A. Weinberg, The Biology of Cancer 2nd Ed., Ch. 4–8",
    quickCheck: {
      question:
        "Dalam analogi kendaraan, apakah fungsi normal dari Gen Supresor Tumor seperti p53 di dalam sel sehat?",
      options: [
        {
          text: "Bertindak sebagai 'pedal rem' yang menghentikan pembelahan sel jika terdeteksi kerusakan DNA",
          correct: true,
        },
        {
          text: "Memaksa sel membelah diri tanpa henti",
          correct: false,
        },
      ],
    },
  },
  {
    id: "root",
    title: "4. Mekanisme Pertumbuhan Tumor & Metastasis",
    region: "REG-02",
    relationToOrigin: "root",
    difficulty: "Advanced",
    x: 475,
    y: 160,
    explored: true,
    mastered: false,
    summary:
      "Bagaimana sel ganas membentuk massa tumor, pembuluh darah baru, lalu menyebar.",
    levels: {
      simple:
        "Setelah melewati 3 fondasi sebelumnya, kini jelas: sel yang remnya blong menumpuk jadi benjolan (tumor), memanggil pembuluh darah baru untuk makan (angiogenesis), lalu bisa ikut aliran darah ke organ lain (metastasis).",
      standard:
        "Tahap perkembangan klonal sel kanker: menghindari apoptosis, merangsang pembentukan pembuluh darah baru (angiogenesis), menginvasi jaringan sekitar, dan bermetastasis.",
      deep:
        "Enam hingga sepuluh 'Hallmarks of Cancer' (Hanahan & Weinberg): otonomi sinyal proliferatif, sekresi VEGF untuk neo-angiogenesis, transisi epitel-mesenkimal (EMT), dan evasi imun.",
    },
    formula: "Hiperplasia → Displasia → Tumor In Situ → Angiogenesis → Metastasis",
    application:
      "Menjadi dasar pengembangan obat kanker modern seperti terapi Anti-Angiogenesis dan Imunoterapi yang lebih terarah dibanding kemoterapi biasa.",
    reference: "Hanahan & Weinberg (2011), Hallmarks of Cancer: The Next Generation, Cell",
    quickCheck: {
      question:
        "Mengapa massa tumor ganas merangsang proses 'angiogenesis' (pembentukan pembuluh darah baru menuju tumor)?",
      options: [
        {
          text: "Untuk menyuplai oksigen dan nutrisi agar koloni sel tumor dapat terus tumbuh membesar",
          correct: true,
        },
        {
          text: "Untuk memperbaiki DNA sel tumor agar kembali normal",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_bioinfo",
    title: "Bioinformatika & Sekuensing Genomik Kanker",
    region: "REG-03",
    relationToOrigin: "cross_disciplinary",
    difficulty: "Advanced",
    x: 650,
    y: 85,
    explored: false,
    mastered: false,
    summary:
      "Cabang Lintas-Bidang (Onkologi Medis → Komputasi & AI): memetakan mutasi spesifik pasien dengan algoritma komputer.",
    levels: {
      simple:
        "DNA manusia terdiri dari 3 miliar huruf. Ilmuwan komputer membuat algoritma pencari cepat untuk menemukan huruf mana yang salah ketik pada tumor pasien agar dokter bisa memilih obat yang paling tepat.",
      standard:
        "Penerapan algoritma komputasi dan Next-Generation Sequencing (NGS) untuk membandingkan genom sel sehat vs sel tumor pasien demi merancang terapi target (Precision Oncology).",
      deep:
        "Pipeline bioinformatika untuk somatic variant calling (penyelarasan bacaan sekuens dan identifikasi driver mutations) pada basis data genomik klinis.",
    },
    formula: "DNA Sequencing (FASTQ) → Alignment (BAM) → Variant Calling (VCF)",
    application:
      "Menunjukkan kepada pelajar bahwa minat pada riset kanker juga dapat ditempuh melalui jalur Ilmu Komputer, AI, dan Bioinformatika.",
    reference: "Jonathan Pevsner, Bioinformatics and Functional Genomics 3rd Ed.",
    quickCheck: {
      question:
        "Bagaimana peran bidang Ilmu Komputer (Bioinformatika) dalam pengobatan kanker modern (Precision Medicine)?",
      options: [
        {
          text: "Menganalisis data sekuens DNA tumor untuk menemukan mutasi spesifik sehingga obat dapat disesuaikan per pasien",
          correct: true,
        },
        {
          text: "Menggantikan fungsi paru-paru dengan perangkat lunak",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_epidemiologi",
    title: "Kesehatan Masyarakat & Skrining Pencegahan Kanker",
    region: "REG-06",
    relationToOrigin: "cross_disciplinary",
    difficulty: "Intermediate",
    x: 650,
    y: 335,
    explored: false,
    mastered: false,
    summary:
      "Cabang Lintas-Bidang (Medis → Sosial, Kebijakan & Kesehatan Masyarakat): deteksi dini dan kebijakan pengendalian karsinogen.",
    levels: {
      simple:
        "Mencegah lebih baik daripada mengobati: bagaimana kebijakan kawasan tanpa rokok, vaksinasi HPV, dan deteksi dini menyelamatkan jutaan orang sebelum tumor berkembang.",
      standard:
        "Pendekatan epidemiologi dan kebijakan kesehatan masyarakat untuk menekan insidensi kanker melalui regulasi karsinogen lingkungan, edukasi gaya hidup, dan program skrining dini.",
      deep:
        "Evaluasi efektivitas biaya (cost-effectiveness) program skrining populasi dan analisis risiko atributif populasi terhadap faktor karsinogenik yang dapat dimodifikasi.",
    },
    formula: "Pencegahan Primer (Vaksin/Regulasi) + Sekunder (Skrining Deteksi Dini)",
    application:
      "Menghubungkan biologi kanker dengan kebijakan publik, sosiologi kesehatan, dan edukasi masyarakat.",
    reference: "World Health Organization (WHO) World Cancer Report",
    quickCheck: {
      question:
        "Mengapa deteksi dini (skrining pada tahap displasia/in situ) meningkatkan peluang kesembuhan secara drastis?",
      options: [
        {
          text: "Karena sel abnormal ditemukan sebelum melakukan angiogenesis dan menyebar (metastasis) ke organ lain",
          correct: true,
        },
        {
          text: "Karena skrining mengubah struktur kimia udara",
          correct: false,
        },
      ],
    },
  },
];

const KANKER_EDGES: KnowledgeEdge[] = [
  {
    id: "e-ca-1",
    source: "n_sel",
    target: "n_dna",
    relation: "prerequisite",
    reason:
      "Urutan Prasyarat 1 → 2: Setelah memahami siklus pembelahan sel normal, pengguna perlu memahami materi genetik (DNA) yang disalin pada Fase S siklus tersebut.",
  },
  {
    id: "e-ca-2",
    source: "n_dna",
    target: "n_regulasi",
    relation: "prerequisite",
    reason:
      "Urutan Prasyarat 2 → 3: Mutasi pada DNA baru akan memicu kekacauan pembelahan apabila mengenai gen pengatur siklus sel (Proto-onkogen dan Gen Supresor Tumor p53).",
  },
  {
    id: "e-ca-3",
    source: "n_sel",
    target: "n_regulasi",
    relation: "prerequisite",
    reason:
      "Pos pemeriksaan (checkpoint) pada siklus sel dikendalikan langsung oleh protein hasil ekspresi proto-onkogen dan gen supresor tumor.",
  },
  {
    id: "e-ca-4",
    source: "n_regulasi",
    target: "root",
    relation: "extension",
    reason:
      "Ketika regulasi proto-onkogen dan p53 gagal, sel membelah tanpa kendali membentuk tumor, memicu angiogenesis, hingga bermetastasis.",
  },
  {
    id: "e-ca-5",
    source: "root",
    target: "n_bioinfo",
    relation: "cross_disciplinary",
    reason:
      "Komputasi & AI: kompleksitas mutasi pada sel tumor dianalisis menggunakan algoritma bioinformatika dan genomik komputasional.",
  },
  {
    id: "e-ca-6",
    source: "root",
    target: "n_epidemiologi",
    relation: "cross_disciplinary",
    reason:
      "Kesehatan Publik & Kebijakan: pemahaman fase pra-metastasis mendasari program skrining deteksi dini dan regulasi kesehatan masyarakat.",
  },
];

export const PRESET_VAULTS: KnowledgeVault[] = [
  createVerifiedVault(
    {
      id: "vault-preset-medis",
      name: "Pernapasan × Medis",
      createdAt: "2026-11-12T08:00:00.000Z",
      updatedAt: "2026-11-12T08:00:00.000Z",
      isPreset: true,
      identity: {
        mainInterest: "Dunia Medis & Fisiologi Sel",
        shortDescription:
          "Menghubungkan sistem pernapasan manusia dengan transpor oksigen seluler dan pembacaan klinis.",
        focusQuestion:
          "Bagaimana oksigen dari paru-paru diangkut darah dan digunakan oleh sel tubuh?",
        learningGoal:
          "Memahami mekanisme difusi gas, oksihemoglobin, hingga aplikasi pulse oximetry klinik.",
        relatedInterests: ["Biologi Sel", "Klinis & Diagnostik", "Sensor Biomedis"],
        difficultyComfort: "Intermediate",
      },
      inputContext: {
        mode: "mode_a",
        subject: "Biologi (SMA Kelas XI)",
        chapter: "Sistem Pernapasan Manusia",
        subchapters:
          "Organ pernapasan, Mekanisme pernapasan, Pertukaran gas, Gangguan sistem pernapasan",
        interestDomain: "Dunia Medis & Fisiologi Sel",
        targetGoal:
          "Bagaimana oksigen dari paru-paru diangkut darah dan digunakan oleh sel tubuh serta implikasi klinisnya",
      },
      learningSources: [
        {
          id: "src-medis-campbell",
          title: "Campbell Biology — Bab Pertukaran Gas",
          format: "book_chapter",
          chapterOrSection: "Ch. 42: Gas Exchange & Circulation",
          excerptOrNotes:
            "Ventilasi mekanis, difusi alveolus-kapiler (Hukum Fick), kurva disosiasi hemoglobin-oksigen, dan pengikatan O2 oleh Fe2+ pada gugus heme.",
          focusQuestion:
            "Bagaimana gradien tekanan parsial memicu difusi oksigen ke oksihemoglobin?",
          origin: "user_source",
          isFavorite: true,
          createdAt: "2026-11-12T08:00:00.000Z",
          updatedAt: "2026-11-12T08:00:00.000Z",
          linkedNodeIds: ["root", "n_difusi", "n_hb", "n_respsel"],
        },
        {
          id: "src-medis-oximetry",
          title: "Catatan Klinis: Hipoksia & Pulse Oximetry",
          format: "lecture_notes",
          chapterOrSection: "Modul Diagnostik Non-Invasif",
          excerptOrNotes:
            "Perbedaan serapan cahaya merah (660 nm) vs inframerah (940 nm) pada Hb teroksigenasi vs deoksihemoglobin di ujung jari.",
          focusQuestion:
            "Bagaimana sensor optik membaca saturasi O2 pasien secara real-time?",
          origin: "user_source",
          isFavorite: false,
          createdAt: "2026-11-12T08:04:00.000Z",
          updatedAt: "2026-11-12T08:04:00.000Z",
          linkedNodeIds: ["n_hipoksia", "n_bioenergetika", "n_oximetry"],
        },
      ],
      overview: {
        title: "Sistem Pernapasan Manusia · Medis & Seluler",
        startingRegion: "REG-01",
        summary:
          "Perjalanan oksigen dari ventilasi paru hingga menembus alveolus, berikatan dengan hemoglobin, menghasilkan ATP di mitokondria, sampai analisis klinis hipoksia dan sensor pulse oximetry.",
        keyConcepts: [
          "Ventilasi Mekanis (Inspirasi & Ekspirasi)",
          "Difusi Alveolar-Kapiler (Hukum Fick)",
          "Transpor Oksihemoglobin & Efek Bohr",
          "Fosforilasi Oksidatif Mitokondria",
        ],
        coreFormulaOrPrinciple:
          "Ventilasi Paru → Difusi Alveolus (ΔP O2) → Transpor Hb(O2)4 → Respirasi Seluler (ATP)",
        primaryReference: "Campbell Biology 12th Ed. Ch. 42 & OpenStax Biology 2e Ch. 39",
      },
      nodes: MEDIS_NODES,
      edges: MEDIS_EDGES,
    },
    ["root", "n_hb"]
  ),

  createVerifiedVault(
    {
      id: "vault-preset-olahraga",
      name: "Pernapasan × Olahraga",
      createdAt: "2026-11-12T08:05:00.000Z",
      updatedAt: "2026-11-12T08:05:00.000Z",
      isPreset: true,
      identity: {
        mainInterest: "Fisiologi Olahraga & Performa Atlet",
        shortDescription:
          "Mengeksplorasi kapasitas paru, ambang laktat, dan pengukuran kebugaran atletik dengan wearable.",
        focusQuestion:
          "Bagaimana kapasitas paru-paru dan suplai oksigen memengaruhi daya tahan atlet?",
        learningGoal:
          "Menghubungkan spirometri dengan persamaan Fick VO2 Max dan analitik smartwatch olahraga.",
        relatedInterests: ["VO2 Max", "Kebugaran Kardio", "Wearable Sports Tech"],
        difficultyComfort: "Intermediate",
      },
      inputContext: {
        mode: "mode_a",
        subject: "Biologi (SMA Kelas XI)",
        chapter: "Sistem Pernapasan Manusia",
        subchapters:
          "Organ pernapasan, Mekanisme pernapasan, Pertukaran gas, Kapasitas paru-paru",
        interestDomain: "Fisiologi Olahraga & Performa Atlet",
        targetGoal:
          "Memahami bagaimana kapasitas paru-paru dan suplai oksigen memengaruhi daya tahan atlet serta cara mengukurnya",
      },
      overview: {
        title: "Sistem Pernapasan Manusia · Fisiologi Olahraga",
        startingRegion: "REG-01",
        summary:
          "Menelusuri hubungan kapasitas vital paru dengan daya tahan atlet, mulai dari VO2 Max, ambang laktat, algoritma smartwatch olahraga, sampai pemodelan kinetika oksigen.",
        keyConcepts: [
          "Volume Tidal & Kapasitas Vital Paru",
          "Ventilasi Semenit saat Latihan Fisik",
          "VO2 Max (Persamaan Fick)",
          "Ambang Laktat (Aerobik vs Anaerobik)",
        ],
        coreFormulaOrPrinciple:
          "Kapasitas Vital + Curah Jantung → VO2 Max = Q_max × (CaO2 - CvO2)",
        primaryReference: "McArdle Exercise Physiology 8th Ed. & OpenStax Biology 2e",
      },
      nodes: OLAHRAGA_NODES,
      edges: OLAHRAGA_EDGES,
    },
    ["root", "n_vo2max"]
  ),

  createVerifiedVault(
    {
      id: "vault-preset-kanker",
      name: "Riset Kanker",
      createdAt: "2026-11-12T08:10:00.000Z",
      updatedAt: "2026-11-12T08:10:00.000Z",
      isPreset: true,
      identity: {
        mainInterest: "Dunia Medis, Genetika & Onkologi",
        shortDescription:
          "Jejak biologis dari pembelahan sel normal menuju disregulasi p53, bioinformatika genomik, dan epidemiologi.",
        focusQuestion:
          "Bagaimana sel kanker berkembang dan menyebar di dalam tubuh?",
        learningGoal:
          "Memahami rangkaian konsep mulai dari siklus sel, mutasi DNA, onkogenesis, hingga bioinformatika medis.",
        relatedInterests: ["Genetika Molekuler", "Bioinformatika", "Kesehatan Masyarakat"],
        difficultyComfort: "Advanced",
      },
      inputContext: {
        mode: "mode_b",
        interestDomain: "Dunia Medis, Genetika & Onkologi",
        targetGoal: "Bagaimana Sel Kanker Berkembang di Dalam Tubuh",
        motivation:
          "Ingin memahami rangkaian konsep dari dasar sel hingga bagaimana mutasi genetik memicu pertumbuhan tumor",
      },
      overview: {
        title: "Dari Biologi Sel ke Mekanisme Kanker",
        startingRegion: "REG-01",
        summary:
          "Menelusuri bagaimana sel sehat menjalani siklus pembelahan, mutasi DNA, kegagalan regulasi gen p53, hingga bioinformatika genomik dan kebijakan skrining kesehatan.",
        keyConcepts: [
          "Siklus Sel & Pos Pemeriksaan (Checkpoint)",
          "Replikasi DNA & Mutasi Somatik",
          "Proto-onkogen vs Gen Supresor Tumor (TP53)",
          "Angiogenesis, Invasi & Metastasis",
        ],
        coreFormulaOrPrinciple:
          "Siklus Sel Normal → Mutasi DNA → Gagal Regulasi p53 → Proliferasi Tumor & Angiogenesis",
        primaryReference: "Weinberg, The Biology of Cancer 2nd Ed. & Campbell Biology Ch. 12",
      },
      nodes: KANKER_NODES,
      edges: KANKER_EDGES,
    },
    ["root", "n_regulasi"]
  ),
];
