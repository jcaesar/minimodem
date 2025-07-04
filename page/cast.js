if (location.protocol === 'http:') throw location.protocol = 'https:';

var samples = new ArrayBuffer(0);
var context = new AudioContext();
var source = context.createBufferSource();
source.buffer = context.createBuffer(1, 2048, context.sampleRate);
var script = context.createScriptProcessor(2048, 1, 1);
script.onaudioprocess = function(audioProcessingEvent) {
  if (samples.byteLength >= 8192) {
    audioProcessingEvent.outputBuffer.copyToChannel(new Float32Array(samples, 0, 2048), 0, 0);
    samples = samples.slice(8192);
  }
};
source.connect(script);
script.connect(context.destination);
var started = false;

var worker = new Worker('wa.js');
worker.onmessage = function(e) {
  if ('data' in e.data) {
    let data = e.data.data;
    let new_samples = new ArrayBuffer(samples.byteLength + data.length);
    let set = new Uint8Array(new_samples);
    set.set(new Uint8Array(samples));
    set.set(data, samples.byteLength);
    samples = new_samples;
  }
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
        let pre = document.createElement("pre");
        pre.textContent = line;
        output.appendChild(pre);
      }
    }
  }
};
document.getElementById("trigger").addEventListener("click", e => {
  if (!started) {
    started = true;
    source.start();
  }
  let args = document.getElementById('args').value.split(' ');
  worker.postMessage({
    cmd: ["mimo",
      "--tx", "--tx-carrier", "--stdio", "--float-samples",
      "--samplerate=" + context.sampleRate, ...args
    ],
    mode: "write",
    input: document.getElementById('input').value,
  });
});
