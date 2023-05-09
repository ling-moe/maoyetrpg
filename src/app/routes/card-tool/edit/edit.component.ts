import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  Provider,
  ChangeDetectorRef,
} from '@angular/core';
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
import * as echarts from 'echarts';
import { groupBy, shuffle, zipObject } from 'lodash';
import { MatSelectChange } from '@angular/material/select';

type CardSkill = { type: string; skill: any[] };
type SkillValue = { pro: number; interest: number };

@Component({
  selector: 'app-card-tool-Edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
})
export class CardToolEditComponent implements OnInit {
  user!: User;
  avatar?: string;
  job: any[] = [];
  weapons: any[] = [];
  personChart?: echarts.ECharts;
  @ViewChild('personChart', { static: true })
  chartEle?: ElementRef;
  weaponsColumn = ['name', 'skill', 'dam', 'tho', 'range', 'round', 'price', 'err', 'time', 'operation'];
  currentSkills: any[] = [];
  skselects: any = {};
  freeSkill: any = {};
  constructor(
    private auth: AuthService,
    private cardToolService: CardToolService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  skillForm = new FormGroup({ skill: this.fb.array([]) });
  skillArray = this.skillForm.get('skill') as FormArray;
  itemForm = new FormGroup({ item: this.fb.array([new FormControl()]) });
  itemArray = this.itemForm.get('item') as FormArray;

  skills: any[] = [];

  weaponCategory: any = {
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

  ngOnInit() {
    this.auth.user().subscribe(user => (this.user = user));
    this.cardToolService.getJobAndSkill().subscribe(res => {
      this.job = res.job;
      this.skills = res.skills;
      this.skselects = res.skselect[0];
      this.weapons = Object.keys(res.weapons).map((key: string) => ({
        category: this.weaponCategory[key],
        weapons: res.weapons[key],
      }));
    });
    this.personChart = echarts.init(this.chartEle!.nativeElement);
    this.personChart.resize({ width: 320, height: 350 });
    this.skillArray.valueChanges.subscribe((val: SkillValue[]) => {
      this.currentJobSkillPoint = val.reduce((total, cur) => {
        return (total += Number(cur.pro ?? 0));
      }, 0);
      this.currentInterestSkillPoint = val.reduce((total, cur) => {
        return (total += Number(cur.interest ?? 0));
      }, 0);
    });
    this.initPersonChart();
  }

  credit(){
    const obj = this.skillForm.getRawValue().skill[0] as any;
    if(!obj) return;
    return Number(obj.ini??0)+Number(obj.grow??0)+Number(obj.pro??0)+Number(obj.interest??0);
  }

  live(){
    const obj = this.skillForm.getRawValue().skill[0] as any;
    if(!obj) return;
    const total = Number(obj.ini??0)+Number(obj.grow??0)+Number(obj.pro??0)+Number(obj.interest??0);
    if(total === 0){
      return '身无分文';
    }else if(total < 10){
      return '贫穷';
    }else if(total < 50){
      return '标准';
    }else if(total < 90){
      return '小康';
    }else if(total < 99){
      return '富裕';
    }else{
      return '富豪';
    }
  }



  addItem(){
    this.itemArray.push(new FormControl());
  }
  convert(item: AbstractControl): FormControl{
    return item as FormControl;
  }

  iniChange(v: MatSelectChange, item: any, type: string) {
    const skill = this.skselects[type][0].all as any[];
    item.patchValue({ ini: skill[v.value].ini ?? 0 });
  }

  addFreeSkill(v: MatSelectChange, chooseType: string) {
    this.freeSkill[chooseType] -= 1;
    this.currentSkills.push(this.skills[v.value]);
    this.skillArray.push(this.initSkillLine(this.skills[v.value]));
  }

  jobLimitSkill(type: string) {
    const skill = this.skselects[type][0].all as any[];
    const limitSkill = this.skselects[type][0][(this.job[this.model.job] as any).job] as any[];
    if (limitSkill) {
      return limitSkill.map(num => skill[num.num]);
    }
    return skill;
  }

  chooseSkill(chooseType: string) {
    if (chooseType === 'all') {
      return this.skills;
    }
    const options = (this.job[this.model.job] as any)[chooseType] as number[];
    return options.map(option => this.skills[option]);
  }

  addWeapon(e: MatSelectChange) {
    this.model.weapons = [...this.model.weapons, e.value];
  }

  initSkillLine(skill: any) {
    const formGroup = this.fb.group({
      name: [{ value: skill.name, disabled: !skill.select }],
      ini: [{ value: skill.ini, disabled: true }],
      grow: [skill.grow, Validators.min(0)],
      pro: [
        skill.pro,
        [
          Validators.min(0),
          requiredDynamicMax(
            () => this.totalJobSkillPoint,
            () => this.currentJobSkillPoint
          ),
        ],
      ],
      interest: [
        skill.interest,
        [
          Validators.min(0),
          requiredDynamicMax(
            () => this.totalInterestSkillPoint,
            () => this.currentInterestSkillPoint
          ),
        ],
      ],
    });
    formGroup.controls.pro.valueChanges
      .pipe(startWith(null), pairwise())
      .subscribe(
        ([prev, next]: [number, number]) => ((formGroup.controls.pro as any).preValue = next)
      );
    formGroup.controls.interest.valueChanges
      .pipe(startWith(null), pairwise())
      .subscribe(
        ([prev, next]: [number, number]) => ((formGroup.controls.interest as any).preValue = next)
      );
      this.form.patchValue({
        mov: this.calcMov(
          Number(this.model.str ?? 0),
          Number(this.model.dex ?? 0),
          Number(this.model.siz ?? 0),
          Number(this.model.age ?? 0)
        ),
      });
    return formGroup;
  }

  submit() {
    alert(JSON.stringify(Object.assign(this.model, { avatar: this.avatar })));
  }

  calcRate(item: any, sub: number) {
    const skill = item.getRawValue();
    const rate = Math.floor(
      (Number(skill.ini ?? 0) +
        Number(skill.grow ?? 0) +
        Number(skill.pro ?? 0) +
        Number(skill.interest ?? 0)) /
        sub
    );
    if(skill.name === '信用评级'){
      let cash, level;
      if(rate === 0){
        cash = '15';
        level = '$15';
      }else if(rate < 10){
        cash = 'CR*40';
        level = '$300';
      }else if(rate < 50){
        cash = 'CR*100';
        level = '$1500';
      }else if(rate < 90){
        cash = 'CR*200';
        level = '$7500';
      }else{
        cash = '1.5M';
        level = '$150000';
      }
      this.form.patchValue({
        cash,level
      }, {
        emitEvent: false
      });
    }
    return rate;
  }

  modifyAvatar(avatorUrl: any) {
    this.avatar = avatorUrl;
  }

  getJobDesc(index: number): string {
    return (this.job[index] as any)?.intro.proskill;
  }

  getHonesty(index: number): string {
    return (this.job[index] as any)?.intro.honesty;
  }

  getJobSkillPoint(index: number): string {
    return (this.job[index] as any)?.intro.propoint ?? '请先选择职业';
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

  calcHitAddAndPhysique(str: number, siz: number) {
    const t = str + siz;
    console.log(t);
    if (t >= 2 && t <= 64) {
      return { hitAdd: '-2', physique: -2 };
    } else if (t >= 65 && t <= 84) {
      return { hitAdd: '-1', physique: -1 };
    } else if (t >= 85 && t <= 124) {
      return { hitAdd: '无', physique: 0 };
    } else if (t >= 125 && t <= 164) {
      return { hitAdd: '+1D4', physique: 1 };
    } else if (t >= 165 && t <= 204) {
      return { hitAdd: '+1D6', physique: 2 };
    } else {
      return { hitAdd: '无', physique: 0 };
    }
  }

  calcMov(str: number, dex: number, siz: number, age: number) {
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
  randomProps() {
    this.form.patchValue(
      zipObject(
        ['str', 'con', 'pow', 'dex', 'app', 'siz', 'int', 'edu'],
        shuffle([40, 50, 50, 50, 60, 60, 70, 80])
      )
    );
  }

  get propTotal() {
    return ['str', 'con', 'pow', 'dex', 'app', 'siz', 'int', 'edu'].reduce(
      (total, key) => total + Number(this.model[key] ?? 0),
      0
    );
  }

  currentJobSkillPoint = 0;

  get totalJobSkillPoint(): number {
    if (!this.model.job) {
      return 0;
    }
    const job = this.job[this.model.job] as any;
    const formula = job?.pro as any[];
    return formula?.reduce(
      (total, item) => total + Number(this.model[item[0].name] ?? 0) * item[0].num,
      0
    );
  }

  currentInterestSkillPoint = 0;

  get totalInterestSkillPoint(): number {
    return Number(this.model.int ?? 0) * 2;
  }
  calcChecked(skill: any) {
    const flag = skill.growControl.value || skill.proControl.value || skill.interestControl.value;
    return flag;
  }
  changeChecked($event: any, skill: any) {
    console.log(skill);
  }

  form = new FormGroup({});

  model: any = { currentJobSkillPoint: 0, weapons: [] };
  options: FormlyFormOptions = {};

  personInfoFields: FormlyFieldConfig[] = [
    {
      fieldGroupClassName: 'row',
      fieldGroup: [
        {
          className: 'col-md-6',
          key: 'name',
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
          defaultValue: this.user?.name,
        },
        {
          className: 'col-md-6',
          key: 'age',
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
                    mov: this.calcMov(
                      Number(this.model.str ?? 0),
                      Number(this.model.dex ?? 0),
                      Number(this.model.siz ?? 0),
                      Number(this.model.age ?? 0)
                    ),
                  });
                });
            },
          },
        },
        {
          className: 'col-md-6',
          key: 'job',
          type: 'select',
          props: {
            label: '职业',
            placeholder: '师傅你是做什么工作的？',
            required: true,
            options: this.cardToolService
              .getJobAndSkill()
              .pipe(
                map(res => (res.job as any[]).map(job => ({ value: job.value, label: job.job })))
              ),
          },
          hooks: {
            onChanges: (field: FormlyFieldConfig) => {
              field.options?.fieldChanges
                ?.pipe(filter(e => e.field === field && e.value !== null))
                .subscribe(e => {
                  const curJob = this.job[e.value];
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
                    .map(skill => this.initSkillLine(skill))
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
          key: 'era',
          type: 'select',
          props: {
            label: '时代',
            placeholder: '你是哪个时代的人啊',
            required: true,
            options: [
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
            ],
          },
        },
        {
          className: 'col-md-6',
          key: 'home',
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

  personBaseFields: FormlyFieldConfig[] = [
    {
      fieldGroupClassName: 'row',
      hooks: {
        onInit: (field: FormlyFieldConfig) => {
          field.options?.fieldChanges?.subscribe(e => {
            const { str, con, pow, dex, app, siz, int, edu } = this.model;
            this.updatePersonChart([str, con, pow, dex, app, siz, int, edu]);
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
                    mov: this.calcMov(
                      Number(this.model.str ?? 0),
                      Number(this.model.dex ?? 0),
                      Number(this.model.siz ?? 0),
                      Number(this.model.age ?? 0)
                    ),
                    ...this.calcHitAddAndPhysique(
                      Number(this.model.str ?? 0),
                      Number(this.model.siz ?? 0)
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
                  this.form.patchValue({
                    hp: Math.round(
                      (Number(this.model.con ?? 0) + Number(this.model.siz ?? 0)) / 10
                    ),
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
                  this.form.patchValue({
                    hp: Math.round(
                      (Number(this.model.con ?? 0) + Number(this.model.siz ?? 0)) / 10
                    ),
                    mov: this.calcMov(
                      Number(this.model.str ?? 0),
                      Number(this.model.dex ?? 0),
                      Number(this.model.siz ?? 0),
                      Number(this.model.age ?? 0)
                    ),
                    ...this.calcHitAddAndPhysique(
                      Number(this.model.str ?? 0),
                      Number(this.model.siz ?? 0)
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
                    mov: this.calcMov(
                      Number(this.model.str ?? 0),
                      Number(this.model.dex ?? 0),
                      Number(this.model.siz ?? 0),
                      Number(this.model.age ?? 0)
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
              console.log(field);
              field.options?.fieldChanges
                ?.pipe(filter(e => e.field === field && e.value !== null))
                .subscribe(e => {
                  this.form.patchValue({
                    mp: Math.round(Number(e.value ?? 0) / 5),
                    san: Number(e.value ?? 0),
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
          key: 'physique',
          type: 'input',
          props: {
            label: '体格',
            required: true,
          },
        },
        {
          className: 'col-sm-4',
          key: 'hitAdd',
          type: 'input',
          props: {
            label: '伤害加值',
            required: true,
          },
        },
        {
          className: 'col-sm-12',
          key: 'bodyStatus',
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
          key: 'mentalStatus',
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

  weaponsProps: FormlyFieldConfig[] = [
    {
      fieldGroup: [
        {
          key: 'weapons',
          type: 'select',
          props: {
            label: '武器',
            multiple: true,
            options: [{ value: 1, label: 'Knuckles' }],
          },
        },
      ],
    },
  ];

  storyProps: FormlyFieldConfig[] = [
    {
      fieldGroup: [
        {
          key: 'appearance',
          type: 'textarea',
          props: {
            label: '外貌',
            placeholder: '你长的是什么样子呢',
            autosize: true,
            required: true,
          },
        },
        {
          key: 'thought',
          type: 'textarea',
          props: {
            label: '思想',
            placeholder: '信奉的某位神祇，某些思想，某些信念',
            autosize: true,
            required: true,
          },
        },
        {
          key: 'keyPerson',
          type: 'textarea',
          props: {
            label: '重要之人',
            placeholder: '家人，爱人，朋友，亦或敌人',
            autosize: true,
            required: true,
          },
        },
        {
          key: 'keyLocation',
          type: 'textarea',
          props: {
            label: '意义非凡之地',
            placeholder: '是了解秘辛的人生转折点，还是与重要之人约定相守之处？',
            autosize: true,
            required: true,
          },
        },
        {
          key: 'keyItem',
          type: 'textarea',
          props: {
            label: '宝贵之物',
            placeholder: '伙计听说你有一个刻着带翼猎犬的护身符？',
            autosize: true,
            required: true,
          },
        },
        {
          key: 'feature',
          type: 'textarea',
          props: {
            label: '特点',
            placeholder: '嘿你的特点不会只有你的外貌吧',
            autosize: true,
            required: true,
          },
        },
        {
          key: 'scar',
          type: 'textarea',
          props: {
            label: '伤疤',
            placeholder: '有人把伤疤比作勋章，你怎么认为？',
            autosize: true,
          },
        },
        {
          key: 'trauma',
          type: 'textarea',
          props: {
            label: '精神创伤',
            placeholder: '你可能有恐惧症或狂躁症，这里要求出示医生的诊断证书',
            autosize: true,
          },
        },
        {
          key: 'backgroundStory',
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

  assetsProps: FormlyFieldConfig[] = [
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

  careerProps: FormlyFieldConfig[] = [
    {
      fieldGroupClassName: 'row',
      fieldGroup: [
        {
          key: 'experience',
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
          key: 'partner',
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
          key: 'myth',
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
    const preValue = Number((control as any).preValue ?? 0);
    if (v > preValue + (max() - cur())) {
      return { max: { max: preValue + (max() - cur()), actual: control.value } };
    }
    return null;
  };
}
