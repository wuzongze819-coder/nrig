// ============================================================
// NRIG · 世界与关卡定义（对应 Spec §7-§12）
// 5 个世界 × 9 关（6 训练 + Mini/Mid/Final Boss）= 45 关
// 学习节奏: T1 Discover → T2 Single Skill → T3 Reverse
//          → T4 Mixed → T5 Remove Scaffolding → T6 Fluency
//          → Mini(M2) → Mid(M3) → Final(M4)
// ============================================================

export type LevelType = 'training' | 'mini' | 'mid' | 'final'

export interface LevelDef {
  id: string
  world: number
  idx: number // 1..9
  name: string
  type: LevelType
  desc: string
  count: number // 题目/敌人数量
  need: number // 过关所需正确数
  hearts: number // 允许的失误次数（红心）
  timeLimit: number | null // 每题限时（秒），null = 不限时
  hints: boolean
  cfg: Record<string, unknown> // 世界特定出题参数
}

export interface WorldDef {
  id: number
  name: string
  en: string
  desc: string
  icon: 'pickaxe' | 'lamp' | 'cart' | 'beacon' | 'sword'
  accent: string
  gameplay: string
}

export const WORLDS: WorldDef[] = [
  {
    id: 1,
    name: '位权矿坑',
    en: 'MINING & CONSTRUCTION',
    desc: '采矿、建造、合成。理解数字如何由 数字×位权 构成。',
    icon: 'pickaxe',
    accent: '#c18c4e',
    gameplay: '拆解与建造：在建造台上放置数字方块，让每个位置的 位权 说话。',
  },
  {
    id: 2,
    name: '晶能电站',
    en: 'BINARY CIRCUITS',
    desc: '开关、电路、能量。建立二进制开关直觉与 BIN↔DEC 自动映射。',
    icon: 'lamp',
    accent: '#ffd75e',
    gameplay: '扳动晶体开关：每一盏灯就是一个 bit，点亮正确的组合。',
  },
  {
    id: 3,
    name: '进制交易村',
    en: 'LOGISTICS & GROUPING',
    desc: '分组、装箱、运输。掌握 BIN/OCT/HEX 的三位、四位结构映射。',
    icon: 'cart',
    accent: '#7ec850',
    gameplay: '分拣货物：把 bit 按 3 位或 4 位装箱，贴上正确的 OCT/HEX 标签。',
  },
  {
    id: 4,
    name: '编码遗迹',
    en: 'ENCODING RUINS',
    desc: '探索、密室、解谜。把进制迁移到 RGB、字符编码、日志与权限。',
    icon: 'beacon',
    accent: '#b57ede',
    gameplay: '解读遗迹：颜色、字符、权限背后都是同一套数字表示。',
  },
  {
    id: 5,
    name: '数字堡垒',
    en: 'FORTRESS DEFENSE',
    desc: '扫描、识别、防御。快速完成格式识别、转换与验证。',
    icon: 'sword',
    accent: '#e05a5a',
    gameplay: '守卫城墙：在敌人抵达前算出它身上数字的真实值。',
  },
]

const T = (
  world: number,
  idx: number,
  name: string,
  desc: string,
  cfg: Record<string, unknown>,
  over: Partial<LevelDef> = {},
): LevelDef => ({
  id: `${world}.${idx}`,
  world,
  idx,
  name,
  type: 'training',
  desc,
  count: 6,
  need: 5,
  hearts: 3,
  timeLimit: null,
  hints: true,
  cfg,
  ...over,
})

const B = (
  world: number,
  idx: number,
  name: string,
  type: LevelType,
  desc: string,
  cfg: Record<string, unknown>,
  over: Partial<LevelDef> = {},
): LevelDef => ({
  id: `${world}.${idx}`,
  world,
  idx,
  name,
  type,
  desc,
  count: type === 'mini' ? 5 : type === 'mid' ? 6 : 6,
  need: type === 'mini' ? 4 : 5,
  hearts: type === 'mini' ? 3 : 2,
  timeLimit: type === 'mid' ? 30 : type === 'final' ? 45 : null,
  hints: false,
  cfg,
  ...over,
})

export const LEVELS: LevelDef[] = [
  // ---------------- World 1 位权矿坑 ----------------
  T(1, 1, '数字矿石', '用十进制数字方块建造目标数值。观察每个槽位的位权。', {
    kinds: ['build'], bases: [10], maxValue: 99, weights: true,
  }),
  T(1, 2, '位权矿层', '位权随位置指数增长：1、10、100… 建造三位十进制数。', {
    kinds: ['build'], bases: [10], maxValue: 999, weights: true,
  }),
  T(1, 3, '反向建造', '反向工程：读出矿石墙上数字的十进制值。', {
    kinds: ['read'], bases: [10, 2], maxValue: 63, weights: true,
  }),
  T(1, 4, '镜像矿洞', '混合挑战：二进制与十进制，建造与读取交替出现。', {
    kinds: ['build', 'read'], bases: [10, 2], maxValue: 255, weights: true,
  }),
  T(1, 5, '通用构造台', '任意基数通用构造：OCT 与 HEX 登场，位权标签被撤除一半。', {
    kinds: ['build', 'read'], bases: [8, 16], maxValue: 255, weights: false,
  }),
  T(1, 6, '异域矿脉', '迁移测试域：Base 3/4/5/6/7。通用位值公式 V = Σ dᵢ × bⁱ。', {
    kinds: ['build', 'read'], bases: [3, 4, 5, 6, 7], maxValue: 200, weights: true,
  }),
  B(1, 7, '位权兽', 'mini', 'Mini Boss · 验证 M2 独立掌握。无提示，至少答对 4 题。', {
    kinds: ['build', 'read'], bases: [2, 8, 10, 16], maxValue: 511, weights: true,
  }),
  B(1, 8, '熔炉守卫', 'mid', 'Mid Boss · 验证 M3 流畅度。每题限时 30 秒。', {
    kinds: ['build', 'read'], bases: [2, 8, 16], maxValue: 1023, weights: false,
  }),
  B(1, 9, '基数巨像', 'final', 'Final Boss · 验证 M4 迁移。全新表面：无位权标签 + 异域基数。', {
    kinds: ['build', 'read'], bases: [3, 5, 6, 7, 16], maxValue: 999, weights: false, novel: true,
  }),

  // ---------------- World 2 晶能电站 ----------------
  T(2, 1, '晶体开关', '每盏晶灯是一个 bit：亮=1 灭=0。点亮开关组合出目标能量值。', {
    kinds: ['set'], bits: 4, readout: true,
  }),
  T(2, 2, '能量读取', '读取灯阵的二进制状态，写出它的十进制能量值。', {
    kinds: ['read'], bits: 4, readout: true,
  }),
  T(2, 3, '能量配置', '6 bit 控制柜。配置更大的能量值。', {
    kinds: ['set'], bits: 6, readout: true,
  }),
  T(2, 4, '控制器容量', '8 bit 满载控制器。读取与配置交替。', {
    kinds: ['set', 'read'], bits: 8, readout: true,
  }),
  T(2, 5, '黑暗控制室', '脚手架撤除：数值读数被关闭，只靠位权直觉配置 8 bit。', {
    kinds: ['set'], bits: 8, readout: false,
  }),
  T(2, 6, '电网负载', '流畅度训练：8 bit 读写混合，追求又快又准。', {
    kinds: ['set', 'read'], bits: 8, readout: false,
  }),
  B(2, 7, '晶能哨兵', 'mini', 'Mini Boss · 验证 M2。无提示，至少答对 4 题。', {
    kinds: ['set', 'read'], bits: 8, readout: false,
  }),
  B(2, 8, '电网守卫', 'mid', 'Mid Boss · 10 bit 电网，限时 30 秒。', {
    kinds: ['set', 'read'], bits: 10, readout: false,
  }),
  B(2, 9, '反应堆核心', 'final', 'Final Boss · 12 bit 反应堆全负载，限时 45 秒，验证 M4。', {
    kinds: ['set', 'read'], bits: 12, readout: false, novel: true,
  }),

  // ---------------- World 3 进制交易村 ----------------
  T(3, 1, '四格货箱', '4 个 bit 装一箱 = 1 位 HEX。给货箱贴上正确的十六进制标签。', {
    kinds: ['bin2hex'], bits: 4,
  }),
  T(3, 2, 'HEX 发货', '8 bit 分两组装箱，发出完整的两位 HEX 货物。', {
    kinds: ['bin2hex'], bits: 8,
  }),
  T(3, 3, 'HEX 到货', '反向卸货：把 HEX 标签拆回二进制 bit。', {
    kinds: ['hex2bin'], bits: 8,
  }),
  T(3, 4, '三格码头', '3 个 bit 装一箱 = 1 位 OCT。三位一组的世界。', {
    kinds: ['bin2oct'], bits: 9,
  }),
  T(3, 5, '对齐工坊', '货箱不满要补零：先向左对齐补位，再分组贴标。', {
    kinds: ['pad'], bits: 7,
  }),
  T(3, 6, '多港物流', 'OCT 与 HEX 混流。BIN↔OCT、BIN↔HEX 双向切换。', {
    kinds: ['bin2hex', 'bin2oct', 'hex2bin', 'oct2bin'], bits: 8,
  }),
  B(3, 7, '轨道监察者', 'mini', 'Mini Boss · 验证 M2 分组映射。无提示，至少答对 4 题。', {
    kinds: ['bin2hex', 'bin2oct', 'hex2bin'], bits: 8,
  }),
  B(3, 8, '港口调度官', 'mid', 'Mid Boss · 12 bit 长列车，限时 30 秒。', {
    kinds: ['bin2hex', 'bin2oct', 'hex2bin', 'oct2bin'], bits: 12,
  }),
  B(3, 9, '进制巨商', 'final', 'Final Boss · OCT↔HEX 跨港直达（经由 BIN），全新贸易文书表面。', {
    kinds: ['oct2hex', 'hex2oct', 'pad'], bits: 12, novel: true,
  }),

  // ---------------- World 4 编码遗迹 ----------------
  T(4, 1, '彩色祭坛', 'RGB 通道是两位 HEX。读出祭坛光束颜色的 #RRGGBB 编码。', {
    kinds: ['hex2rgb'],
  }),
  T(4, 2, '字符石板', '字符编码：ASCII_CORE 石板上的字符对应哪个数值？', {
    kinds: ['char'],
  }),
  T(4, 3, '故障日志室', '遗迹日志混杂 0x/0o/0b 前缀。识别格式并读出数值。', {
    kinds: ['format'],
  }),
  T(4, 4, '权限密室', 'rwx 权限三元组 = 3 bit = 1 位八进制。解开密室门锁。', {
    kinds: ['perm'],
  }),
  T(4, 5, '表示选择实验室', '同一数值的不同表示。找出与目标等价的表示。', {
    kinds: ['equiv'],
  }),
  T(4, 6, '深层遗迹', '深层混合：颜色、字符、权限、日志全面复苏。', {
    kinds: ['hex2rgb', 'rgb2hex', 'char', 'perm', 'format'],
  }),
  B(4, 7, '石门守卫', 'mini', 'Mini Boss · 验证 M2 应用编码。无提示，至少答对 4 题。', {
    kinds: ['hex2rgb', 'char', 'perm'],
  }),
  B(4, 8, '遗迹中枢', 'mid', 'Mid Boss · 限时 30 秒解读遗迹中枢。', {
    kinds: ['rgb2hex', 'char', 'perm', 'format', 'equiv'],
  }),
  B(4, 9, '编码守护者', 'final', 'Final Boss · 前所未见的编码表面，验证 M4 迁移。', {
    kinds: ['rgb2hex', 'char', 'perm', 'format', 'equiv'], novel: true,
  }),

  // ---------------- World 5 数字堡垒 ----------------
  T(5, 1, '扫描敌人', '扫描逼近的敌人：识别它身上数字的进制格式。', {
    kinds: ['identify'], bases: [2, 8, 10, 16], maxValue: 255, speed: 1,
  }),
  T(5, 2, '战术路线', '快速换算成十进制，在敌人抵达城墙前开火。', {
    kinds: ['convert'], bases: [2, 8, 16], maxValue: 255, speed: 1,
  }),
  T(5, 3, '战场估算', '合理性检查：两个不同进制的数值，哪个更大？', {
    kinds: ['compare'], bases: [2, 8, 10, 16], maxValue: 511, speed: 1.1,
  }),
  T(5, 4, '双重验证', '等价验证：选出与目标数值相等的表示。', {
    kinds: ['equiv'], bases: [2, 8, 16], maxValue: 1023, speed: 1.2,
  }),
  T(5, 5, '幻象军团', '幻象敌人携带非法数字（如 1021₂）。识别真假目标。', {
    kinds: ['illegal'], bases: [2, 8, 16], maxValue: 511, speed: 1.2,
  }),
  T(5, 6, '最后一夜', '混合夜袭：识别、换算、比较全面开火。', {
    kinds: ['identify', 'convert', 'compare', 'equiv'], bases: [2, 8, 16], maxValue: 1023, speed: 1.35,
  }),
  B(5, 7, '算法傀儡', 'mini', 'Mini Boss · 验证 M2。6 波敌人，守住 3 颗心。', {
    kinds: ['identify', 'convert'], bases: [2, 8, 16], maxValue: 1023, speed: 1.4,
  }, { count: 6, need: 5 }),
  B(5, 8, '堡垒领主', 'mid', 'Mid Boss · 8 波高速军团，限时施压，验证 M3。', {
    kinds: ['convert', 'compare', 'equiv', 'illegal'], bases: [2, 8, 16], maxValue: 2047, speed: 1.7,
  }, { count: 8, need: 7, timeLimit: 25 }),
  B(5, 9, '数字核心异常体', 'final', 'Final Boss · 异常体使用异域基数伪装，10 波决战，验证 M4。', {
    kinds: ['convert', 'compare', 'equiv', 'illegal'], bases: [2, 8, 16, 3, 5, 7], maxValue: 4095, speed: 1.9, novel: true,
  }, { count: 10, need: 8, timeLimit: 25 }),
]

export function getLevel(id: string): LevelDef {
  const l = LEVELS.find((x) => x.id === id)
  if (!l) throw new Error(`unknown level ${id}`)
  return l
}

export function levelsOfWorld(worldId: number): LevelDef[] {
  return LEVELS.filter((l) => l.world === worldId)
}

/** 线性主线顺序索引（0..44） */
export function levelOrder(id: string): number {
  return LEVELS.findIndex((l) => l.id === id)
}

export const BOSS_TYPE_LABEL: Record<LevelType, string> = {
  training: '训练关',
  mini: 'MINI BOSS',
  mid: 'MID BOSS',
  final: 'FINAL BOSS',
}
