import { toNumber } from 'lodash';
import { BzElement, CocConfig, RoleCard } from './types';
export const WeaponCategory: {[key: string]: string} = {
  cg: '常规武器',
  sq: '手枪',
  bbq: '半自动步枪',
  tsq: '突击步枪',
  xdq: '霰弹枪',
  cfq: '冲锋枪',
  jjbq: '狙击步枪',
  jq: '机枪',
  qt: '其它武器',
};

export const Time =[
  { value: 0, label: '1820~1920' },
  { value: 1, label: '1920~1990' },
  { value: 2, label: '1990~2010' },
  { value: 3, label: '2010~至今' },
  { value: 4, label: '文艺复兴时代' },
  { value: 5, label: '英国维多利亚时代' },
  { value: 6, label: '二战时期' },
  { value: 7, label: '中华民国时期' },
  { value: 8, label: '美苏冷战时期' },
  { value: 9, label: '大萧条(禁酒令)时期' },
  { value: 10, label: '嬉皮士时期' },
  { value: 11, label: '蒸汽朋克' },
  { value: 12, label: '架空历史' },
  { value: 13, label: '近未来' },
  { value: 14, label: '远未来' },
  { value: 15, label: '其他' },
];

export function calcCashLevel(assets: number){
    let cash, level;
    if (assets === 0) {
      cash = '15';
      level = '$15';
    } else if (assets < 10) {
      cash = 'CR*40';
      level = '$300';
    } else if (assets < 50) {
      cash = 'CR*100';
      level = '$1500';
    } else if (assets < 90) {
      cash = 'CR*200';
      level = '$7500';
    } else {
      cash = '1.5M';
      level = '$150000';
    }
    return {cash, level};
}

export function calcDbAndBuild(str: number, siz: number) {
  const t = str + siz;
  if (t >= 2 && t <= 64) {
    return { db: '-2', build: -2 };
  } else if (t >= 65 && t <= 84) {
    return { db: '-1', build: -1 };
  } else if (t >= 85 && t <= 124) {
    return { db: '无', build: 0 };
  } else if (t >= 125 && t <= 164) {
    return { db: '+1D4', build: 1 };
  } else if (t >= 165 && t <= 204) {
    return { db: '+1D6', build: 2 };
  } else {
    return { db: '无', build: 0 };
  }
}


export function calcMov(str: number, dex: number, siz: number, age: number): number {
  let mov = 8;
  if (str < siz && dex < siz) {
    mov = 7;
  } else if (str > siz && dex > siz) {
    mov = 9;
  } else {
    mov = 8;
  }
  if (age > 40 && age <= 49) {
    mov -= 1;
  } else if (age > 50 && age <= 59) {
    mov -= 2;
  } else if (age > 60 && age <= 69) {
    mov -= 3;
  } else if (age > 70 && age <= 79) {
    mov -= 4;
  } else if (age > 80 && age <= 89) {
    mov -= 5;
  }
  return mov;
}

export function liveLevel(assets: number){
  if (assets === 0) {
    return '身无分文';
  } else if (assets < 10) {
    return '贫穷';
  } else if (assets < 50) {
    return '标准';
  } else if (assets < 90) {
    return '小康';
  } else if (assets < 99) {
    return '富裕';
  } else {
    return '富豪';
  }
}


export function calcMP(pow: number){
  return Math.round(pow / 5);
}

export function calcSan(pow: number){
  return pow;
}

export function calcCredit(ini: number, grow: number,pro: number,interest: number){
  return ini + grow + pro + interest;
}

export function modelToRoleCard(model: any, config: CocConfig): RoleCard{
  const roleCard: any = model;
  const { str, con, pow, dex, app, siz, int, edu, hp, mp, san } = roleCard.attribute;
  roleCard.attribute.all = 0 + str + con + pow + dex + app + siz + int + edu;
  const hpGroup = hp.split('/');
  const mpGroup = mp.split('/');
  const sanGroup = san.split('/');
  roleCard.hp = { have: toNumber(hpGroup[0] ?? 0), total: toNumber(hpGroup[0] ?? 1) };
  roleCard.mp = { have: toNumber(mpGroup[0] ?? 0), total: toNumber(mpGroup[0] ?? 1) };
  roleCard.san = { have: toNumber(sanGroup[0] ?? 0), total: toNumber(sanGroup[0] ?? 1) };
  roleCard.health = roleCard.attribute.health;
  roleCard.mind = roleCard.attribute.mind;
  roleCard.job.value = `${roleCard.name.jobval}`;
  roleCard.jobwt = [+str, +con, +pow, +dex, +app, +siz, +int, +edu];
  roleCard.money = [`${roleCard.assets.credit}%`, roleCard.assets.live, roleCard.assets.cash, roleCard.assets.level, roleCard.assets.assetsDesc];
  return roleCard as RoleCard;
}

export function roleCardToModel(roleCard: RoleCard): any{
  const model: any = roleCard;
  // model.job.value = roleCard.job.value;
  delete model.hp;
  delete model.mp;
  delete model.san;
  delete model._id;
  // model.cash = roleCard.money[2];
  // model.level = roleCard.money[3];
  delete model.money;
  return model;

}
