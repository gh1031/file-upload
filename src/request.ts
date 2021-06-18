import { UPLOAD_PROXY } from "./constants";

export default request;

interface RequestOption<T> {
  url: string;
  data: any;
  headers: {
    [key: string]: string;
  };
  proxy: string;
  method: 'post' | 'get';
  listeners?: Listeners[];
}

type EventName = keyof XMLHttpRequestEventTargetEventMap;
interface Listeners {
  name: EventName;
  handler(e: ProgressEvent<XMLHttpRequestEventTarget>, ...rest): void;
  options?: {
    [key: string]: any;
  }
}

function addEventListeners(xhr: XMLHttpRequest, listeners: Listeners[], resolve) {
  for (let event of listeners) {
    function withResolveHandler(resolve) {
      return (evt) => {
        event.handler(evt, resolve)
      }
    }
    xhr.addEventListener(event.name, withResolveHandler(resolve), event.options)
  }
}

const defaultListeners: Listeners[] = [
  {
    name: 'load',
    handler(e: ProgressEvent) {

    }
  },
  {
    name: 'progress',
    handler(e: ProgressEvent) {

    }
  }
]

function request<T>(option: RequestOption<T>) {
  return new Promise(resolve => {
    const {
      url,
      data,
      method,
      proxy = UPLOAD_PROXY,
      headers = {},
      listeners = [],
    } = option;
    const xhr = new XMLHttpRequest();
    
    xhr.open(method || 'get', `${proxy}${url}`);

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    })
    
    addEventListeners(xhr, listeners.length ? listeners : defaultListeners, resolve);

    xhr.send(data);
  })
}
