# Nix <!-- omit in toc -->

The guide describes how to configure your VPS using NixOS. Nix will allow you to define your system configurations declaratively, and with [nixos-anywhere](https://github.com/nix-community/nixos-anywhere) installed with just one command.

> Important: Running the Nix configuration will completely reconfigure (partition) the OS, so do not try this on a VPS already in use.

> Note: Assumptions made here are only based on the tested VPS servers. Any untested VPS servers may require a different configuration and have different results.

> Note: This guide is based on the [nixos-anywhere quickstart](https://github.com/nix-community/nixos-anywhere/blob/9ba099b2ead073e0801b863c880be03a981f2dd1/docs/quickstart.md) guide.

<div style="page-break-after: always;"></div>

## Contents <!-- omit in toc -->

<style>
  .toc > ul { padding-left: 1em; }
  .toc > * * ul { padding-left: 1em; }
  .toc > * > li { list-style-type: none; }
  .toc > * * > li { list-style-type: none; }
</style>

<div class="toc">

- [1. Why Nix (and why not)](#1-why-nix-and-why-not)
- [2. Nix Configuration](#2-nix-configuration)
  - [2.1. Prerequisites](#21-prerequisites)
  - [2.2. Pre-Install Configuration](#22-pre-install-configuration)
    - [2.2.1. Add public SSH key(s) to the nix configuration](#221-add-public-ssh-keys-to-the-nix-configuration)
    - [2.2.2. Choosing the right provider configuration](#222-choosing-the-right-provider-configuration)
    - [2.2.3. Create a lock file](#223-create-a-lock-file)
  - [2.3. (Optional) Testing](#23-optional-testing)
- [3. Installing NixOS](#3-installing-nixos)
- [4. Post-Install Configuration](#4-post-install-configuration)
  - [4.1. NixOS Configuration](#41-nixos-configuration)
  - [4.2. Configure Spaced](#42-configure-spaced)

</div>

<div style="page-break-after: always;"></div>

## 1. Why Nix (and why not)

When it comes to using Nix there are pro's and cons.

**NixOS** allows you to **maintain a reproducible system configuration** across your hosts, and it's therefore **simpler** to maintain when you have **multiple machines**.

**However** using Nix comes at a cost of potentially **extra storage space**, and **sometimes** being a little **extra tideous**. The installation process also requires at least 696MiB of (available) RAM.

<div style="page-break-after: always;"></div>

## 2. Nix Configuration

### 2.1. Prerequisites

- You have a VPS with SSH access, and a Linux install (with kexec).
- You have a VPS with at least 696MiB (available) RAM (check with `free -h`).
- You have SSH access to the root user or a passwordless sudo user.
- You have [Nix Package Manager or NixOS](https://nixos.org/download) installed on your host system.
- You have copied the default nix configuration files from the `config/nix` directory in GitHub.

### 2.2. Pre-Install Configuration

#### 2.2.1. Add public SSH key(s) to the nix configuration

In the `configuration.nix` file add your public key(s) from which you want to be able to access the VPS, to both the `root` and `spaced` user under `users.users.<user>.openssh.authorizedKeys.keys`. If you want to use your SSH key on your host run `cat ~/.ssh/*.pub` (on Linux). _We'll disable root access at the end of the guide._

> Important: If you **did not** add your public key to the root user, you will be **locked out** of the VPS and will have to **reset or re-configure the VPS**.

#### 2.2.2. Choosing the right provider configuration

You must choose the right provider from the `flake.nix` file indicated by `nixosConfigurations.<provider-name>`. If your provider is not within the list make sure to check the current block device name on the VPS using the `lsblk` command, which on AWS e.g. could look the following:

```sh
$ lsblk
NAME      MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
xvda      202:0    0   8G  0 disk
├─xvda1   202:1    0   8G  0 part /
├─xvda127 259:0    0   1M  0 part
└─xvda128 259:1    0  10M  0 part /boot/efi
```

The block device name to choose in this case is `xvda`, you know when it's right if the `/boot/efi` mountpoint is listed under one of child block device names. If the block device name is `vda` you can use the **generic** configuration. If not, you can either add the block device name into the generic configuration or better yet, create a new config for the cloud provider used and open a [PR](https://github.com/Ekhorn/spaced/compare) ;).

> Note: It's recommended you wait until NixOS is installed before changing anything else in the `configuration.nix` file. If you want to know more about the Nix configuration options checkout https://search.nixos.org/options.

#### 2.2.3. Create a lock file

Lastly, run `nix flake lock` which downloads the flake dependencies and creates a lock file.

### 2.3. (Optional) Testing

When you think you're done, it's recommended you test your configuration first in a VM. You must first comment out the `./hardware-configuration.nix` path in the `flake.nix` file otherwise it will error. Then run the following command with the path and name of your configuration.

```
nix run github:nix-community/nixos-anywhere -- --flake <path to configuration>#<configuration-name> --vm-test
```

Example: Test default config

```
nix run github:nix-community/nixos-anywhere -- --flake github:Ekhorn/spaced/deploy?dir=nested#config/nix#generic --vm-test
```

<div style="page-break-after: always;"></div>

## 3. Installing NixOS

> Tip: If you use an identity file the same argument as for SSH can be used for nixos-anywhere e.g. `-i "example.pem"`.

The following command will swap the Linux kernel on the VPS, paritition the drives, install NixOS, and reboot the system.

> Note: You may see "connection refused" or other similar messages, nixos-anywhere should automatically reconnect. The installation process may take about 5-10 minutes depending on your internet speed.

<!-- ```
nix run github:nix-community/nixos-anywhere -- \
  --kexec "$(nix build --print-out-paths github:Ekhorn/nixos-images#packages.x86_64-linux.kexec-installer-nixos-unstable-noninteractive)/nixos-kexec-installer-noninteractive-x86_64-linux.tar.gz" \
  --generate-hardware-config nixos-generate-config ./hardware-configuration.nix \
  --flake <path to configuration>#<configuration-name> root@<ip address>
``` -->

```
nix run github:nix-community/nixos-anywhere -- \
  --generate-hardware-config nixos-generate-config ./hardware-configuration.nix --no-substitute-on-destination \
  --flake <path to configuration>#<configuration-name> root@<ip address>
```

<div style="page-break-after: always;"></div>

## 4. Post-Install Configuration

### 4.1. NixOS Configuration

If you have previously connected to the VPS using SSH, you may see a similar message, which occurs because the `~/.ssh/known_hosts` file contains a mismatching key of the VPS which was overwritten during the installation process. You can remove the old server entry, by following the steps described in the message.

```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
Someone could be eavesdropping on you right now (man-in-the-middle attack)!
It is also possible that a host key has just been changed.
The fingerprint for the ED25519 key sent by the remote host is
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.
Please contact your system administrator.
Add correct host key in ~/.ssh/known_hosts to get rid of this message.
Offending ECDSA key in ~/.ssh/known_hosts:6
  remove with:
  ssh-keygen -f ~/.ssh/known_hosts" -R "<ip address>"
Host key for <ip_address> has changed and you have requested strict checking.
Host key verification failed.
```

Once removed, SSH into the machine using the new `spaced` user. The account is currently locked, so you cannot run commands with `sudo` until a password is set. To configure a password, SSH into the VPS using the `root` user and run `passwd spaced`. Make sure to keep the password somewhere safe as you'll will need it for any future nix configuration changes.

```sh
ssh spaced@<ip address>
ssh root@<ip address>
passwd spaced
```

In the `configuration.nix` file make sure to uncomment the following lines to only allow public key access and user access when you SSH into the VPS for better security. _If you would like to you can now also remove the root user from the configuration. Just remember to keep your public SSH keys in the `spaced` user configuration._

```nix
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
```

Then update the config with the following command.

```
nixos-rebuild --target-host spaced@<ip address> --use-remote-sudo switch --flake <path to configuration>#<configuration-name>
```

You can now use the above command anytime you want to change the nix configurations.

That's it!

<div style="page-break-after: always;"></div>

### 4.2. Configure Spaced

To deploy Spaced, continue with the [Docker Swarm Guide](swarm.md).
