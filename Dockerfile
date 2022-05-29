# Usage:
#docker build -t minimodem .; and docker create --name minimodem minimodem; and docker cp minimodem:src/minimodem ./minimodem.wasm; and docker rm minimodem

FROM debian:bookworm
RUN apt-get update && apt-get install -y build-essential wget autoconf pkg-config git && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /opt
RUN wget --progress=dot:mega https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-15/wasi-sdk-15.0-linux.tar.gz -O wasi-sdk.tgz \
  && echo 9b1f2c900a034a44e59b74843cd79b4f189342598e554029367ef0a2ac286703 \ wasi-sdk-15.0-linux.tar.gz \
  && tar xvf wasi-sdk.tgz \
  && rm wasi-sdk.tgz \
  && mv wasi-sdk-* wasi-sdk
ENV WASI_SDK_PATH=/opt/wasi-sdk 
WORKDIR /opt/minimodem
COPY . .
RUN git clean -dfx
ENV CC="/opt/wasi-sdk/bin/clang --sysroot=/opt/wasi-sdk/share/wasi-sysroot"
ENV LDFLAGS="-lwasi-emulated-signal"
ENV CFLAGS="-D_WASI_EMULATED_SIGNAL -O2"
RUN autoreconf -fi \
  && ./configure \
    --build=x86_64-unknown-linux-gnu \
    --host=wasm32-wasi \
    --target=wasm32-wasi \
    --without-pulseaudio \
    --without-sndfile \
    --without-sndio \
    --without-alsa \
    --without-benchmarks \
  || (cat config.log && false) \
  && VERBOSE=1 make
#&& VERBOSE=1 make -j$(nproc) -k 