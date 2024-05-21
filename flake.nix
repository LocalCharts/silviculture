{
  inputs = {
    systems.url = "github:nix-systems/default";
    forest.url = "github:LocalCharts/forest";
  };

  outputs = {systems, nixpkgs, forest, ...} @ inputs: let
    eachSystem = f:
      nixpkgs.lib.genAttrs (import systems) (system:
        f nixpkgs.legacyPackages.${system}
      );
  in {
    packages = eachSystem (pkgs:
      let
        offlineCache = pkgs.fetchYarnDeps {
          yarnLock = ./yarn.lock;
          hash = "sha256-yk6e18ePw+nplAd7b5jLgUQLWUuwstVXxiXfls21Mac=";
        };
        headers = pkgs.fetchurl {
          url = "https://nodejs.org/download/release/v20.11.1/node-v20.11.1-headers.tar.gz";
          sha256 = "sha256-CqQskbRB6UX/Q706g3dZxYtDbeV9zQM9AuXLzS+6H4c=";
        };
      in {
        default = pkgs.mkYarnPackage {
          pname = "silviculture";
          version = "0.0.1";
          src = ./.;
          packageJSON = ./package.json;
          inherit offlineCache;
          pkgConfig = {
            sqlite3 = {
              buildInputs = with pkgs; [ nodePackages.node-gyp pkg-config sqlite python3 ];
              postInstall = ''
                node-gyp --tarball ${headers} rebuild
              '';
            };
          };
          nativeBuildInputs = with pkgs; [ makeWrapper ];
          buildPhase = ''
            runHook preBuild

            export HOME=$(mktemp -d)
            yarn --offline build
            pushd deps/silviculture
            npx tsc -p tsconfig.node.json
            popd

            runHook postBuild
          '';

          postInstall = ''
            chmod +x $out/bin/silviculture

            substituteInPlace $out/bin/silviculture \
              --replace "/usr/bin/env node" ${pkgs.nodejs}/bin/node

            wrapProgram $out/bin/silviculture \
              --prefix PATH : ${pkgs.lib.makeBinPath [
                forest.packages.${pkgs.stdenv.system}.forester
                forest.packages.${pkgs.stdenv.system}.tldist
              ]}
          '';
        };
    });
    devShells = eachSystem (pkgs: {
      default = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs
          pkgs.node2nix
          pkgs.nodePackages.pnpm
          pkgs.nodePackages.typescript
          pkgs.nodePackages.typescript-language-server
        ];
      };
    });
  };
}
