let instance;
let argv;
let shared_buffer;
let stdin_buffer = new Uint8Array(0);
let shared_int = 0;

function memory() {
  return new Uint8Array(instance.exports.memory.buffer);
}

function write(addr, bytes) {
  for (let i = 0; i < bytes.length; i++)
    memory()[addr + i] = bytes[i];
}

function read(addr, len) {
  let ret = new Uint8Array(len);
  for (let i = 0; i < len; i++)
    ret[i] = memory()[addr + i];
  return ret;
}

function itom(i) {
  return [i & 255, (i >> 8) & 255, (i >> 16) & 255, (i >> 24) & 255];
}

function mtoi(wa) {
  return wa[0] & 255 | ((wa[1] & 255) << 8) | ((wa[2] & 255) << 16) | ((wa[3] & 255) << 24)
}

const importObject = {
  wasi_snapshot_preview1: {
    args_sizes_get: (a, b) => {
      write(a, itom(argv.length));
      write(b, itom(argv.reduce((a, b) => a + 1 + b.length, 0)));
    },
    args_get: (a, b) => {
      for (let arg of argv) {
        write(b, arg);
        write(b + arg.length, [0]);
        write(a, itom(b));
        a += 4;
        b += arg.length + 1;
      }
    },
    fd_close: (a) => { throw (`fd_close: ${a} ${b}`); },
    fd_fdstat_get: (a, b) => {
      if (a == 1) {
        write(b, [2, 158, 1, 0, 255, 127, 0, 0, 209, 0, 32, 8, ...new Uint8Array(12)]);
        return 0;
      }
      console.log("Ignoring fdstat on " + a);
      return -1;
    },
    fd_read: (a, b, c, d) => {
      if (a != 0)
        return -1;
      if (stdin_buffer.length == 0) {
        let aa = new Int32Array(shared_buffer);
        Atomics.wait(aa, 2048, shared_int);
        shared_int = Atomics.load(aa, 2048);
        stdin_buffer = new Uint8Array([...new Uint8Array(shared_buffer, 0, 8192)]);
      }
      let readed = 0;
      for (let i = 0; i < c && stdin_buffer.length > 0; i++) {
        let ptr = mtoi(read(b + i * 8 + 0, 4));
        let len = mtoi(read(b + i * 8 + 4, 4));
        len = Math.min(len, stdin_buffer.length);
        write(ptr, stdin_buffer.slice(0, len));
        stdin_buffer = stdin_buffer.slice(len);
        readed += len;
      }
      write(d, itom(readed));
    },
    fd_seek: (a, b, c, d) => { throw (`fd_seek: ${a} ${b} ${c} ${d}`); },
    fd_write: (a, b, c, d) => {
      let buf = new Uint8Array(0);
      for (let i = 0; i < c; i++) {
        let ptr = mtoi(read(b + i * 8 + 0, 4));
        let len = mtoi(read(b + i * 8 + 4, 4));
        buf = new Uint8Array([...buf, ...read(ptr, len)]);
      }
      write(d, itom(buf.length));
      let text = new TextDecoder().decode(buf);
      if (a == 1 || a == 2) {
        postMessage({ text, fd: a });
        return 0;
      }
      return -1;
    },
    poll_oneoff: (a, b, c, d) => { throw (`poll_oneoff: ${a} ${b} ${c} ${d}`); },
    proc_exit: (a) => {
      postMessage({ exit: a });
      throw "proc_exit";
    },
  }
};

postMessage({ state: "loading" });
addEventListener('message', function(e) {
  if ('buffer' in e.data)
    shared_buffer = e.data.buffer;
  if ('cmd' in e.data) {
    argv = e.data.cmd.map(x => new TextEncoder("utf-8").encode(x));
    WebAssembly.instantiateStreaming(fetch('minimodem.wasm'), importObject)
      .then(o => {
        instance = o.instance;
        postMessage({ state: "run" });
        try {
          instance.exports._start();
        } catch (e) {
          if (e != "proc_exit")
            throw e;
        }
        postMessage({ state: "finished" });
      });
  }
});