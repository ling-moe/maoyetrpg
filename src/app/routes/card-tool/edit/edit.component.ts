import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { TokenService, User } from '@core';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { EChartsType } from 'echarts/core';
import { maxBy, shuffle, toNumber, zipObject } from 'lodash';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { filter, map, pairwise, startWith, switchMap, tap } from 'rxjs/operators';
import { CardToolService } from '../card-tool.service';
import {
  Time,
  WeaponCategory,
  calcCashLevel,
  calcCredit,
  calcDbAndBuild,
  calcMP,
  calcMov,
  calcSan,
  liveLevel,
  roleCardToModel,
} from './coc-util';
import { echarts } from './echart.config';
import {
  Career,
  FreeSkillNum,
  FreeSkillRecord,
  Job,
  RoleCard,
  Skill,
  SkillControl,
  SkillFormGroup,
  Skselect,
  SkselectKey,
  Weapon,
  WeaponsGroup,
} from './types';

@Component({
  selector: 'app-card-tool-Edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardToolEditComponent implements OnInit, OnChanges {
  user?: User;
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
  totalWeapons: Weapon[] = [];
  currentSkills: Skill[] = [];
  skselects!: Skselect;
  freeSkill: FreeSkillRecord = {};
  form = new FormGroup({
    person: new FormGroup({}),
    story: new FormGroup({}),
    attribute: new FormGroup({}),
    assets: new FormGroup({}),
    career: new FormGroup({}),
    skill: this.fb.array<FormGroup<SkillControl>>([]),
    things: this.fb.array([new FormControl()]),
    mov: new FormControl(0),
    cash: new FormControl(''),
    level: new FormControl(''),
    hp: new FormControl(''),
    mp: new FormControl(''),
    san: new FormControl(''),
  });
  model: any = {
    userid: 0,
    person: {},
    attribute: {},
    career: <Career>{},
    story: {},
    things: [],
    assets: {},
  };

  personForm = this.form.get('person') as FormGroup<any>;
  storyForm = this.form.get('story') as FormGroup<any>;
  attributeForm = this.form.get('attribute') as FormGroup<any>;
  assetsForm = this.form.get('assets') as FormGroup<any>;
  careerForm = this.form.get('career') as FormGroup<any>;
  skillArray = this.form.get('skill') as FormArray<FormGroup<SkillControl>>;
  itemArray = this.form.get('things') as FormArray<FormControl<string | null>>;

  skills: Skill[] = [];

  constructor(
    private token: TokenService,
    private cardToolService: CardToolService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dbService: NgxIndexedDBService
  ) {}
  ngOnChanges(changes: SimpleChanges): void {
    console.log(`触发变更检测：${changes}`);
  }

  ngOnInit() {
    this.initForm();
    this.initData();
  }

  submit() {
    const characterCard = {
      ...this.model,
      skill: this.skillArray.value,
      weapon: this.currentWeapons.map(weapon => weapon.value),
      things: this.itemArray.value,
    };
    // this.cardToolService.createRoleCard(this.model).subscribe(res => {
    //   console.log(res);
    // });
    console.log(this.skillArray.value);
    console.log(this.model);
    this.dbService.add('characterCard', characterCard).subscribe(key => {
      console.log('key: ', key);
    });
  }

  initData() {
    // this.activatedRoute.params
    //   .pipe(
    //     filter(params => params.chartid),
    //     map(params => params.chartid as string),
    //     switchMap(chartId => this.cardToolService.detailRoleCard(chartId))
    //   )
    //   .subscribe(roleCard => {
    //     this.options.updateInitialValue?.(roleCardToModel(roleCard));
    //     this.options.resetModel?.();
    //   });
    // this.dbService.getByKey<RoleCard>('characterCard', 14).subscribe(card => {
    //   console.log(JSON.stringify(card));
    //   this.form.patchValue(card as any);
    //   this.currentWeapons = card.weapon.map(i => this.totalWeapons[i]);
    //   card.skill.filter(i => i.freeType).forEach(i => (this.freeSkill[i.freeType]! -= 1));
    // });
  }

  private initForm() {
    // this.user = this.token.simpleUser();
    this.personInfoFields[0].fieldGroup![2].defaultValue = this.user?.name;
    this.cardToolService.getJobAndSkill().subscribe(cocConfig => {
      this.jobs = cocConfig.job;
      this.skills = cocConfig.skills.sort((a, b) => a.num - b.num);
      this.skills
        .map(skill => this.initSkillLine(skill))
        .forEach(skill => this.skillArray.push(skill));
      this.skselects = cocConfig.skselect;
      this.weapons = Object.keys(cocConfig.weapons).map(key => ({
        category: WeaponCategory[key],
        weapons: cocConfig.weapons[key],
      }));
      this.totalWeapons = Object.keys(cocConfig.weapons)
        .map(key => cocConfig.weapons[key])
        .reduce((a, b) => (a as Weapon[]).concat(b));
    });
    this.personChart = echarts.init(this.chartEle!.nativeElement);
    this.personChart.resize();
    window.addEventListener('resize', () => {
      this.personChart?.resize();
    });
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
    return calcCredit(
      toNumber(obj.ini ?? 0),
      toNumber(obj.grow ?? 0),
      toNumber(obj.pro ?? 0),
      toNumber(obj.interest ?? 0)
    );
  }

  live() {
    const obj = this.form.getRawValue().skill[0];
    if (!obj) return;
    return liveLevel(
      calcCredit(
        toNumber(obj.ini ?? 0),
        toNumber(obj.grow ?? 0),
        toNumber(obj.pro ?? 0),
        toNumber(obj.interest ?? 0)
      )
    );
  }

  addItem() {
    this.itemArray.push(new FormControl());
  }
  convert(item: AbstractControl): FormControl {
    return item as FormControl;
  }


  iniChange(v: MatSelectChange, item: SkillFormGroup) {
    const skill = this.skselects[item.options][0].all;
    this.skselects[item.options][0].all[v.value].selected = true;
    item.patchValue({ ini: toNumber(skill[v.value].ini ?? 0) });
  }

  addFreeSkill(v: MatSelectChange, chooseType: FreeSkillNum) {
    this.freeSkill[chooseType]! -= 1;
    this.skills[v.value].bz = true;
    this.skillArray.at(v.value).patchValue({ bz: true, freeType: chooseType });
    this.skillArray.at(v.value).controls.pro.enable({ emitEvent: false });
  }

  removeJobSkill(num: number) {
    this.freeSkill[this.skillArray.at(num).value.freeType!]! += 1;
    this.skillArray.at(num).patchValue({ bz: false, freeType: null });
    this.skillArray.at(num).controls.pro.disable({ emitEvent: false });
  }

  jobLimitSkill(item: SkillFormGroup) {
    const type = item.options;
    const skill = this.skselects[type][0].all;
    let options;
    if (item.value.bz) {
      options = (this.skselects[type][0][this.jobs[+this.model?.person?.jobval]?.job]??[]).map(
        num => skill[num.num]
      );
    } else {
      options = skill;
    }
    options = options.filter(i => !i.selected);
    if(item.value.selectedNum !== null){
      options.unshift(skill[item.value.selectedNum!]);
    }
    return options;
  }

  chooseSkill(chooseType: FreeSkillNum) {
    if (chooseType === 'all') {
      return this.skillArray.value.filter(skill => !skill.bz).map(skill => this.skills[skill.num!]);
    }
    const options = this.jobs[+this.model?.person?.jobval][chooseType];
    if (chooseType === 'two') {
      return (options[0] as number[])
        .filter(option => !this.skillArray.value[option].bz)
        .map(option => this.skills[option]);
    }
    return (options as number[])
      .filter(option => !this.skillArray.value[option].bz)
      .map(option => this.skills[option]);
  }

  addWeapon(e: MatSelectChange) {
    this.currentWeapons = [...this.currentWeapons, e.value];
  }

  jobSkills() {
    return this.skillArray.controls.filter(skill => skill.value.bz);
  }

  interestSkills() {
    console.log('兴趣技能:' + this.skillArray.controls.filter(skill => !skill.value.bz).length);
    return this.skillArray.controls.filter(skill => !skill.value.bz);
  }

  initSkillLine(skill: Skill): SkillFormGroup {
    const formGroup = this.fb.group({
      num: [toNumber(skill.num ?? 0)],
      name: [{ value: skill.name, disabled: !skill.select }],
      ini: [{ value: toNumber(skill.ini ?? 0), disabled: true }],
      grow: [skill.grow === '' ? null : toNumber(skill.grow ?? 0), Validators.min(0)],
      pro: [
        { value: skill.pro === '' ? null : toNumber(skill.pro ?? 0), disabled: true },
        [
          Validators.min(0),
          requiredDynamicMax(
            () => this.totalJobSkillPoint,
            () => this.currentJobSkillPoint
          ),
        ],
      ],
      interest: [
        skill.interest === '' ? null : toNumber(skill.interest ?? 0),
        [
          Validators.min(0),
          requiredDynamicMax(
            () => this.totalInterestSkillPoint,
            () => this.currentInterestSkillPoint
          ),
        ],
      ],
      bz: [skill.bz],
      freeType: <any[]>[null],
      selectedNum: <any[]>[null],
    }) as SkillFormGroup;
    formGroup.controls.pro.valueChanges
      .pipe(startWith(null), pairwise())
      .subscribe(([_, next]) => ((formGroup.controls.pro as any).preValue = next));
    formGroup.controls.interest.valueChanges
      .pipe(startWith(null), pairwise())
      .subscribe(([_, next]) => ((formGroup.controls.interest as any).preValue = next));
    formGroup.controls.selectedNum.valueChanges
      .pipe(pairwise())
      .subscribe(([pre, next]) => {
        if(pre !== next){
          this.skselects[formGroup.options][0].all[pre!].selected = false;
        }
      });

    this.attributeForm.patchValue({
      mov: calcMov(
        toNumber(this.model.attribute.str ?? 0),
        toNumber(this.model.attribute.dex ?? 0),
        toNumber(this.model.attribute.siz ?? 0),
        toNumber(this.model.attribute.age ?? 0)
      ),
    });
    formGroup.options = skill.selectValue;
    return formGroup;
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
    this.model.person.touxiang = avatorUrl;
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
        radius: '60%',
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
    this.attributeForm.patchValue(
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
    if (!this.model?.person?.jobval) {
      return 0;
    }
    const job = this.jobs[+this.model.person.jobval];
    const formula = job?.pro;
    return formula?.reduce((total, item) => {
      const maxItem = maxBy(item, i => toNumber(this.model.attribute[i.name] ?? 0));
      return total + toNumber(this.model.attribute[maxItem!.name] ?? 0) * maxItem!.num;
    }, 0);
  }

  get totalInterestSkillPoint(): number {
    return toNumber(this.model.attribute.int ?? 0) * 2;
  }

  personInfoFields: FormlyFieldConfig[] = [
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
          defaultValue: this.user?.name,
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
                  this.attributeForm.patchValue({
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
                ?.pipe(
                  filter(e => e.field === field && e.value !== null),
                  tap(e => console.log(e))
                )
                .subscribe(e => {
                  const curJob = this.jobs[e.value];
                  this.freeSkill = {};
                  this.skillArray.controls.forEach(control => {
                    control.patchValue(
                      { bz: false, pro: 0, selectedNum: null },
                      { emitEvent: false }
                    );
                    control.controls.pro.disable({ emitEvent: false });
                  });
                  curJob.skills.forEach(skillNum => {
                    this.skillArray.at(skillNum).patchValue({ bz: true }, { emitEvent: false });
                    this.skillArray.at(skillNum).controls.pro.enable({ emitEvent: false });
                  });
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

  personBaseFields: FormlyFieldConfig[] = [
    {
      fieldGroupClassName: 'row',
      hooks: {
        onInit: (field: FormlyFieldConfig) => {
          field.options?.fieldChanges?.subscribe(e => {
            const { str, con, pow, dex, app, siz, int, edu } = this.model.attribute;
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
            type: 'number',
            label: '力量',
            required: true,
          },
          hooks: {
            onChanges: (field: FormlyFieldConfig) => {
              field.options?.fieldChanges
                ?.pipe(filter(e => e.field === field && e.value !== null))
                .subscribe(e => {
                  this.attributeForm.patchValue({
                    mov: calcMov(
                      toNumber(this.model.attribute.str ?? 0),
                      toNumber(this.model.attribute.dex ?? 0),
                      toNumber(this.model.attribute.siz ?? 0),
                      toNumber(this.model.attribute.age ?? 0)
                    ),
                    ...calcDbAndBuild(
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
            type: 'number',
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
            type: 'number',
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
                  this.attributeForm.patchValue({
                    hp: `${t}/${t}`,
                    mov: calcMov(
                      toNumber(this.model.attribute.str ?? 0),
                      toNumber(this.model.attribute.dex ?? 0),
                      toNumber(this.model.attribute.siz ?? 0),
                      toNumber(this.model.attribute.age ?? 0)
                    ),
                    ...calcDbAndBuild(
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
            type: 'number',
            label: '敏捷',
            required: true,
          },
          hooks: {
            onChanges: (field: FormlyFieldConfig) => {
              field.options?.fieldChanges
                ?.pipe(filter(e => e.field === field && e.value !== null))
                .subscribe(e => {
                  this.attributeForm.patchValue({
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
            type: 'number',
            label: '外貌',
            required: true,
          },
        },
        {
          className: 'col-sm-3',
          key: 'int',
          type: 'input',
          props: {
            type: 'number',
            label: '智力',
            required: true,
          },
        },
        {
          className: 'col-sm-3',
          key: 'pow',
          type: 'input',
          props: {
            type: 'number',
            label: '意志',
            required: true,
          },
          hooks: {
            onChanges: (field: FormlyFieldConfig) => {
              field.options?.fieldChanges
                ?.pipe(filter(e => e.field === field && e.value !== null))
                .subscribe(e => {
                  const t = calcMP(toNumber(e.value ?? 0));
                  this.attributeForm.patchValue({
                    mp: `${t}/${t}`,
                    san: `${calcSan(toNumber(e.value ?? 0))}/99`,
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
            type: 'number',
            label: '教育',
            required: true,
          },
        },
        {
          className: 'col-sm-12',
          key: 'luck',
          type: 'input',
          props: {
            type: 'number',
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
      fieldGroupClassName: 'row',
      fieldGroup: [
        {
          key: 'miaoshu',
          type: 'textarea',
          className: 'col-md-12',
          props: {
            label: '外貌',
            placeholder: '你长的是什么样子呢',
            autosize: true,
            required: true,
          },
        },
        {
          key: 'xinnian',
          type: 'input',
          className: 'col-md-6',
          props: {
            label: '思想',
            placeholder: '信奉的某位神祇，某些思想，某些信念',
          },
        },
        {
          key: 'zyzr',
          type: 'input',
          className: 'col-md-6',
          props: {
            label: '重要之人',
            placeholder: '家人，爱人，朋友，亦或敌人',
          },
        },
        {
          key: 'feifanzd',
          type: 'input',
          className: 'col-md-6',
          props: {
            label: '意义非凡之地',
            placeholder: '是了解秘辛的人生转折点，还是与重要之人约定相守之处？',
          },
        },
        {
          key: 'bgzw',
          type: 'input',
          className: 'col-md-6',
          props: {
            label: '宝贵之物',
            placeholder: '伙计听说你有一个刻着带翼猎犬的护身符？',
          },
        },
        {
          key: 'tedian',
          type: 'textarea',
          className: 'col-md-12',
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
          className: 'col-md-12',
          props: {
            label: '伤疤',
            placeholder: '有人把伤疤比作勋章，你怎么认为？',
            autosize: true,
          },
        },
        {
          key: 'kongju',
          type: 'textarea',
          className: 'col-md-12',
          props: {
            label: '精神创伤',
            placeholder: '你可能有恐惧症或狂躁症，这里要求出示医生的诊断证书',
            autosize: true,
          },
        },
        {
          key: 'story',
          type: 'textarea',
          className: 'col-md-12',
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
            placeholder: '示例：经历模组【XX】：-5san,+3侦察,第一次直面食人魔',
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
            placeholder: '示例：索菲特·皮全：是皮全家的小公子,和自己都是摄影爱好者',
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
