{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/550e11f27ba790351d390d9eca3b80ad0f0254e7";
  outputs = {
    nixpkgs,
    self,
  }: {
    packages =
      builtins.mapAttrs (sys: pkgs: {
        default = pkgs.pkgsCross.wasi32.callPackage ({
          stdenv,
          autoreconfHook,
        }:
          stdenv.mkDerivation {
            name = "minimodem";
            src = ./.;
            patches = [./autotools-bork.patch];
            nativeBuildInputs = [autoreconfHook];
            configureFlags = [
              "--with-pulseaudio=no"
              "--with-sndfile=no"
              "--with-sndio=no"
              "--with-alsa=no"
              "--with-benchmarks=no"
            ];
            LDFLAGS = "-lwasi-emulated-signal";
            CFLAGS = "-D_WASI_EMULATED_SIGNAL -O2";
            postInstall = ''
              # so `nix run .` will work
              ln -s $out/bin/minimodem $out/bin/minimodem-wasm32-unknown-wasi
            '';
            meta.mainProgram = "minimodem";
          }) {};
        web = pkgs.callPackage ({
          runCommand,
          subPath ? "/",
        }:
          runCommand "minimodem-webroot" {} ''
            install -D -m444 -t $out/${subPath} ${./.}/page/* 
            cp ${pkgs.lib.getExe self.packages.${sys}.default} $out/${subPath}/minimodem.wasm
          '') {};
      })
      nixpkgs.legacyPackages;
  };
}
