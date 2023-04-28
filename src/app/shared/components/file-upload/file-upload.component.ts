import { Component, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import ImageEditor from '@uppy/image-editor';
import XHR from '@uppy/xhr-upload';
import * as COS from 'cos-js-sdk-v5';

@Component({
  selector: 'file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadComponent implements OnInit {

   @ViewChild('fileUpload', { static: true })
   fileUpload!: ElementRef;

   @Output()
   avatorUrl = new EventEmitter<string>();

   constructor() {}

   ngOnInit() {
    new Uppy({restrictions: { maxNumberOfFiles: 1 }})
    .use(Dashboard, { inline: true, target: this.fileUpload.nativeElement })
    .use(ImageEditor, { target: Dashboard })
    .use(XHR, { endpoint: 'https://maoyetrpg-1254195378.cos.ap-guangzhou.myqcloud.com/resource/877742e031e3541b54c1e90cda15541d' })
    .on('upload', (data) => {
      const cos = this.initCos();
      console.log(`Starting upload ${id} for files ${fileIDs}`);
  })
    .use(CosUppy, {
      id: 'CosUppy',
      bucket: 'maoyetrpg-1254195378', // bucket id
      region: 'ap-guangzhou', // 所属 区域
      stsUrl: 'https://maoyetrpg.com/api/resource/sts_token', // STS API URL
      protocol: 'https'
  })
    .on('upload-success', (file, response) => {
      console.log(file?.name, response.uploadURL);
      this.avatorUrl.emit(response.uploadURL);
    });
   }
//    cos.uploadFile({
//     Bucket: 'examplebucket-1250000000', /* 填写自己的 bucket，必须字段 */
//     Region: 'COS_REGION',     /* 存储桶所在地域，必须字段 */
//     Key: '1.jpg',              /* 存储在桶里的对象键（例如:1.jpg，a/b/test.txt，图片.jpg）支持中文，必须字段 */
//     Body: file, // 上传文件对象
//     SliceSize: 1024 * 1024 * 5,     /* 触发分块上传的阈值，超过5MB使用分块上传，小于5MB使用简单上传。可自行设置，非必须 */
//     onProgress: function(progressData) {
//         console.log(JSON.stringify(progressData));
//     }
// }, function(err, data) {
//     if (err) {
//       console.log('上传失败', err);
//     } else {
//       console.log('上传成功');
//     }
// });

   initCos(){
    return new COS({
      getAuthorization (options, callback) {
        const url = 'https://maoyetrpg.com/api/resource/sts_token'; // 这里替换成您的服务接口地址
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function (e) {
          const data = JSON.parse((e.target as any).responseText);
          const credentials = data.credentials;
            if (!data || !credentials) return console.error('credentials invalid');
            callback({
                TmpSecretId: credentials.tmpSecretId,
                TmpSecretKey: credentials.tmpSecretKey,
                XCosSecurityToken: credentials.sessionToken,
                StartTime: data.startTime,
                ExpiredTime: data.expiredTime,
            });
        };
        xhr.send();
      }
  });
   }


}

