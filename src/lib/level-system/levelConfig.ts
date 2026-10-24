import { LevelMilestone, SecretReward } from '@/types/aquarium';

export const LEVEL_MILESTONES: LevelMilestone[] = [
  {
    stage: 1,
    levelRange: [1, 100],
    title: 'Baby Fish',
    subtitle: 'Awal Pertemuan dan Langkah Pertama',
    description: 'Candut dan Saridut berukuran mungil dan lincah. Keduanya berenang berdampingan menjelajahi samudera cinta bersama.',
    badge: 'Tahap 1: Bayi Ikan',
    unlockedFeatures: [
      'Bentuk sepasang ikan mungil dan lincah (Stage 1)',
      'Interaksi ketuk kaca akuarium & gelombang riak air',
      'Kirim surat gelembung cinta, pesan suara & kapsul waktu',
    ],
  },
  {
    stage: 2,
    levelRange: [101, 200],
    title: 'Growing Together',
    subtitle: 'Tumbuh Bersama dan Semakin Selaras',
    description: 'Ikan bertumbuh lebih besar dan berenang semakin seirama. Membuka Lencana Mutiara Harmoni 100 dan hadiah bonus persediaan pelet.',
    badge: 'Tahap 2: Tumbuh Bersama',
    unlockedFeatures: [
      'Lencana Mutiara Harmoni 100 & Hadiah +10 Pelet Emas',
      'Evolusi fisik ikan remaja (Stage 2: ukuran bertumbuh +10%)',
      'Pola renang intim: Candut dan Saridut berenang sinkron berdekatan',
    ],
  },
  {
    stage: 3,
    levelRange: [201, 300],
    title: 'Lovely Companions',
    subtitle: 'Aksesoris Pasangan dan Keintiman',
    description: 'Candut dan Saridut mengenakan aksesoris identitas khusus. Topi pelaut minimalis untuk Candut dan sematan flora halus untuk Saridut.',
    badge: 'Tahap 3: Pasangan Manis',
    unlockedFeatures: [
      'Lencana Mutiara Afeksi 200 & Hadiah +15 Pelet Emas',
      'Aksesoris identitas: Topi Pelaut Candut & Sematan Flora Saridut (Stage 3)',
      'Gesture ciuman hidung romantis dengan partikel hati saat berpapasan',
    ],
  },
  {
    stage: 4,
    levelRange: [301, 400],
    title: 'Magical Ocean',
    subtitle: 'Pencahayaan Atmosferik dan Pendar Alami',
    description: 'Tubuh kedua ikan memancarkan aura bioluminesensi magis saat mengarungi kedalaman samudera bersama.',
    badge: 'Tahap 4: Samudera Magis',
    unlockedFeatures: [
      'Lencana Mutiara Samudera 300 & Hadiah +20 Pelet Emas',
      'Evolusi ikan anggun dengan sirip selendang memanjang (Stage 4)',
      'Aura pendaran bioluminesensi neon lembut di tubuh kedua ikan',
    ],
  },
  {
    stage: 5,
    levelRange: [401, 500],
    title: 'Eternal Ocean',
    subtitle: 'Komitmen Abadi dan Puncak Kedewasaan',
    description: 'Pencapaian tertinggi Level 500. Simbol cinta abadi dengan siluet megah, mahkota kerajaan samudra, dan aura keemasan surgawi.',
    badge: 'Tahap 5: Samudera Abadi',
    unlockedFeatures: [
      'Lencana Mutiara Keabadian 500 & Hadiah Puncak +50 Pelet Emas',
      'Evolusi ikan tingkat akhir: Mahkota Raja/Ratu Samudera (Stage 5)',
      'Pendaran aura emas surgawi (Golden Celestial Aura)',
      'Gelar kehormatan tertinggi "The Eternal Couple"',
    ],
  },
];

export function getMilestoneForLevel(level: number): LevelMilestone {
  const boundedLevel = Math.max(1, Math.min(500, level));
  for (const m of LEVEL_MILESTONES) {
    if (boundedLevel >= m.levelRange[0] && boundedLevel <= m.levelRange[1]) {
      return m;
    }
  }
  return LEVEL_MILESTONES[LEVEL_MILESTONES.length - 1];
}

export function getRequiredXpForNextLevel(level: number): number {
  if (level >= 500) return 999999;
  return 60 + level * 20;
}

export const SECRET_REWARDS: SecretReward[] = [
  {
    id: 'secret_02',
    title: 'Interaksi Rahasia 02',
    pellets: 2,
    cooldownHours: 6,
    badge: 'Rahasia 02',
    description: '',
  },
  {
    id: 'secret_03',
    title: 'Interaksi Rahasia 03',
    pellets: 3,
    cooldownHours: 12,
    badge: 'Rahasia 03',
    description: '',
  },
  {
    id: 'secret_04',
    title: 'Interaksi Rahasia 04',
    pellets: 4,
    cooldownHours: 18,
    badge: 'Rahasia 04',
    description: '',
  },
  {
    id: 'secret_05',
    title: 'Interaksi Rahasia 05',
    pellets: 5,
    cooldownHours: 24,
    badge: 'Rahasia 05',
    description: '',
  },
];
