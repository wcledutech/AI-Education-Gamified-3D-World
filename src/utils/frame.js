// 让出主线程一帧。页面在后台（不可见）时 requestAnimationFrame 会暂停，
// 这里改用消息通道让出，保证加载与模型训练不会卡住。
export function nextFrame() {
  return new Promise((resolve) => {
    if (typeof document !== 'undefined' && document.hidden) {
      const ch = new MessageChannel();
      ch.port1.onmessage = () => resolve();
      ch.port2.postMessage(0);
      return;
    }
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    requestAnimationFrame(finish);
    setTimeout(finish, 60);
  });
}
