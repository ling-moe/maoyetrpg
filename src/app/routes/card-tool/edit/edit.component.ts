import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { User, AuthService } from '@core';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { Subject } from 'rxjs/internal/Subject';

@Component({
  selector: 'app-card-tool-Edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss']
})
export class CardToolEditComponent implements OnInit, OnDestroy {
  user!: User;
  cdr: any;
  avatorSubject = new Subject<string>();

  constructor(private auth: AuthService) { }
  ngOnDestroy(): void {
    this.avatorSubject.complete();
  }

  ngOnInit() {
    this.auth.user().subscribe(user => (this.user = user));
  }
  submit(){
    alert(JSON.stringify(this.model));
  }

  modifyAvatar(avatorUrl: any){
    this.avatorSubject.next(avatorUrl);
  }

  form = new FormGroup({});
  model: any = {};
  options: FormlyFormOptions = {};

  baseInfo: FormlyFieldConfig = {
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
          { value: 10, label: '>嬉皮士时期' },
          { value: 11, label: '>蒸汽朋克' },
          { value: 12, label: '>架空历史' },
          { value: 13, label: '>近未来' },
          { value: 14, label: '>远未来' },
          { value: 15, label: '>其他' },
        ],
      },
    },
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
      key: 'sex',
      type: 'input',
      props: {
        label: '性别',
        placeholder: '虽然正常来说只有男或女，可是也保不准有武装直升机？',
        required: true,
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
    {
      key: 'avator',
      type: 'input',
      props: {
        label: '头像',
        placeholder: '这个不能让你看到',
        required: true,
      },
      hide: true,
      defaultValue: this.avatorSubject.asObservable()
    },
  ]};

  fields: FormlyFieldConfig[] = [
    this.baseInfo
  ];

}
