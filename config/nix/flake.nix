{
  description = "NixOS Configuration for Spaced on a VPS";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  inputs.disko.url = "github:nix-community/disko";
  inputs.disko.inputs.nixpkgs.follows = "nixpkgs";

  outputs = { nixpkgs, disko, ... }:
  {
      nixosConfigurations.digitalocean = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        disko.nixosModules.disko
        {
          # do not use DHCP, as DigitalOcean provisions IPs using cloud-init
          networking.useDHCP = nixpkgs.lib.mkForce false;

          services.cloud-init = {
            enable = true;
            network.enable = true;

            # not strictly needed, just for good measure
            datasource_list = [ "DigitalOcean" ];
            datasource.DigitalOcean = { };
          };
        }
        ./configuration.nix
        ./hardware-configuration.nix
      ];
    };

    nixosConfigurations.google-cloud = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        disko.nixosModules.disko
        { disko.devices.disk.main.device = "/dev/sda"; }
        ./configuration.nix
        ./hardware-configuration.nix
      ];
    };

    nixosConfigurations.hetzner-x86_64 = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        disko.nixosModules.disko
        { disko.devices.disk.main.device = "/dev/sda"; }
        ./configuration.nix
        ./hardware-configuration.nix
      ];
    };

    nixosConfigurations.aws-x86_64 = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        disko.nixosModules.disko
        { disko.devices.disk.main.device = "/dev/xvda"; }
        ./configuration.nix
        ./hardware-configuration.nix
      ];
    };

    nixosConfigurations.generic = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        disko.nixosModules.disko
        ./configuration.nix
        ./hardware-configuration.nix
      ];
    };
  };
}
