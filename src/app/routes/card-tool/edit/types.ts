import { FormControl } from '@angular/forms';

export interface SkillControl {
  num: FormControl<number | null>;
  name: FormControl<string | null>;
  ini: FormControl<number | null>;
  grow: FormControl<number | null>;
  pro: FormControl<number | null>;
  interest: FormControl<number | null>;
  isFree: FormControl<boolean | null>;
}
export interface WeaponsGroup{
  category: string;
  weapons: Weapon[]
}

export interface CocConfig {
  job:      Job[];
  skills:   Skill[];
  skselect: Skselect[];
  weapons:  { [key: string]: Weapon[] };
}

export type FreeSkillNum = keyof Pick<Job, 'fouro' | 'two' | 'fouroTwo' | 'all'>

export type FreeSkillRecord = {
  [key in FreeSkillNum]?: number;
}

export interface Job {
  intro:    Intro;
  job:      JobName;
  pro:      Array<ProFormula[]>;
  skills:   number[];
  fouro:    number[];
  two:      Array<number[]>;
  fouroTwo: number[];
  value:    string;
  all:      number;
}

export interface Intro {
  honesty:  string;
  propoint: string;
  proskill: string;
}

export interface ProFormula {
  name: string;
  num:  number;
}

export interface Skill {
  bz:          number;
  grow:        string;
  ini:         string;
  interest:    string;
  introduce:   string;
  name:        string;
  num:         number;
  pro:         string;
  total:       string;
  type:        Type;
  select:      boolean;
  selectValue: SkselectKey;
}

export enum Type {
  交流 = '交流',
  医疗 = '医疗',
  战斗 = '战斗',
  技能 = '技能',
  探索 = '探索',
  知识 = '知识',
  自定义 = '自定义',
  运动 = '运动',
}

export type SkselectKey = keyof Skselect;

export type JobName = keyof Omit<Gedou, 'all'> | keyof Omit<Jiashi, 'all'> | keyof Omit<Jiyi, 'all'> | keyof Omit<Kexue, 'all'> | keyof Omit<Muyu, 'all'> | keyof Omit<Sheji, 'all'> | keyof Omit<Shengcun, 'all'> | keyof Omit<Waiyu, 'all'>

export type JobSkselect = {
  [key in JobName]: Skill[];
} & {
  all: Skill[];
};

export interface Skselect {
  jiyi:     JobSkselect[];
  muyu:     JobSkselect[];
  waiyu:    JobSkselect[];
  jiashi:   JobSkselect[];
  gedou:    JobSkselect[];
  sheji:    JobSkselect[];
  kexue:    JobSkselect[];
  shengcun: JobSkselect[];
}

export interface Gedou {
  all:          Skill[];
  中介调查员:        SkillNum[];
  精神病院护工:       SkillNum[];
  运动员:          SkillNum[];
  酒保:           SkillNum[];
  '拳击手/摔跤手':    SkillNum[];
  '罪犯-女飞贼(古典)': SkillNum[];
  '除魅师(现代)':    SkillNum[];
  司法人员:         SkillNum[];
  勤杂护工:         SkillNum[];
  '工人-伐木工':     SkillNum[];
  '警方(原作向)-巡警': SkillNum[];
  工会活动家:        SkillNum[];
}


export interface SkillNum {
  both?: number;
  num: number;
}

export interface Jiashi {
  all:         Skill[];
  '罪犯-走私者':    SkillNum[];
  潜水员:         SkillNum[];
  农民:          SkillNum[];
  '飞行员-飞行员':   SkillNum[];
  '飞行员-特技飞行员': SkillNum[];
  '海员-军舰海员':   SkillNum[];
  '海员-民船海员':   SkillNum[];
}

export interface Jiyi {
  all:            Skill[];
  '演员-戏剧演员':      SkillNum[];
  '演员-电影演员':      SkillNum[];
  建筑师:            SkillNum[];
  '作家(原作向)':      SkillNum[];
  '罪犯-欺诈师':       SkillNum[];
  '罪犯-独行罪犯':      SkillNum[];
  '罪犯-赃物贩子':      SkillNum[];
  '罪犯-赝造者':       SkillNum[];
  设计师:            SkillNum[];
  工程师:            SkillNum[];
  艺人:             SkillNum[];
  农民:             SkillNum[];
  赌徒:             SkillNum[];
  '记者(原作向)-调查记者': SkillNum[];
  '记者(原作向)-通讯记者': SkillNum[];
  技师:             SkillNum[];
  音乐家:            SkillNum[];
  超心理学家:          SkillNum[];
  '摄影师-摄影师':      SkillNum[];
  '摄影师-摄影记者':     SkillNum[];
  '警方(原作向)-警探':   SkillNum[];
  私家侦探:           SkillNum[];
  秘书:             SkillNum[];
  间谍:             SkillNum[];
}

export interface Kexue {
  all:         Skill[];
  '精神病医生(古典)': SkillNum[];
  动物训练师:       SkillNum[];
  建筑师:         SkillNum[];
  猎人:          SkillNum[];
  程序员:         SkillNum[];
  潜水员:         SkillNum[];
  '医生(原作向)':   SkillNum[];
  工程师:         SkillNum[];
  法医:          SkillNum[];
  实验室助理:       SkillNum[];
  '工人-伐木工':    SkillNum[];
  '工人-矿工':     SkillNum[];
  护士:          SkillNum[];
  神秘学家:        SkillNum[];
  药剂师:         SkillNum[];
  '摄影师-摄影师':   SkillNum[];
  '摄影师-摄影记者':  SkillNum[];
  '飞行员-飞行员':   SkillNum[];
  淘金客:         SkillNum[];
  精神病学家:       SkillNum[];
  殡葬师:         SkillNum[];
  饲养员:         SkillNum[];
}

export interface Muyu {
  all: ProFormula[];
}

export interface Sheji {
  all:          Skill[];
  '罪犯-女飞贼(古典)': SkillNum[];
  '绅士/淑女':      SkillNum[];
}

export interface Shengcun {
  all:       Skill[];
  登山家:       SkillNum[];
  '海员-军舰海员': SkillNum[];
}

export interface Waiyu {
  all:       ProFormula[];
  '医生(原作向)': SkillNum[];
}

export interface Weapon {
  name:  string;
  skill: string;
  dam:   string;
  tho:   string;
  range: string;
  round: string;
  num:   string;
  price: string;
  err:   string;
  time:  Time;
  value: number;
}

export enum Time {
  Empty = '',
  The1920S = '1920s',
  The1920S现代 = '1920s，现代',
  The1920S稀有 = '1920s稀有',
  二战及以后 = '二战及以后',
  现代 = '现代',
  稀有 = '稀有',
}

export interface RoleCard {
  job:       RoleJob;
  hp:        StatusBar;
  mp:        StatusBar;
  san:       StatusBar;
  attribute: { [key: string]: string };
  bz:        BzElement[];
  elsesk:    any[];
  jobwt:     number[];
  health:    string;
  mind:      string;
  money:     string[];
  more:      More;
  name:      Name;
  story:     { [key: string]: string };
  things:    string[];
  touniang:  string;
  userid:    number;
  weapons:   number[];
  zdy:       any[];
}

export interface BzElement {
  bz:           boolean | number;
  grow:         string;
  ini:          string;
  interest:     string;
  name:         string;
  num:          number;
  pro:          string;
  select:       boolean;
  selectIndex?: string;
}

export interface StatusBar {
  have:  number;
  total: number;
}

export interface RoleJob {
  value: string;
  all:   Bz[];
}

export interface Bz {
  bz:           boolean;
  grow:         string;
  interest:     string;
  num:          number;
  pro:          string;
  type:         string;
  select:       boolean;
  selectValue:  string;
  name?:        string;
  total?:       string;
  selectIndex?: string;
}

export interface More {
  huoban: string;
  jingli: string;
  kesulu: string;
}

export interface Name {
  chartname: string;
  player:    string;
  time:      string;
  ages:      string;
  sex:       string;
  address:   string;
  hometown:  string;
  jobval:    string;
  touxiang:  string;
}
