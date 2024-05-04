{
  inputs = {
    systems.url = "github:nix-systems/default";
  };

  outputs = {systems, nixpkgs, ...} @ inputs: let
    eachSystem = f:
      nixpkgs.lib.genAttrs (import systems) (
        system:
          f nixpkgs.legacyPackages.${system}
      );
  in {
    packages = eachSystem (pkgs: {
      default = pkgs.buildNpmPackage rec {
        pname = "silviculture";
        version = "0.0.1";

        src = ./.;

        npmDepsHash = "sha256-KuL7qobnOnRlUSiHHzBYuFyMNjrzfvX8DKNYJen5OWg=";
      };
    });
    devShells = eachSystem (pkgs: {
      default = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs
          pkgs.nodePackages.pnpm
          pkgs.nodePackages.typescript
          pkgs.nodePackages.typescript-language-server
        ];
      };
    });
  };
}
