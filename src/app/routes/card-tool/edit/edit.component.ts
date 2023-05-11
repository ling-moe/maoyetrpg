import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ValidatorFn,
  AbstractControl,
  FormArray,
  ValidationErrors,
} from '@angular/forms';
import { User, AuthService } from '@core';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { map, filter, pairwise, startWith } from 'rxjs/operators';
import { CardToolService } from '../card-tool.service';
import { shuffle, toNumber, zipObject } from 'lodash';
import { MatSelectChange } from '@angular/material/select';
import {
  Bz,
  BzElement,
  FreeSkillNum,
  FreeSkillRecord,
  Job,
  More,
  Name,
  RoleCard,
  RoleJob,
  Skill,
  SkillControl,
  Skselect,
  SkselectKey,
  StatusBar,
  Weapon,
  WeaponsGroup,
} from './types';
import {
  calcCashLevel,
  calcHitAddAndPhysique,
  calcMov,
  liveLevel,
  Time,
  WeaponCategory,
} from './coc-util';
import { EChartsType } from 'echarts/core';
import { echarts } from './echart.config';

@Component({
  selector: 'app-card-tool-Edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
})
export class CardToolEditComponent implements OnInit {
  user!: User;
  avatar?: string;
  jobs: Job[] = [];
  weapons: WeaponsGroup[] = [];
  personChart?: EChartsType;
  @ViewChild('personChart', { static: true })
  chartEle?: ElementRef;
  weaponsColumn = [
    'name',
    'skill',
    'dam',
    'tho',
    'range',
    'round',
    'price',
    'err',
    'time',
    'operation',
  ];
  currentWeapons: Weapon[] = [];
  currentSkills: Skill[] = [];
  skselects!: Skselect;
  freeSkill: FreeSkillRecord = {};
  form = new FormGroup({
    skill: this.fb.array<FormGroup<SkillControl>>([]),
    things: this.fb.array([new FormControl('')]),
    mov: new FormControl(0),
    player: new FormControl(''),
    cash: new FormControl(''),
    level: new FormControl(''),
    assetsDesc: new FormControl(''),
    hp: new FormControl(''),
    mp: new FormControl(''),
    san: new FormControl(''),
  });
  model: RoleCard = {
    job: <RoleJob>{},
    hp: <StatusBar>{},
    mp: <StatusBar>{},
    san: <StatusBar>{},
    attribute: {},
    bz: [],
    elsesk: [],
    jobwt: [],
    health: '',
    mind: '',
    money: [],
    more: <More>{},
    name: <Name>{},
    story: {},
    things: [],
    touniang: '',
    userid: 0,
    weapons: [],
    zdy: [],
  };

  skillArray = this.form.get('skill') as FormArray<FormGroup<SkillControl>>;
  itemArray = this.form.get('things') as FormArray<FormControl<string | null>>;

  skills: Skill[] = [];

  constructor(
    private auth: AuthService,
    private cardToolService: CardToolService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.auth.user().subscribe(user => {
      this.user = user;
      this.personInfoFields = this.createPersonInfoFields();
    });
    this.cardToolService.getJobAndSkill().subscribe(cocConfig => {
      this.jobs = cocConfig.job;
      this.skills = cocConfig.skills;
      this.skselects = cocConfig.skselect[0];
      this.weapons = Object.keys(cocConfig.weapons).map(key => ({
        category: WeaponCategory[key],
        weapons: cocConfig.weapons[key],
      }));
    });
    this.personChart = echarts.init(this.chartEle!.nativeElement);
    this.personChart.resize({ width: 320, height: 350 });
    this.subcribeSkillPoint();
    this.initPersonChart();
  }

  private subcribeSkillPoint() {
    this.skillArray.valueChanges.subscribe(val => {
      this.currentJobSkillPoint = val.reduce((total, cur) => {
        return (total += toNumber(cur.pro ?? 0));
      }, 0);
      this.currentInterestSkillPoint = val.reduce((total, cur) => {
        return (total += toNumber(cur.interest ?? 0));
      }, 0);
    });
  }

  credit() {
    const obj = this.form.getRawValue().skill[0];
    if (!obj) return;
    return (
      toNumber(obj.ini ?? 0) +
      toNumber(obj.grow ?? 0) +
      toNumber(obj.pro ?? 0) +
      toNumber(obj.interest ?? 0)
    );
  }

  live() {
    const obj = this.form.getRawValue().skill[0];
    if (!obj) return;
    const total =
      toNumber(obj.ini ?? 0) +
      toNumber(obj.grow ?? 0) +
      toNumber(obj.pro ?? 0) +
      toNumber(obj.interest ?? 0);
    return liveLevel(total);
  }

  addItem() {
    this.itemArray.push(new FormControl());
  }
  convert(item: AbstractControl): FormControl {
    return item as FormControl;
  }

  iniChange(v: MatSelectChange, item: FormGroup<SkillControl>, type: SkselectKey) {
    const skill = this.skselects[type][0].all;
    item.patchValue({ ini: toNumber(skill[v.value].ini ?? 0) });
  }

  addFreeSkill(v: MatSelectChange, chooseType: FreeSkillNum) {
    this.freeSkill[chooseType]! -= 1;
    this.currentSkills.push(this.skills[v.value]);
    this.skillArray.push(this.initSkillLine(this.skills[v.value], true));
  }

  jobLimitSkill(type: SkselectKey) {
    const skill = this.skselects[type][0].all;
    const limitSkill = this.skselects[type][0][this.jobs[+this.model.name.jobval].job];
    if (limitSkill) {
      return limitSkill.map(num => skill[num.num]);
    }
    return skill;
  }

  chooseSkill(chooseType: FreeSkillNum) {
    if (chooseType === 'all') {
      return this.skills;
    }
    const options = this.jobs[+this.model.name.jobval][chooseType];
    if (chooseType === 'two') {
      return (options[0] as number[]).map(option => this.skills[option]);
    }
    return (options as number[]).map(option => this.skills[option]);
  }

  addWeapon(e: MatSelectChange) {
    this.currentWeapons = [...this.currentWeapons, e.value];
  }

  initSkillLine(skill: Skill, isFree: boolean): FormGroup<SkillControl> {
    const formGroup = this.fb.group({
      num: [toNumber(skill.num ?? 0)],
      name: [{ value: skill.name, disabled: !skill.select }],
      ini: [{ value: toNumber(skill.ini ?? 0), disabled: true }],
      grow: [toNumber(skill.grow ?? 0), Validators.min(0)],
      pro: [
        toNumber(skill.pro ?? 0),
        [
          Validators.min(0),
          requiredDynamicMax(
            () => this.totalJobSkillPoint,
            () => this.currentJobSkillPoint
          ),
        ],
      ],
      interest: [
        toNumber(skill.interest ?? 0),
        [
          Validators.min(0),
          requiredDynamicMax(
            () => this.totalInterestSkillPoint,
            () => this.currentInterestSkillPoint
          ),
        ],
      ],
      isFree: [isFree],
    });
    formGroup.controls.pro.valueChanges
      .pipe(startWith(null), pairwise())
      .subscribe(([_, next]) => ((formGroup.controls.pro as any).preValue = next));
    formGroup.controls.interest.valueChanges
      .pipe(startWith(null), pairwise())
      .subscribe(([_, next]) => ((formGroup.controls.interest as any).preValue = next));
    this.form.patchValue({
      mov: calcMov(
        toNumber(this.model.attribute.str ?? 0),
        toNumber(this.model.attribute.dex ?? 0),
        toNumber(this.model.attribute.siz ?? 0),
        toNumber(this.model.attribute.age ?? 0)
      ),
    });
    return formGroup;
  }

  submit() {
    const { str, con, pow, dex, app, siz, int, edu, hp, mp, san } = this.model.attribute;
    const { cash, level, assetsDesc } = this.form.value;
    this.model.attribute.all = 0 + str + con + pow + dex + app + siz + int + edu;
    const hpGroup = hp.split('/');
    const mpGroup = mp.split('/');
    const sanGroup = san.split('/');
    this.model.hp = { have: toNumber(hpGroup[0] ?? 0), total: toNumber(hpGroup[0] ?? 1) };
    this.model.mp = { have: toNumber(mpGroup[0] ?? 0), total: toNumber(mpGroup[0] ?? 1) };
    this.model.san = { have: toNumber(sanGroup[0] ?? 0), total: toNumber(sanGroup[0] ?? 1) };
    this.model.health = this.model.attribute.health;
    this.model.mind = this.model.attribute.mind;
    this.model.job.value = `${this.model.name.jobval}`;
    // TODO 这的技能缺少值
    this.model.bz = this.form
      .get('skill')!
      .value.map(skill => ({ ...skill, bz: true } as unknown as BzElement));
    this.model.job.all = this.form
      .get('skill')!
      .value.filter(skill => skill.isFree)
      .map(skill => ({ ...skill, bz: true } as unknown as Bz));
    this.model.jobwt = [+str, +con, +pow, +dex, +app, +siz, +int, +edu];
    this.model.money = [`${this.credit()}%`, this.live()!, cash!, level!, assetsDesc!];
    this.model.things = this.form.get('things')?.value as string[];
    this.model.weapons = this.currentWeapons.map(weapon => weapon.value);
    this.model.userid = this.user.userid!;
    console.log(this.model);
    this.cardToolService.createRoleCard(this.model).subscribe(res => {
      console.log(res);
    });
  }

  calcRate(item: FormGroup<SkillControl>, sub: number) {
    const skill = item.getRawValue();
    const rate = Math.floor(
      (toNumber(skill.ini ?? 0) +
        toNumber(skill.grow ?? 0) +
        toNumber(skill.pro ?? 0) +
        toNumber(skill.interest ?? 0)) /
        sub
    );
    if (skill.name === '信用评级') {
      this.form.patchValue(calcCashLevel(rate), {
        emitEvent: false,
      });
    }
    return rate;
  }

  modifyAvatar(avatorUrl: string) {
    this.model.name.touxiang = avatorUrl;
  }

  getJobDesc(index: string): string {
    return this.jobs[+index]?.intro.proskill;
  }

  getHonesty(index: string): string {
    return this.jobs[+index]?.intro.honesty;
  }

  getJobSkillPoint(index: string): string {
    return this.jobs[+index]?.intro.propoint ?? '请先选择职业';
  }

  initPersonChart() {
    this.personChart!.setOption({
      legend: {
        data: ['属性分布'],
      },
      radar: {
        indicator: [
          { name: '力量', max: 100 },
          { name: '体质', max: 100 },
          { name: '意志', max: 100 },
          { name: '敏捷', max: 100 },
          { name: '外貌', max: 100 },
          { name: '体型', max: 100 },
          { name: '智力', max: 100 },
          { name: '教育', max: 100 },
        ],
      },
      series: [
        {
          name: '人物属性',
          type: 'radar',
          data: [
            {
              value: [],
              name: '属性分布',
            },
          ],
        },
      ],
    });
  }

  updatePersonChart(props: number[] = []) {
    this.personChart!.setOption({
      series: [
        {
          name: '人物属性',
          type: 'radar',
          data: [
            {
              value: props,
              name: '属性分布',
            },
          ],
        },
      ],
    });
  }

  randomProps() {
    this.form.patchValue(
      zipObject(
        ['str', 'con', 'pow', 'dex', 'app', 'siz', 'int', 'edu'],
        shuffle([40, 50, 50, 50, 60, 60, 70, 80])
      )
    );
  }

  get propsTotal() {
    return ['str', 'con', 'pow', 'dex', 'app', 'siz', 'int', 'edu'].reduce(
      (total, key) => total + toNumber(this.model.attribute[key] ?? 0),
      0
    );
  }

  currentJobSkillPoint = 0;
  currentInterestSkillPoint = 0;

  get totalJobSkillPoint(): number {
    if (!this.model.job) {
      return 0;
    }
    const job = this.jobs[+this.model.name.jobval];
    const formula = job?.pro;
    return formula?.reduce(
      // TODO 存在这种情况 需要询问后解决
      // [
      //   [{ "name": "edu", "num": 2 }],
      //   [
      //     { "name": "str", "num": 2 },
      //     { "name": "dex", "num": 2 }
      //   ]
      // ]
      (total, item) => total + toNumber(this.model.attribute[item[0].name] ?? 0) * item[0].num,
      0
    );
  }

  get totalInterestSkillPoint(): number {
    return toNumber(this.model.attribute.int ?? 0) * 2;
  }

  personInfoFields!: FormlyFieldConfig[];
  createPersonInfoFields(){
    return [
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-6',
            key: 'chartname',
            type: 'input',
            props: {
              label: '姓名',
              placeholder: '你叫什么名字？',
              required: true,
            },
          },
          {
            className: 'col-md-6',
            key: 'sex',
            type: 'input',
            props: {
              label: '性别',
              placeholder: '虽然正常来说只有男或女，可是也保不准有武装直升机？',
              required: true,
            },
          },

          {
            className: 'col-md-6',
            key: 'player',
            type: 'input',
            props: {
              label: '玩家',
              placeholder: '本尊在此',
              required: true,
            },
            defaultValue: this.user?.name
          },
          {
            className: 'col-md-6',
            key: 'ages',
            type: 'input',
            props: {
              label: '年龄',
              placeholder: '您贵庚？',
              required: true,
            },
            hooks: {
              onChanges: (field: FormlyFieldConfig) => {
                field.options?.fieldChanges
                  ?.pipe(filter(e => e.field === field && e.value !== null))
                  .subscribe(e => {
                    this.form.patchValue({
                      mov: calcMov(
                        toNumber(this.model.attribute.str ?? 0),
                        toNumber(this.model.attribute.dex ?? 0),
                        toNumber(this.model.attribute.siz ?? 0),
                        toNumber(this.model.attribute.age ?? 0)
                      ),
                    });
                  });
              },
            },
          },
          {
            className: 'col-md-6',
            key: 'jobval',
            type: 'select',
            props: {
              label: '职业',
              placeholder: '师傅你是做什么工作的？',
              required: true,
              options: this.cardToolService
                .getJobAndSkill()
                .pipe(map(res => res.job.map(job => ({ value: job.value, label: job.job })))),
            },
            hooks: {
              onChanges: (field: FormlyFieldConfig) => {
                field.options?.fieldChanges
                  ?.pipe(filter(e => e.field === field && e.value !== null))
                  .subscribe(e => {
                    const curJob = this.jobs[e.value];
                    this.skillArray.clear();
                    this.freeSkill = {};
                    this.currentSkills = (curJob.skills as number[])
                      .map(skillNum => this.skills[skillNum])
                      .sort((a, b) => a.num - b.num);
                    // 记录剩余可选技能数量
                    if (curJob.fouroTwo.length !== 0) {
                      this.freeSkill.fouroTwo = 2;
                    }
                    if (curJob.fouro.length !== 0) {
                      this.freeSkill.fouro = 1;
                    }
                    if (curJob.two.length !== 0) {
                      this.freeSkill.two = 1;
                    }
                    if (curJob.all !== 0) {
                      this.freeSkill.all = curJob.all;
                    }
                    this.currentSkills
                      .map(skill => this.initSkillLine(skill, false))
                      .forEach(skill => this.skillArray.push(skill));
                  });
              },
            },
          },
          {
            className: 'col-md-6',
            key: 'address',
            type: 'input',
            props: {
              label: '住地',
              placeholder: '你现在住哪?',
              required: true,
            },
          },
          {
            className: 'col-md-6',
            key: 'time',
            type: 'select',
            props: {
              label: '时代',
              placeholder: '你是哪个时代的人啊',
              required: true,
              options: Time,
            },
          },
          {
            className: 'col-md-6',
            key: 'hometown',
            type: 'input',
            props: {
              label: '故乡',
              placeholder: '是M18星云吗？',
              required: true,
            },
          },
        ],
      },
    ];
  }

  personBaseFields: FormlyFieldConfig[] = [
    {
      fieldGroupClassName: 'row',
      hooks: {
        onInit: (field: FormlyFieldConfig) => {
          field.options?.fieldChanges?.subscribe(e => {
            const { str, con, pow, dex, app, siz, int, edu } = this.model.attribute;
            this.updatePersonChart([
              toNumber(str ?? 0),
              toNumber(con ?? 0),
              toNumber(pow ?? 0),
              toNumber(dex ?? 0),
              toNumber(app ?? 0),
              toNumber(siz ?? 0),
              toNumber(int ?? 0),
              toNumber(edu ?? 0),
            ]);
          });
        },
      },
      fieldGroup: [
        {
          className: 'col-sm-3',
          key: 'str',
          type: 'input',
          props: {
            label: '力量',
            required: true,
          },
          hooks: {
            onChanges: (field: FormlyFieldConfig) => {
              field.options?.fieldChanges
                ?.pipe(filter(e => e.field === field && e.value !== null))
                .subscribe(e => {
                  this.form.patchValue({
                    mov: calcMov(
                      toNumber(this.model.attribute.str ?? 0),
                      toNumber(this.model.attribute.dex ?? 0),
                      toNumber(this.model.attribute.siz ?? 0),
                      toNumber(this.model.attribute.age ?? 0)
                    ),
                    ...calcHitAddAndPhysique(
                      toNumber(this.model.attribute.str ?? 0),
                      toNumber(this.model.attribute.siz ?? 0)
                    ),
                  });
                });
            },
          },
        },
        {
          className: 'col-sm-3',
          key: 'con',
          type: 'input',
          props: {
            label: '体质',
            required: true,
          },
          hooks: {
            onChanges: (field: FormlyFieldConfig) => {
              field.options?.fieldChanges
                ?.pipe(filter(e => e.field === field && e.value !== null))
                .subscribe(() => {
                  const t = Math.round(
                    (toNumber(this.model.attribute.con ?? 0) +
                      toNumber(this.model.attribute.siz ?? 0)) /
                      10
                  );
                  this.form.patchValue({
                    hp: `${t}/${t}`,
                  });
                });
            },
          },
        },
        {
          className: 'col-sm-3',
          key: 'siz',
          type: 'input',
          props: {
            label: '体型',
            required: true,
          },
          hooks: {
            onChanges: (field: FormlyFieldConfig) => {
              field.options?.fieldChanges
                ?.pipe(filter(e => e.field === field && e.value !== null))
                .subscribe(e => {
                  const t = Math.round(
                    (toNumber(this.model.attribute.con ?? 0) +
                      toNumber(this.model.attribute.siz ?? 0)) /
                      10
                  );
                  this.form.patchValue({
                    hp: `${t}/${t}`,
                    mov: calcMov(
                      toNumber(this.model.attribute.str ?? 0),
                      toNumber(this.model.attribute.dex ?? 0),
                      toNumber(this.model.attribute.siz ?? 0),
                      toNumber(this.model.attribute.age ?? 0)
                    ),
                    ...calcHitAddAndPhysique(
                      toNumber(this.model.attribute.str ?? 0),
                      toNumber(this.model.attribute.siz ?? 0)
                    ),
                  });
                });
            },
          },
        },
        {
          className: 'col-sm-3',
          key: 'dex',
          type: 'input',
          props: {
            label: '敏捷',
            required: true,
          },
          hooks: {
            onChanges: (field: FormlyFieldConfig) => {
              field.options?.fieldChanges
                ?.pipe(filter(e => e.field === field && e.value !== null))
                .subscribe(e => {
                  this.form.patchValue({
                    mov: calcMov(
                      toNumber(this.model.attribute.str ?? 0),
                      toNumber(this.model.attribute.dex ?? 0),
                      toNumber(this.model.attribute.siz ?? 0),
                      toNumber(this.model.attribute.age ?? 0)
                    ),
                  });
                });
            },
          },
        },
        {
          className: 'col-sm-3',
          key: 'app',
          type: 'input',
          props: {
            label: '外貌',
            required: true,
          },
        },
        {
          className: 'col-sm-3',
          key: 'int',
          type: 'input',
          props: {
            label: '智力',
            required: true,
          },
        },
        {
          className: 'col-sm-3',
          key: 'pow',
          type: 'input',
          props: {
            label: '意志',
            required: true,
          },
          hooks: {
            onChanges: (field: FormlyFieldConfig) => {
              field.options?.fieldChanges
                ?.pipe(filter(e => e.field === field && e.value !== null))
                .subscribe(e => {
                  const t = Math.round(toNumber(e.value ?? 0) / 5);
                  this.form.patchValue({
                    mp: `${t}/${t}`,
                    san: `${toNumber(e.value ?? 0)}/99`,
                  });
                });
            },
          },
        },
        {
          className: 'col-sm-3',
          key: 'edu',
          type: 'input',
          props: {
            label: '教育',
            required: true,
          },
        },
        {
          className: 'col-sm-12',
          key: 'luck',
          type: 'input',
          props: {
            label: '幸运',
          },
        },
      ],
    },
  ];

  personAdvanceFields: FormlyFieldConfig[] = [
    {
      fieldGroupClassName: 'row',
      fieldGroup: [
        {
          className: 'col-sm-4',
          key: 'hp',
          type: 'input',
          props: {
            label: '体力',
            required: true,
          },
        },
        {
          className: 'col-sm-4',
          key: 'mp',
          type: 'input',
          props: {
            label: '魔力',
            required: true,
          },
        },
        {
          className: 'col-sm-4',
          key: 'san',
          type: 'input',
          props: {
            label: '理智',
            required: true,
          },
        },
        {
          className: 'col-sm-4',
          key: 'mov',
          type: 'input',
          props: {
            label: '移动',
            required: true,
          },
        },

        {
          className: 'col-sm-4',
          key: 'build',
          type: 'input',
          props: {
            label: '体格',
            required: true,
          },
        },
        {
          className: 'col-sm-4',
          key: 'db',
          type: 'input',
          props: {
            label: '伤害加值',
            required: true,
          },
        },
        {
          className: 'col-sm-12',
          key: 'health',
          type: 'select',
          props: {
            label: '身体状态',
            required: true,
            options: [
              { value: 'health', label: '健康' },
              { value: 'slight', label: '轻伤' },
              { value: 'serious', label: '重伤' },
              { value: 'articulo mortis', label: '濒死' },
              { value: 'death', label: '死亡' },
            ],
          },
          defaultValue: 'health',
        },
        {
          className: 'col-sm-12',
          key: 'mind',
          type: 'select',
          props: {
            label: '精神状态',
            required: true,
            options: [
              { value: 'good', label: '神志清醒' },
              { value: 'alittle', label: '不定性疯狂' },
              { value: 'bad', label: '永久性疯狂' },
            ],
          },
          defaultValue: 'good',
        },
      ],
    },
  ];

  storyFields: FormlyFieldConfig[] = [
    {
      fieldGroup: [
        {
          key: 'miaoshu',
          type: 'textarea',
          props: {
            label: '外貌',
            placeholder: '你长的是什么样子呢',
            autosize: true,
            required: true,
          },
        },
        {
          key: 'xinnian',
          type: 'textarea',
          props: {
            label: '思想',
            placeholder: '信奉的某位神祇，某些思想，某些信念',
            autosize: true,
            required: true,
          },
        },
        {
          key: 'zyzr',
          type: 'textarea',
          props: {
            label: '重要之人',
            placeholder: '家人，爱人，朋友，亦或敌人',
            autosize: true,
            required: true,
          },
        },
        {
          key: 'feifanzd',
          type: 'textarea',
          props: {
            label: '意义非凡之地',
            placeholder: '是了解秘辛的人生转折点，还是与重要之人约定相守之处？',
            autosize: true,
            required: true,
          },
        },
        {
          key: 'bgzw',
          type: 'textarea',
          props: {
            label: '宝贵之物',
            placeholder: '伙计听说你有一个刻着带翼猎犬的护身符？',
            autosize: true,
            required: true,
          },
        },
        {
          key: 'tedian',
          type: 'textarea',
          props: {
            label: '特点',
            placeholder: '嘿你的特点不会只有你的外貌吧',
            autosize: true,
            required: true,
          },
        },
        {
          key: 'bahen',
          type: 'textarea',
          props: {
            label: '伤疤',
            placeholder: '有人把伤疤比作勋章，你怎么认为？',
            autosize: true,
          },
        },
        {
          key: 'kongju',
          type: 'textarea',
          props: {
            label: '精神创伤',
            placeholder: '你可能有恐惧症或狂躁症，这里要求出示医生的诊断证书',
            autosize: true,
          },
        },
        {
          key: 'story',
          type: 'textarea',
          props: {
            label: '过往经历',
            placeholder:
              '尝试解释你的调查员擅长/不擅长某些事情的原因，无论是由于职业、兴趣还是经历。讲述调查员的过去，他与其他人的关系，丰满调查员的形象。PS.字数超过410在角色卡缩略图可能无法完整显示哦',
            autosize: true,
            required: true,
          },
        },
      ],
    },
  ];

  assetsFields: FormlyFieldConfig[] = [
    {
      fieldGroupClassName: 'row',
      fieldGroup: [
        {
          key: 'cash',
          type: 'input',
          className: 'col-md-6',
          props: {
            label: '现金数量',
            placeholder: '你身上有多少钱？',
            required: true,
          },
        },
        {
          key: 'level',
          type: 'input',
          className: 'col-md-6',
          props: {
            label: '消费水平',
            placeholder: '平时住大豪斯开大卡？',
            required: true,
          },
        },
        {
          key: 'assetsDesc',
          type: 'textarea',
          className: 'col-md-12',
          props: {
            label: '资产说明',
            placeholder: '资产说明。对于架空/幻想时代的现金数量/消费水平，玩家请根据KP要求进行修改',
            autosize: true,
            required: true,
          },
        },
      ],
    },
  ];

  careerFields: FormlyFieldConfig[] = [
    {
      fieldGroupClassName: 'row',
      fieldGroup: [
        {
          key: 'jingli',
          type: 'textarea',
          className: 'col-md-4',
          props: {
            label: '调查员经历',
            placeholder: '示例：经历模组【XX】：-5san,+3侦察,-x现金，第一次直面食人魔',
            autosize: true,
            autosizeMinRows: 3,
          },
        },
        {
          key: 'huoban',
          type: 'textarea',
          className: 'col-md-4',
          props: {
            label: '调查员伙伴',
            placeholder: '示例：索菲特 皮全：是皮全家的小公子,和自己都是摄影爱好者',
            autosize: true,
            autosizeMinRows: 3,
          },
        },
        {
          key: 'kesulu',
          type: 'textarea',
          className: 'col-md-4',
          props: {
            label: '克苏鲁神话',
            placeholder: '古籍，魔法相关，第三类接触',
            autosize: true,
            autosizeMinRows: 3,
          },
        },
      ],
    },
  ];
}

function requiredDynamicMax(max: () => number, cur: () => number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = Number(control.value);
    const preValue = toNumber(((control as any) ?? 0).preValue);
    if (v > preValue + (max() - cur())) {
      return { max: { max: preValue + (max() - cur()), actual: control.value } };
    }
    return null;
  };
}
