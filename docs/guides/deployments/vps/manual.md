# Manual <!-- omit in toc -->

The guide describes how to configure your VPS manually.

> Note: At the time of writing assumptions made here are only tested on 1 VPS provider. Other VPS providers may have slightly different default configurations e.g. Linux Images or default users. If something doesn't workout please consider opening an [issue](https://github.com/Ekhorn/spaced/issues/new) or [pull request](https://github.com/Ekhorn/spaced/compare).

<div style="page-break-after: always;"></div>

## Contents <!-- omit in toc -->

<div class="toc">
  <style>
    .toc > ul { padding-left: 1em; }
    .toc > * * ul { padding-left: 1em; }
    .toc > * > li { list-style-type: none; }
    .toc > * * > li { list-style-type: none; }
  </style>

- [1. Why manually (and why not)](#1-why-manually-and-why-not)
- [2. VPS Configuration](#2-vps-configuration)
  - [2.1. Prerequisites](#21-prerequisites)
  - [2.2. System Configuration](#22-system-configuration)
    - [2.2.1. Hardening the VPS](#221-hardening-the-vps)
    - [2.2.2. Installing required dependencies](#222-installing-required-dependencies)
  - [2.3. Configure Spaced](#23-configure-spaced)

</div>

<div style="page-break-after: always;"></div>

## 1. Why manually (and why not)

**Why?**

Manually configuring your VPS as opposed to using [Nix](nix.md) might be the **only option if your system resources are limited** (minimum 962MiB RAM), or the **prefered** option if you rather not depend on third-party tooling.

**Why not?**

If you have **enough RAM** you may want to **consider** [Nix](nix.md) as it provides: **pre-defined configurations**, and will be kept **up-to-date** for **optimal system configurations**.

## 2. VPS Configuration

### 2.1. Prerequisites

- You have a VPS with SSH access, and a Linux install.
- You have SSH access to the root user or a passwordless sudo user.

### 2.2. System Configuration

Your first step should be hardening the system. Most importantly the SSH config.

> Note: This guide (currently) only covers rudimentary security measures, there are many more ways to harden the VPS, so consider further measures.

#### 2.2.1. Hardening the VPS

First we add a user, you'll be prompted to enter a password, make sure to store this somewhere securely, as you'll need this to run privileged commands as super user.

```sh
adduser spaced
```

Then add your new user to the sudo group to be able to run commands as root when entering your user password.

```sh
usermod -aG sudo spaced
```

Now you should be able to switch to the new user.

```sh
su - spaced
```

Exit the VPS you should now be able to SSH in using your new username.

The next step is to copy your public SSH key id from your host system to the VPS. So your trusted without having to enter your user password.

> Note: some providers require SSH keys to be configured during creation in that case you skip this step.

```sh
ssh-copy-id spaced@<ip-address>
```

Now you should be able to SSH into the VPS without password.

To ensure people can't brute-force your password login we want to disable password logins entirely. Additionally we'll disable root login to prevent direct root access if your SSH keys were leaked attackers will need your user password for root access.

```sh
sudo nano /etc/ssh/sshd_config
...
PasswordAuthentication no
...
UsePAM no
...
PermitRootLogin no
```

Additionally there may also be a cloud init config containing `PasswordAuthentication`.

```sh
sudo nano /etc/ssh/sshd_config.d/50-cloud-init.conf
PasswordAuthentication no
```

Then restart the SSH service.

```sh
sudo systemctl reload ssh
```

Now when you try to SSH in as root you should see "Permission denied (publickey)".

```sh
ssh root@<ip-address>
```

#### 2.2.2. Installing required dependencies

Spaced requires a container runtime to run the docker containers. You may choose between
[Docker](https://docs.docker.com/engine/install/) or [Podman](https://podman.io/).

Recommended is Docker for Docker Swarm support. That will allow for updates without downtimes (blue/green deployments) and rolling releases.

### 2.3. Configure Spaced

To deploy Spaced, continue with the [Docker Swarm Guide](swarm.md).
