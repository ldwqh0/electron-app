import request from "./request";
import parseError from "./parseError";
import IpcMainEvent = Electron.IpcMainEvent;

export default function(event: IpcMainEvent, key: string, args: any) {
  request(args).then(r => {
    event.sender.send("response-success", key, {
      status: r.status,
      statusText: r.statusText,
      headers: r.headers,
      data: r.data
    });
  }).catch(e => {
    event.sender.send("response-failure", key, parseError(e));
  });
}
