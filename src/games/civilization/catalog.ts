import { techs, civics } from './research';
import { itemReference } from './item-reference';
export { techs, civics };
export { governments, policies, policyAvailable } from './politics';
export const eras = [
  "远古",
  "古典",
  "中世纪",
  "文艺复兴",
  "工业",
  "现代",
  "原子能",
  "信息",
  "未来",
];
export type YieldKey =
  "food" | "production" | "gold" | "science" | "culture" | "faith" | "tourism";
export type Yield = Record<YieldKey, number>;
export const emptyYield = (): Yield => ({
  food: 0,
  production: 0,
  gold: 0,
  science: 0,
  culture: 0,
  faith: 0,
  tourism: 0,
});
export const yieldNames: Record<YieldKey, string> = {
  food: "粮食",
  production: "生产",
  gold: "金币",
  science: "科技",
  culture: "文化",
  faith: "信仰",
  tourism: "旅游",
};
export interface Research {
  id: string;
  name: string;
  cost: number;
  requires: string[];
  effect: string;
  boost: string;
  era: number;
  column: number;
  sourceId?: string;
  source?: string;
  unlocks?: { id: string; name: string; source: string }[];
}
export interface Item {
  id: string;
  name: string;
  cost: number;
  kind: "unit" | "building" | "district" | "wonder" | "project";
  unlock?: string;
  needs?: string;
  description: string;
  icon: string;
  strength?: number;
  moves?: number;
  range?: number;
  domain?: "land" | "sea";
  resource?: "iron" | "horses" | "coal" | "oil";
  yields?: Partial<Yield>;
  housing?: number;
  amenities?: number;
  faithBuy?: boolean;
  repeat?: boolean;
  era?: number;
  unitClass?: 'melee' | 'ranged' | 'anticavalry' | 'cavalry' | 'siege' | 'naval' | 'recon' | 'civilian';
  rangedStrength?: number;
  bombardStrength?: number;
  maintenance?: number;
  source?: string;
  sourceId?: string;
}
const unit = (
  id: string,
  name: string,
  cost: number,
  strength: number,
  moves: number,
  unlock = "",
  extra: Partial<Item> = {},
): Item => ({
  id,
  name,
  cost,
  strength,
  moves,
  unlock,
  kind: "unit",
  icon: strength ? "sword" : "flag",
  description: strength
    ? `战斗力 ${strength} · 移动力 ${moves}`
    : `移动力 ${moves}`,
  ...extra,
});
const building = (
  id: string,
  name: string,
  cost: number,
  description: string,
  extra: Partial<Item> = {},
): Item => ({
  id,
  name,
  cost,
  kind: "building",
  icon: "city",
  description,
  ...extra,
});
export const items: Item[] = [
  unit('slinger', '投石兵', 35, 5, 2, '', {range:1, rangedStrength:15, unitClass:'ranged', era:0, icon:'bow'}),
  unit("settler", "开拓者", 65, 0, 2, "", {
    description: "建立城市；完成时消耗一人口",
    icon: "flag",
  }),
  unit("scout", "侦察兵", 22, 10, 3, "", { icon: "compass" }),
  unit("warrior", "勇士", 30, 20, 2),
  unit("builder", "建造者", 30, 0, 2, "", {
    description: "三次地块改良；政策可增加次数",
    icon: "hammer",
  }),
  unit("trader", "商人", 35, 0, 3, "trade", {
    icon: "trade",
    description: "在己方城市建立持续 24 回合的贸易路线",
  }),
  unit("archer", "弓箭手", 45, 25, 2, "archery", { range: 2, icon: "bow" }),
  unit("sword", "剑士", 65, 36, 2, "ironworking", { resource: "iron" }),
  unit("horse", "骑手", 65, 36, 4, "horseback", { resource: "horses" }),
  unit("catapult", "投石机", 70, 30, 2, "engineering", {
    range: 2,
    icon: "siege",
    description: "攻击城市额外 +15 战斗力",
  }),
  unit("crossbow", "弩手", 90, 45, 2, "machinery", { range: 2, icon: "bow" }),
  unit("musket", "火枪手", 110, 55, 2, "gunpowder"),
  unit("artillery", "炮兵", 160, 70, 2, "steel", { range: 3, icon: "siege" }),
  unit("tank", "坦克", 190, 80, 4, "combustion", { resource: "oil" }),
  unit("galley", "桨帆船", 50, 28, 3, "sailing", {
    domain: "sea",
    icon: "ship",
  }),
  unit("ironclad", "铁甲舰", 150, 65, 4, "steam", {
    domain: "sea",
    resource: "coal",
    icon: "ship",
  }),
  unit("missionary", "传教士", 55, 0, 3, "theology", {
    faithBuy: true,
    icon: "faith",
    description: "使用信仰购买，三次传播宗教",
  }),
  building("monument", "纪念碑", 25, "文化 +2", { yields: { culture: 2 } }),
  building("granary", "粮仓", 30, "粮食 +1，住房 +2", {
    unlock: "pottery",
    yields: { food: 1 },
    housing: 2,
  }),
  building("walls", "远古城墙", 50, "城墙生命 100，城市可远程攻击", {
    unlock: "masonry",
    icon: "shield",
  }),
  building("watermill", "水磨", 45, "河流城市粮食 +1、生产 +2", {
    unlock: "wheel",
    yields: { food: 1, production: 2 },
  }),
  {
    id: "campus",
    name: "学院",
    cost: 55,
    kind: "district",
    unlock: "writing",
    description: "相邻山脉 +1；雨林和区域每2格 +1；礁石、地热 +2",
    icon: "science",
    yields: {},
  },
  building("library", "图书馆", 40, "科技 +2", {
    needs: "campus",
    yields: { science: 2 },
    icon: "science",
  }),
  building("university", "大学", 90, "科技 +4", {
    unlock: "education",
    needs: "library",
    yields: { science: 4 },
    icon: "science",
  }),
  building("lab", "研究实验室", 140, "科技 +6", {
    unlock: "electricity",
    needs: "university",
    yields: { science: 6 },
    icon: "science",
  }),
  {
    id: "holy",
    name: "圣地",
    cost: 50,
    kind: "district",
    unlock: "astrology",
    description: "山脉和自然奇观提供邻接；每2格森林或区域 +1",
    icon: "faith",
    yields: {},
  },
  building("shrine", "祠堂", 35, "信仰 +2、先知点 +1", {
    needs: "holy",
    yields: { faith: 2 },
    icon: "faith",
  }),
  building("temple", "寺庙", 70, "信仰 +4", {
    unlock: "theology",
    needs: "shrine",
    yields: { faith: 4 },
    icon: "faith",
  }),
  {
    id: "commercial",
    name: "商业中心",
    cost: 60,
    kind: "district",
    unlock: "currency",
    description: "金币 +3；河流 +2；贸易容量 +1",
    icon: "gold",
    yields: { gold: 3 },
  },
  building("market", "市场", 45, "金币 +3", {
    needs: "commercial",
    yields: { gold: 3 },
    icon: "gold",
  }),
  building("bank", "银行", 90, "金币 +5", {
    unlock: "banking",
    needs: "market",
    yields: { gold: 5 },
    icon: "gold",
  }),
  {
    id: "harbor",
    name: "港口",
    cost: 60,
    kind: "district",
    unlock: "shipbuilding",
    description: "沿海区域；相邻市中心金币 +2、海洋资源 +1，每2个区域 +1",
    icon: "ship",
    yields: {},
  },
  building("aqueduct", "水渠", 36, "紧邻城市中心及水源；非淡水城市基础住房提高到6，淡水城市住房 +2", {
    kind: 'district',
    unlock: "engineering",
    icon: "food",
  }),
  {
    id: "theater",
    name: "剧院广场",
    cost: 60,
    kind: "district",
    unlock: "drama",
    description: "相邻奇观和娱乐区域文化 +2；每2格区域 +1",
    icon: "culture",
    yields: {},
  },
  building("amphitheater", "圆形剧场", 50, "文化 +2、旅游 +2", {
    needs: "theater",
    yields: { culture: 2, tourism: 2 },
    icon: "culture",
  }),
  building("museum", "博物馆", 100, "文化 +3、旅游 +6", {
    unlock: "humanism",
    needs: "amphitheater",
    yields: { culture: 3, tourism: 6 },
    icon: "culture",
  }),
  {
    id: "industrial",
    name: "工业区",
    cost: 85,
    kind: "district",
    unlock: "apprentice",
    description: "矿山和伐木场每2格 +1；水渠、水坝、运河 +2；采石场及战略资源 +1",
    icon: "production",
    yields: {},
  },
  building("workshop", "工坊", 70, "生产 +3", {
    needs: "industrial",
    yields: { production: 3 },
    icon: "production",
  }),
  building("factory", "工厂", 110, "生产 +5", {
    unlock: "industry",
    needs: "workshop",
    yields: { production: 5 },
    icon: "production",
  }),
  {
    id: "encampment",
    name: "军营",
    cost: 55,
    kind: "district",
    unlock: "bronze",
    description: "生产 +1，新军队获得 3 经验",
    icon: "sword",
    yields: { production: 1 },
  },
  {
    id: "entertainment",
    name: "娱乐中心",
    cost: 60,
    kind: "district",
    unlock: "construction",
    description: "宜居度 +2",
    icon: "happy",
    amenities: 2,
  },
  building("arena", "竞技场", 55, "宜居度 +2、文化 +1", {
    needs: "entertainment",
    amenities: 2,
    yields: { culture: 1 },
    icon: "happy",
  }),
  {
    id: "neighborhood",
    name: "社区",
    cost: 100,
    kind: "district",
    unlock: "urbanization",
    description: "住房 +5，不占专业区域容量",
    icon: "city",
    housing: 5,
  },
  {
    id: "pyramids",
    name: "金字塔",
    cost: 120,
    kind: "wonder",
    unlock: "masonry",
    description: "沙漠地块；建造者次数 +1、文化 +3",
    icon: "wonder",
    yields: { culture: 3, tourism: 3 },
  },
  {
    id: "oracle",
    name: "神谕",
    cost: 130,
    kind: "wonder",
    unlock: "mysticism",
    description: "丘陵地块；伟人点数翻倍、信仰 +3",
    icon: "wonder",
    yields: { faith: 3, tourism: 3 },
  },
  {
    id: "colosseum",
    name: "罗马斗兽场",
    cost: 150,
    kind: "wonder",
    unlock: "construction",
    description: "宜居度 +4、文化 +3",
    icon: "wonder",
    amenities: 4,
    yields: { culture: 3, tourism: 4 },
  },
  {
    id: "libraryWonder",
    name: "大图书馆",
    cost: 170,
    kind: "wonder",
    unlock: "astronomy",
    needs: "library",
    description: "科技 +8、旅游 +4",
    icon: "wonder",
    yields: { science: 8, tourism: 4 },
  },
  {
    id: "spaceport",
    name: "航天中心",
    cost: 210,
    kind: "district",
    unlock: "rocketry",
    description: "太空项目，不占专业区域容量",
    icon: "rocket",
  },
  {
    id: "satellite",
    name: "发射卫星",
    cost: 230,
    kind: "project",
    unlock: "satellites",
    needs: "spaceport",
    description: "科学胜利第一阶段；揭开全部地图",
    icon: "rocket",
  },
  {
    id: "moon",
    name: "登月计划",
    cost: 280,
    kind: "project",
    unlock: "satellites",
    needs: "satellite",
    description: "科学胜利第二阶段；文化进度 +100",
    icon: "rocket",
  },
  {
    id: "mars",
    name: "火星殖民",
    cost: 350,
    kind: "project",
    unlock: "robotics",
    needs: "moon",
    description: "太空竞赛第三阶段；之后仍需系外行星远征",
    icon: "rocket",
  },
  { id:'exoplanet', name:'系外行星远征', cost:2100, kind:'project', unlock:'smartmaterials', needs:'mars', description:'发射后每回合前进1光年；抵达50光年外的目的地才能获胜', icon:'rocket' },
  { id:'laser', name:'拉格朗日激光站', cost:600, kind:'project', unlock:'offworldmission', needs:'exoplanet', description:'每次完成使远征速度增加1光年/回合；可重复', repeat:true, icon:'rocket' },
  {
    id: "festival",
    name: "城市庆典",
    cost: 50,
    kind: "project",
    unlock: "drama",
    description: "获得 30 文化、30 旅游；可重复",
    repeat: true,
    icon: "culture",
  },
  {
    id: "researchProject",
    name: "科研项目",
    cost: 50,
    kind: "project",
    needs: "campus",
    description: "获得 40 科技与 8 科学家点；可重复",
    repeat: true,
    icon: "science",
  },
];
for (const item of items) {
  const reference = itemReference.find(r=>r.id===item.id);
  if (!reference) continue;
  item.sourceId = reference.sourceId;
  item.source = reference.source;
  if (reference.cost !== null) item.cost = reference.cost;
  for (const key of ['strength','rangedStrength','bombardStrength','range','moves','maintenance'] as const) {
    if (key in reference) item[key] = (reference as unknown as Record<string,number>)[key];
  }
  if (item.kind === 'unit') {
    item.unitClass = item.id==='scout' ? 'recon' : ['catapult','artillery'].includes(item.id) ? 'siege' : item.range ? 'ranged' : item.domain==='sea' ? 'naval' : ['horse','tank'].includes(item.id) ? 'cavalry' : item.strength ? 'melee' : 'civilian';
    if (item.strength) item.description = `近战防御 ${item.strength}${item.rangedStrength ? ` · 远程 ${item.rangedStrength}` : ''}${item.bombardStrength ? ` · 轰炸 ${item.bombardStrength}` : ''} · 移动力 ${item.moves}`;
  }
  item.era = [...techs,...civics].find(r=>r.id===item.unlock)?.era ?? 0;
}
export const itemMap = Object.fromEntries(
  items.map((i) => [i.id, i]),
) as Record<string, Item>;
export type PolicyType = "military" | "economic" | "diplomatic" | "wild";
export const policyTypeNames: Record<PolicyType, string> = {
  military: "军事",
  economic: "经济",
  diplomatic: "外交",
  wild: "通配",
};
export interface Government {
  id: string;
  name: string;
  unlock: string;
  slots: PolicyType[];
  description: string;
  source?: string;
  pending?: string;
}
export const civilizations = [
  {
    id: "china",
    name: "华夏",
    leader: "秦始皇",
    color: "#e5c27b",
    ability: "朝代更替",
    description: "尤里卡 / 鼓舞减少 50% 需求，建造者多一次使用次数。",
    cities: ["长安", "洛阳", "成都", "杭州", "南京", "苏州", "武汉"],
  },
  {
    id: "rome",
    name: "罗马",
    leader: "图拉真",
    color: "#c47878",
    ability: "条条大路通罗马",
    description: "新城市免费纪念碑，城市中心自动铺路。",
    cities: ["罗马", "安提乌姆", "库迈", "拉文纳", "奥斯提亚", "阿雷提乌姆"],
  },
  {
    id: "egypt",
    name: "埃及",
    leader: "克娄巴特拉",
    color: "#74c3cb",
    ability: "尼罗河馈赠",
    description: "河流城市生产 +15%，国际贸易额外金币 +2。",
    cities: ["底比斯", "孟菲斯", "赫利奥波利斯", "亚历山大", "阿布辛贝"],
  },
];
export const terrainNames = {
  grass: "草原",
  plain: "平原",
  forest: "森林",
  hill: "丘陵",
  mountain: "山脉",
  water: "水域",
  desert: "沙漠",
};
export const resources: Record<
  string,
  {
    name: string;
    type: "bonus" | "luxury" | "strategic";
    improvement: string;
    unlock?: string;
  }
> = {
  wheat: { name: "小麦", type: "bonus", improvement: "farm" },
  cattle: {
    name: "牲畜",
    type: "bonus",
    improvement: "pasture",
    unlock: "animals",
  },
  horses: {
    name: "马",
    type: "strategic",
    improvement: "pasture",
    unlock: "animals",
  },
  iron: {
    name: "铁",
    type: "strategic",
    improvement: "mine",
    unlock: "bronze",
  },
  spices: {
    name: "香料",
    type: "luxury",
    improvement: "plantation",
    unlock: "irrigation",
  },
  gems: { name: "宝石", type: "luxury", improvement: "mine", unlock: "mining" },
  fish: {
    name: "鱼",
    type: "bonus",
    improvement: "fishery",
    unlock: "sailing",
  },
  coal: {
    name: "煤",
    type: "strategic",
    improvement: "mine",
    unlock: "industry",
  },
  oil: {
    name: "石油",
    type: "strategic",
    improvement: "oilwell",
    unlock: "combustion",
  },
};
export const improvements: Record<
  string,
  { name: string; unlock: string; description: string }
> = {
  farm: { name: "农场", unlock: "", description: "粮食 +2；封建主义后额外 +1" },
  mine: {
    name: "矿山",
    unlock: "mining",
    description: "生产 +2；开采战略与奢侈资源",
  },
  pasture: { name: "牧场", unlock: "animals", description: "粮食 +1、生产 +1" },
  plantation: {
    name: "种植园",
    unlock: "irrigation",
    description: "金币 +2、粮食 +1；提供奢侈资源",
  },
  lumber: {
    name: "伐木场",
    unlock: "construction",
    description: "森林生产 +2",
  },
  fishery: {
    name: "渔船",
    unlock: "sailing",
    description: "水域粮食 +2、金币 +1",
  },
  oilwell: {
    name: "油井",
    unlock: "combustion",
    description: "生产 +2，提供石油",
  },
};
