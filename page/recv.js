// ensure HTTPS
if (location.protocol === 'http:') throw location.protocol = 'https:';

// notify if the browser doesn't support Atomics.wait()
if (!self.Atomics || !self.Atomics.wait)
  throw alert("Browser needs atomics support");

navigator.getUserMedia = (navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia);
if (!navigator.getUserMedia)
  throw alert("getUserMedia not available");

let buffer = new SharedArrayBuffer(8196);
window.AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();
navigator.getUserMedia(
  { audio: true },
  (stream) => {
    const microphone = context.createMediaStreamSource(stream);
    var processor = context.createScriptProcessor(2048);
    processor.onaudioprocess = e => {
      let data = e.inputBuffer.getChannelData(0);
      let enc = new Float32Array(buffer, 0, 2048);
      for (let i = 0; i < data.length; i++)
        enc[i] = data[i];
      let aa = new Int32Array(buffer);
      Atomics.add(aa, 2048, 1);
      Atomics.notify(aa, 2048);
    };
    microphone.connect(processor);
  },
  (err) => { throw alert(`getUserMedia failed: ${err}`); },
);

var worker = new Worker('/wa.js');
worker.postMessage({
  cmd: ["minicom",
    "--rx", "--tx-carrier", "--stdio", "--float-samples",
    "--samplerate=" + context.sampleRate, "30",
  ],
  buffer
});
worker.onmessage = function(e) {
  if ('state' in e.data)
    document.getElementById('state').textContent = `Status: ${e.data.state}`;
  if ('text' in e.data) {
    const output = document.getElementById('output');
    let print = e.data.text;
    while (print.length > 0) {
      if (print[0] == "\n") {
        output.appendChild(document.createElement("br"));
        print = print.substr(1);
      } else {
        let lf = print.indexOf("\n");
        lf = lf == -1 ? print.length : lf;
        let line = print.substr(0, lf);
        print = print.substr(lf);
        let pre = document.createElement("tt");
        pre.textContent = line;
        if (e.data.fd == 2)
          pre.style = 'color: red;';
        output.appendChild(pre);
      }
    }
  }
};

