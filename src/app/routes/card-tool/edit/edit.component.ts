import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { User, AuthService } from '@core';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { from, Observable, of } from 'rxjs';
import { flatMap, map, mergeMap, switchMap} from 'rxjs/operators';
import { CardToolService } from '../card-tool.service';
import * as echarts from 'echarts';
import { Dictionary, groupBy } from "lodash";

type CardSkill = {type: string, skill: any[]};

@Component({
  selector: 'app-card-tool-Edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
})
export class CardToolEditComponent implements OnInit {
  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  user!: User;
  cdr: any;
  avatar?: string;
  job = [];
  skill: CardSkill[] = [];
  weapons = []
  personChart?: echarts.ECharts
  @ViewChild('personChart', {static: true})
  chartEle?: ElementRef;
  skillColumn = ['name', 'ini', 'grow', 'pro', 'interest'];
  weaponsColumn = ['name','skill','dam','tho','range','round','price','err','time',]

  constructor(private auth: AuthService, private cardToolService: CardToolService) {}

  ngOnInit() {
    this.auth.user().subscribe(user => (this.user = user));
    this.cardToolService.getJobAndSkill().subscribe(res => {
      this.job = res.job;
      this.skill = processSkill(res.skills);
    })
    this.personChart = echarts.init(this.chartEle!.nativeElement);
    this.updatePersonChart()
;
  }
  submit() {
    alert(JSON.stringify(Object.assign(this.model, { avatar: this.avatar })));
  }

  modifyAvatar(avatorUrl: any) {
    this.avatar = avatorUrl;
  }

  getJobDesc(index: number): string{
    return (this.job[index] as any)?.intro.proskill;
  }

  updatePersonChart(){
    this.personChart!.setOption({
      title: {
        text: 'Basic Radar Chart'
      },
      legend: {
        data: ['Allocated Budget', 'Actual Spending']
      },
      radar: {
        // shape: 'circle',
        indicator: [
          { name: 'Sales', max: 6500 },
          { name: 'Administration', max: 16000 },
          { name: 'Information Technology', max: 30000 },
          { name: 'Customer Support', max: 38000 },
          { name: 'Development', max: 52000 },
          { name: 'Marketing', max: 25000 }
        ]
      },
      series: [
        {
          name: 'Budget vs spending',
          type: 'radar',
          data: [
            {
              value: [4200, 3000, 20000, 35000, 50000, 18000],
              name: 'Allocated Budget'
            },
            {
              value: [5000, 14000, 28000, 26000, 42000, 21000],
              name: 'Actual Spending'
            }
          ]
        }
      ]
    });
  }

  form = new FormGroup({});
  model: any = {};
  options: FormlyFormOptions = {};

  baseInfo: FormlyFieldConfig[] = [
    {
      fieldGroup: [
        {
          key: 'name',
          type: 'input',
          props: {
            label: '姓名',
            placeholder: '你叫什么名字？',
            required: true,
          },
        },
        {
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
          key: 'sex',
          type: 'input',
          props: {
            label: '性别',
            placeholder: '虽然正常来说只有男或女，可是也保不准有武装直升机？',
            required: true,
          },
        },
        {
          key: 'job',
          type: 'select',
          props: {
            label: '职业',
            placeholder: '师傅你是做什么工作的？',
            required: true,
            options: this.cardToolService.getJobAndSkill().pipe(map(res => (res.job as any[]).map(job => ({value: job.value, label: job.job}))))
          },
        },
      ],
    },
  ];

  addressInfo: FormlyFieldConfig[] = [
    {
      fieldGroup: [
        {
          key: 'age',
          type: 'input',
          props: {
            label: '年龄',
            placeholder: '您贵庚？',
            required: true,
          },
        },
        {
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
          key: 'address',
          type: 'input',
          props: {
            label: '住地',
            placeholder: '你现在住哪?',
            required: true,
          },
        },
        {
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

  personBaseProps: FormlyFieldConfig[] = [
    {
      fieldGroupClassName: 'row',
      fieldGroup: [
        {
          className: 'col-sm-4',
          key: 'str',
          type: 'input',
          props: {
            label: '力量',
            required: true,
          },
        },
        {
          className: 'col-sm-4',
          key: 'con',
          type: 'input',
          props: {
            label: '体质',
            required: true,
          },
        },
        {
          className: 'col-sm-4',
          key: 'siz',
          type: 'input',
          props: {
            label: '体型',
            required: true,
          },
        },
        {
          className: 'col-sm-4',
          key: 'dex',
          type: 'input',
          props: {
            label: '敏捷',
            required: true,
          },
        },
        {
          className: 'col-sm-4',
          key: 'app',
          type: 'input',
          props: {
            label: '外貌',
            required: true,
          },
        },
        {
          className: 'col-sm-4',
          key: 'int',
          type: 'input',
          props: {
            label: '智力',
            required: true,
          },
        },
        {
          className: 'col-sm-4',
          key: 'pow',
          type: 'input',
          props: {
            label: '意志',
            required: true,
          },
        },
        {
          className: 'col-sm-4',
          key: 'edu',
          type: 'input',
          props: {
            label: '教育',
            required: true,
          },
        },
        {
          className: 'col-sm-4',
          key: 'luck',
          type: 'input',
          props: {
            label: '幸运',
            required: true,
          },
        },
      ],
    },
  ];

  personAdvanceProps: FormlyFieldConfig[] = [
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
          key: 'mov',
          type: 'input',
          props: {
            label: '移动',
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
          className: 'col-sm-4',
          key: 'bodyStatus',
          type: 'select',
          props: {
            label: '身体状态',
            required: true,
            options: [
              {value: "health", label: "健康"},
              {value: "slight", label: "轻伤"},
              {value: "serious", label: "重伤"},
              {value: "articulo mortis", label: "濒死"},
              {value: "death", label: "死亡"},
            ]
          },
        },
        {
          className: 'col-sm-4',
          key: 'mentalStatus',
          type: 'select',
          props: {
            label: '精神状态',
            required: true,
            options: [
              {value: "good", label: "神志清醒"},
              {value: "alittle", label: "不定性疯狂"},
              {value: "bad", label: "永久性疯狂"},
            ]
          },
        },
      ],
    },
  ];
  weaponsProps: FormlyFieldConfig[] = [
    {fieldGroup: [
      {
        key: 'weapons',
        type: 'combobox',
        props: {
          label: '体力',
          multiple: true,
          options: [
            {value: 1, label: 'Knuckles'},

          ]
        },
      },
    ]
    }
  ]

}
function processSkill(skills: any[]): CardSkill[] {
  const dict = groupBy(skills, skill => skill.type as string);
  return Object.keys(dict).map(key => ({type: key, skill: dict[key]} as CardSkill))
}

