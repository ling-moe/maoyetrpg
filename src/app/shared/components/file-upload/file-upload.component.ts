import { Component, OnInit, ElementRef, ViewChild, Output, EventEmitter, OnDestroy } from '@angular/core';
import Cos from '@shared/cos';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import ImageEditor from '@uppy/image-editor';

@Component({
  selector: 'file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadComponent implements OnInit, OnDestroy {

   @ViewChild('fileUpload', { static: true })
   fileUpload!: ElementRef;

   @Output()
   avatorUrl = new EventEmitter<string>();
   uppy?: Uppy;
   avatar?: string;

   constructor() {}

   ngOnInit() {
    this.uppy = new Uppy({restrictions: { maxNumberOfFiles: 1 }})
    .use(Dashboard, {target: this.fileUpload.nativeElement})
    .use(ImageEditor, { target: Dashboard })
    .use(Cos, {
      bucket: 'maoyetrpg-1254195378', // bucket id
      region: 'ap-guangzhou', // 所属 区域
      stsUrl: 'https://maoyetrpg.com/api/resource/sts_token', // STS API URL
      protocol: 'https'
  })
    .on('upload-success', (file, response) => {
      this.avatar = `https://${response.uploadURL}`;
      this.avatorUrl.emit(this.avatar);
      (this.uppy!.getPlugin('Dashboard') as any).closeModal();
    });
   }

   openDashboard(){
    (this.uppy!.getPlugin('Dashboard') as any).openModal();
   }

   ngOnDestroy(): void {
    this.avatorUrl.complete();
  }
}

