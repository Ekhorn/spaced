{ modulesPath, lib, ... }:

let
  keys = [
    # "ssh-... AAAA..."
  ];
in
{
  imports = [
    (modulesPath + "/installer/scan/not-detected.nix")
    (modulesPath + "/profiles/qemu-guest.nix")
    ./disko-config.nix
  ];

  boot.loader.grub = {
    # no need to set devices, disko will add all devices that have a EF02 partition to the list already
    # devices = [ ];
    efiSupport = true;
    efiInstallAsRemovable = true;
  };

  nix.settings.trusted-users = [ "root" "@wheel" ];

  security.sudo.wheelNeedsPassword = true;
  security.pam.sshAgentAuth.enable = true;

  services.openssh = {
    enable = true;
    ports = [ 22 ];
    settings = {
      # PasswordAuthentication = false;
      # PermitRootLogin = "no";
      # UsePAM = false;
      # KbdInteractiveAuthentication = false;
    };
  };

  virtualisation.docker.enable = true;

  environment.systemPackages = map lib.lowPrio [];

  users.users = {
    spaced = {
      isNormalUser = true;
      openssh.authorizedKeys.keys = keys;
      extraGroups = [ "wheel" "docker" ];
    };
    root.openssh.authorizedKeys.keys = keys;
  };

  system.stateVersion = "24.11";
}
