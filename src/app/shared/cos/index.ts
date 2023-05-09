import Uppy, { BasePlugin, DefaultPluginOptions, SuccessResponse, UppyFile } from '@uppy/core';
import * as COS from 'cos-js-sdk-v5';
import { MD5, enc } from 'crypto-js';

export default class Cos extends BasePlugin {
    bucket: string;
    region: string;
    stsUrl: string;
    protocol: string;
    prefix: string;
    opts: DefaultPluginOptions = {};
    tencentCos?: COS;
    constructor(uppy: Uppy, opts?: DefaultPluginOptions) {
        super(uppy, opts);
        this.id = opts?.id || 'UppyCos';
        this.type = 'example';
        this.uploader = this.uploader.bind(this);
        this.bucket = opts?.bucket || 'test';
        this.region = opts?.region || 'test';
        this.stsUrl = opts?.stsUrl || 'test';
        this.protocol = location.protocol === 'https:' ? 'https:' : 'http:';
        this.prefix = this.protocol + '//' + this.bucket + '.cos.' + this.region + '.myqcloud.com/';
    }

    getOptions(file: any) {
        const overrides = this.uppy.getState().xhrUpload;
        const opts = {
            ...this.opts,
            ...(overrides || {}),
            ...(file.xhrUpload || {}),
            headers: {}
        };
        Object.assign(opts.headers, this.opts.headers);
        if (overrides) {
            Object.assign(opts.headers, overrides.headers);
        }
        if (file.xhrUpload) {
            Object.assign(opts.headers, file.xhrUpload.headers);
        }

        return opts;
    }

    camSafeUrlEncode(str: string) {
        return encodeURIComponent(str)
            .replace(/!/g, '%21')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\*/g, '%2A');
    }

    uploader(fileIDs: string[]): Promise<void> {
        if (fileIDs.length === 0) {
            this.uppy.log('[XHRUpload] No files to upload!');
            return Promise.resolve();
        }
        this.uppy.log('[XHRUpload] Uploading...');

        const files = fileIDs.map((fileID) => this.uppy.getFile(fileID));

        const uploadPromise = this.uploadFiles(files);
        // fileIDs.map((fileID) => this.uppy.removeFile(fileID))
        return uploadPromise;
    }

    uploadFiles(files: any[]): Promise<void> {
        const actions = files.map((file, i) => {
            const current = i + 1;
            const total = file.length;

            if (file.error) {
                return Promise.reject(new Error(file.error));
            } else if (file.isRemote) {
                return Promise.reject(new Error('暂时只支持本地文件上传'));
            } else {
                return this.authorizationAndUpdate(file, current, total);
            }
        });
        return Promise.resolve();
    }

    getTokenUrl(): Promise<COS> {
      const { stsUrl, tencentCos } = this;
      if(tencentCos){
        return Promise.resolve(tencentCos);
      }
      this.tencentCos = new COS({
        getAuthorization (options, callback) {
          const url = stsUrl; // 这里替换成您的服务接口地址
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onload = (e) => {
            const data = JSON.parse((e.target as any).responseText).data.credentials_data;
            const credentials = data.Credentials;
            if (!data || !credentials){
              throw new Error('credentials invalid');
            }
            callback({
                TmpSecretId: credentials.TmpSecretId,
                TmpSecretKey: credentials.TmpSecretKey,
                XCosSecurityToken: credentials.Token,
                StartTime: data.StartTime,
                ExpiredTime: data.ExpiredTime,
            });
          };
          xhr.send();
        }
     });
     return Promise.resolve(this.tencentCos);
    }

    createProgressTimeout(timeout: number, timeoutHandler: (e: Error)=>void) {
        const uppy = this.uppy;
        let isDone = false;

        function onTimedOut() {
            uppy.log(`[XHRUpload] timed out`);
            const error = new Error(`timeout!`);
            timeoutHandler(error);
        }

        let aliveTimer: string | number | NodeJS.Timeout | null | undefined = null;
        function progress() {
            // Some browsers fire another progress event when the upload is
            // cancelled, so we have to ignore progress after the timer was
            // told to stop.
            if (isDone) return;

            if (timeout > 0) {
                if (aliveTimer) clearTimeout(aliveTimer);
                aliveTimer = setTimeout(onTimedOut, timeout);
            }
        }

        function done() {
            uppy.log(`[XHRUpload] timer done`);
            if (aliveTimer) {
                clearTimeout(aliveTimer);
                aliveTimer = null;
            }
            isDone = true;
        }

        return {
            progress,
            done
        };
    }
    validateStatus(status: number) {
        return status >= 200 && status < 300;
    }

    getResponseData(responseText: any, response: any) {

    }

    putFile(file: any, tokenUrl: string, key: string) {
        const timer = this.createProgressTimeout(300000, (error) => {
            xhr.abort();
            this.uppy.emit('upload-error', file, error);
            // reject(error)
        });

        const xhr = new XMLHttpRequest();



        const url = tokenUrl;
        return new Promise((resolve, reject) => {
            xhr.upload.addEventListener('loadstart', (ev) => {
                this.uppy.log(`[XHRUpload] ${file.name} started`);
            });

            xhr.upload.addEventListener('progress', (ev) => {
                this.uppy.log(`[XHRUpload] ${file.name} progress: ${ev.loaded} / ${ev.total}`);
                // Begin checking for timeouts when progress starts, instead of loading,
                // to avoid timing out requests on browser concurrency queue
                timer.progress();

                if (ev.lengthComputable) {
                    this.uppy.emit('upload-progress', file, {
                        uploader: this,
                        bytesUploaded: ev.loaded,
                        bytesTotal: ev.total
                    });
                }
            });
            // TODO need fix success onload to this!
            // xhr.addEventListener('load', (ev) => {
            //     this.uppy.log(`[XHRUpload] ${file.name} finished`)
            //     timer.done()

            //     if (this.validateStatus(ev.target.status, xhr.responseText, xhr)) {
            //         const fakeUploadResp = {
            //             uploadURL:"test",
            //             key: key
            //         }
            //         this.uppy.emit('upload-success', file, fakeUploadResp)
            //         // if (uploadURL) {
            //         //     this.uppy.log(`Download ${file.name} from ${uploadURL}`)
            //         // }
            //         return resolve(file)
            //     } else {
            //         const body = this.getResponseData(xhr.responseText, xhr)
            //         const error = buildResponseError(xhr, opts.getResponseError(xhr.responseText, xhr))

            //         const response = {
            //             status: ev.target.status,
            //             body
            //         }

            //         this.uppy.emit('upload-error', file, error, response)
            //         return reject(error)
            //     }
            // })
            xhr.addEventListener('error', (ev) => {
                this.uppy.log(`[XHRUpload] ${file.name} errored`);
                timer.done();

                const error = xhr.responseText;
                this.uppy.emit('upload-error', file, error);
                return reject(error);
            });


            this.uppy.on('cancel-all', () => {
                timer.done();
                xhr.abort();
                reject(new Error('Upload cancelled'));
            });
            xhr.open('PUT', `${url}/resource`, true);
            xhr.onreadystatechange = (event) => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        const body = this.getResponseData(xhr.responseText, xhr);
                        const fakeUploadResp = {
                            uploadURL: 'test',
                            key
                        };
                        this.uppy.emit('upload-success', file, fakeUploadResp);
                        timer.done();
                        resolve(null);
                    } else {
                        reject(new Error('test'));
                    }
                }
            };
            xhr.send(file.data);
        });
    }

    async authorizationAndUpdate(file: UppyFile, current: any, total: any): Promise<void> {
      const { uppy } = this;
      const fileMd5 = await new Promise((resolve) => {
        const fileReader = new FileReader();
        fileReader.onloadend = (ev) => {
          resolve(
            MD5(enc.Latin1.parse((ev.target!.result) as string)).toString()
          );
        };
        fileReader.readAsBinaryString(file.data);
      });
        return new Promise((resolve, reject) => {
          this.getTokenUrl().then((client) => client.uploadFile({
            Bucket: this.bucket, /* 填写自己的 bucket，必须字段 */
            Region: this.region,     /* 存储桶所在地域，必须字段 */
            Key: `resource/${fileMd5}`,              /* 存储在桶里的对象键（例如:1.jpg，a/b/test.txt，图片.jpg）支持中文，必须字段 */
            Body: file.data, // 上传文件对象
            SliceSize: 1024 * 1024 * 5,     /* 触发分块上传的阈值，超过5MB使用分块上传，小于5MB使用简单上传。可自行设置，非必须 */
        }, function(err, data) {
            if (err) {
              uppy.emit('upload-error', file, err);
              reject(err);
            } else {
              uppy.emit('upload-success', file, {uploadURL: data.Location, status: data.statusCode } as SuccessResponse);
              resolve();
            }
        }));
        });
    }

    install() {
        this.uppy.addUploader(this.uploader);
    }

    uninstall() {
        this.uppy.removeUploader(this.uploader);
    }
}
const i18n = {
    strings: {
        // When `inline: false`, used as the screen reader label for the button that closes the modal.
        closeModal: '关闭模块',
        // Used as the screen reader label for the plus (+) button that shows the “Add more files” screen
        addMoreFiles: '添加更多文件',
        // Used as the header for import panels, e.g., "Import from Google Drive".
        importFrom: '引入来自 %{name}',
        // When `inline: false`, used as the screen reader label for the dashboard modal.
        dashboardWindowTitle: '图片上传窗口（按下 ESC 关闭）',
        // When `inline: true`, used as the screen reader label for the dashboard area.
        dashboardTitle: '图片上传',
        // Shown in the Informer when a link to a file was copied to the clipboard.
        copyLinkToClipboardSuccess: '链接已复制到粘贴板.',
        // Used when a link cannot be copied automatically — the user has to select the text from the
        // input element below this string.
        copyLinkToClipboardFallback: '复制以下网址',
        // Used as the hover title and screen reader label for buttons that copy a file link.
        copyLink: '复制链接',
        // Used as the hover title and screen reader label for file source icons, e.g., "File source: Dropbox".
        fileSource: '文件来源: %{name}',
        // Used as the label for buttons that accept and close panels (remote providers or metadata editor)
        done: '完成',
        // Used as the screen reader label for buttons that remove a file.
        removeFile: '删除文件',
        // Used as the screen reader label for buttons that open the metadata editor panel for a file.
        editFile: '编辑文件',
        // Shown in the panel header for the metadata editor. Rendered as "Editing image.png".
        editing: '正在编辑 %{file}',
        // Text for a button shown on the file preview, used to edit file metadata
        edit: '编辑',
        // Used as the screen reader label for the button that saves metadata edits and returns to the
        // file list view.
        finishEditingFile: '完成文件编辑',
        // Used as the label for the tab button that opens the system file selection dialog.
        myDevice: '本地上传',
        // Shown in the main dashboard area when no files have been selected, and one or more
        // remote provider plugins are in use. %{browse} is replaced with a link that opens the system
        // file selection dialog.
        dropPasteImport: '将文件拖进来, 粘贴, %{browse} 或寻找目录引入',
        // Shown in the main dashboard area when no files have been selected, and no provider
        // plugins are in use. %{browse} is replaced with a link that opens the system
        // file selection dialog.
        dropPaste: '将文件拖进来, 粘贴 or %{browse}',
        // This string is clickable and opens the system file selection dialog.
        browse: '浏览',
        // Used as the hover text and screen reader label for file progress indicators when
        // they have been fully uploaded.
        uploadComplete: '上传完成',
        // Used as the hover text and screen reader label for the buttons to resume paused uploads.
        resumeUpload: '继续上传',
        // Used as the hover text and screen reader label for the buttons to pause uploads.
        pauseUpload: '暂停上传',
        // Used as the hover text and screen reader label for the buttons to retry failed uploads.
        retryUpload: '重试上传',

        // Used in a title, how many files are currently selected
        xFilesSelected: {
            0: '%{smart_count} 文件已选择',
            1: '%{smart_count} 所有文件已选择'
        },

        // @uppy/status-bar strings:
        uploading: '正在上传',
        complete: '完成'
        // ...etc
    }
};
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

  //  initCos(){
  //   return new COS({
  //     getAuthorization (options, callback) {
  //       const url = 'https://maoyetrpg.com/api/resource/sts_token'; // 这里替换成您的服务接口地址
  //       const xhr = new XMLHttpRequest();
  //       xhr.open('GET', url, true);
  //       xhr.onload = function (e) {
  //         const data = JSON.parse((e.target as any).responseText);
  //         const credentials = data.credentials;
  //           if (!data || !credentials) return console.error('credentials invalid');
  //           callback({
  //               TmpSecretId: credentials.tmpSecretId,
  //               TmpSecretKey: credentials.tmpSecretKey,
  //               XCosSecurityToken: credentials.sessionToken,
  //               StartTime: data.startTime,
  //               ExpiredTime: data.expiredTime,
  //           });
  //       };
  //       xhr.send();
  //     }
  // });
  //  }
