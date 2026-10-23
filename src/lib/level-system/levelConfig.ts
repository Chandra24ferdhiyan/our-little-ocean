import { LevelMilestone, SecretReward } from '@/types/aquarium';

export const LEVEL_MILESTONES: LevelMilestone[] = [
  {
    stage: 1,
    levelRange: [1, 100],
    title: 'Baby Fish',
    subtitle: 'Awal Pertemuan dan Langkah Pertama',
    description: 'Candut dan Saridut berukuran ramping dan lincah. Keduanya berenang berdampingan menjelajahi aquarium bersama.',
    badge: 'Tahap 1: Bayi Ikan',
    unlockedFeatures: [
      'Bentuk ikan mungil dan gesit',
      'Dasar aquarium berpasir halus',
      'Interaksi ketuk kaca dan pesan gelembung',
    ],
  },
  {
    stage: 2,
    levelRange: [101, 200],
    title: 'Growing Together',
    subtitle: 'Tumbuh Bersama dan Semakin Selaras',
    description: 'Ikan tampak lebih berisi dan berenang semakin seirama. Tanaman air alami tumbuh rimbun di dasar akuarium.',
    badge: 'Tahap 2: Tumbuh Bersama',
    unlockedFeatures: [
      'Tanaman air bertingkat dengan ayunan dinamis',
      'Pola renang sinkron berdampingan',
      'Formasi riak air berlapis',
    ],
  },
  {
    stage: 3,
    levelRange: [201, 300],
    title: 'Lovely Companions',
    subtitle: 'Aksesoris Khusus dan Keintiman',
    description: 'Candut dan Saridut mengenakan aksesoris identitas khusus. Topi pelaut minimalis untuk Candut dan sematan flora halus untuk Saridut.',
    badge: 'Tahap 3: Pasangan Manis',
    unlockedFeatures: [
      'Aksesoris identitas pada tubuh kedua ikan',
      'Gesture sapaan ciuman hidung saat berpapasan',
      'Dekorasi bebatuan alami sungai',
    ],
  },
  {
    stage: 4,
    levelRange: [301, 400],
    title: 'Magical Ocean',
    subtitle: 'Pencahayaan Atmosferik dan Pendar Alami',
    description: 'Pencahayaan bawah air lembut dengan pendaran halus saat ekor Candut dan Saridut mengayun di kedalaman.',
    badge: 'Tahap 4: Samudera Magis',
    unlockedFeatures: [
      'Aura pendaran halus pada tubuh kedua ikan',
      'Jejak partikel air mikro saat berenang cepat',
      'Refraksi caustics dinamis',
    ],
  },
  {
    stage: 5,
    levelRange: [401, 500],
    title: 'Eternal Ocean',
    subtitle: 'Komitmen Abadi dan Puncak Kedewasaan',
    description: 'Pencapaian tertinggi Level 500. Simbol cinta abadi dengan siluet matang, aksen mahkota halus, dan atmosfer laut terdalam.',
    badge: 'Tahap 5: Samudera Abadi',
    unlockedFeatures: [
      'Tampilan eksklusif ikan tingkat akhir',
      'Aura lembut penanda pencapaian puncak',
      'Atmosfer kedalaman laut penuh kedamaian',
      'Status kehormatan The Eternal Couple',
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
