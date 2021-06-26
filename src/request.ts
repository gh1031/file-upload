import { UPLOAD_PROXY } from "./constants";

export default request;

type ResponseType = '' | 'arraybuffer' | 'text' | 'blob' | 'json' | 'document'
interface RequestOption {
  url: string;
  data: any;
  headers: {
    [key: string]: string;
  };
  proxy: string;
  method: 'post' | 'get';
  responseType: ResponseType;
  onDownloadProgress(evt: ProgressEvent): any;
  onUploadProgress(evt: ProgressEvent): any;
}


function request(option: RequestOption) {
  return new Promise(resolve => {
    const {
      url,
      data,
      method,
      proxy = UPLOAD_PROXY,
      headers = {},
      onDownloadProgress,
      onUploadProgress,
    } = option;
    const xhr = new XMLHttpRequest();
    
    xhr.open(method || 'get', `${proxy}${url}`);

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    })

    xhr.onloadend = function () {
      if (this.status >= 200 && this.status < 300) {
        const response = ['', 'text', 'json'].includes(xhr.responseType) ? xhr.responseText : xhr.response;
        return resolve(response);
      };
    }

    xhr.onprogress = function (evt: ProgressEvent) {
      onDownloadProgress && onDownloadProgress(evt)
    }

    xhr.upload.onprogress = function (evt: ProgressEvent) {
      onUploadProgress && onUploadProgress(evt);
    }
    

    xhr.send(data || null);
  })
}
