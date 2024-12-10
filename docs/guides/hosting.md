# Hosting <!-- omit in toc -->

Spaced is specifically designed to be self-hostable on as many hosting providers as possible. This guide aims to provide you with everything you need to know to deploy Spaced. Each provider listed below has been tested and configurations are provided.

> DISCLAIMER: Providers may change their requirements for deployments, and/or pricing. The following tests may not be accurate anymore in that case consider opening an [issue](https://github.com/Ekhorn/spaced/issues/new) or [pull request](https://github.com/Ekhorn/spaced/compare).

<div style="page-break-after: always;"></div>

## Contents <!-- omit in toc -->

<div class="toc">
  <style>
    .toc > ul { padding-left: 1em; }
    .toc > * * ul { padding-left: 1em; }
    .toc > * > li { list-style-type: none; }
    .toc > * * > li { list-style-type: none; }
  </style>

- [1. Choosing hosting options](#1-choosing-hosting-options)
  - [1.1. Tested VPS providers](#11-tested-vps-providers)
  - [1.2. Tested Kubernetes providers](#12-tested-kubernetes-providers)
- [2. Setup Hosting](#2-setup-hosting)
  - [2.1. VPS deployment](#21-vps-deployment)
    - [2.1.1. Zone (data center location)](#211-zone-data-center-location)
    - [2.1.2. OS Image (Linux)](#212-os-image-linux)
    - [2.1.3. Instance Type](#213-instance-type)
    - [2.1.4. Networking](#214-networking)
    - [2.1.5. SSH Key Pair](#215-ssh-key-pair)
    - [2.1.6. Other considerations](#216-other-considerations)
    - [2.1.7. Configuring the VPS](#217-configuring-the-vps)
  - [2.2. Kubernetes deployments](#22-kubernetes-deployments)
  - [2.3. Additional requirements](#23-additional-requirements)
    - [2.3.1 Adding a Domain Name](#231-adding-a-domain-name)

</div>

<div style="page-break-after: always;"></div>

## 1. Choosing hosting options

The choice between hosting Spaced on a VPS (Virtual Private Server), or a Cluster can have wide implications on hosting costs and performance.

**Why a VPS?**

In case you just want to try out Spaced for yourself a VPS is your best option. If you want to use Spaced only within a certain region, don't mind a bit more latency or don't have a larger budget a VPS is recommended.

> Note: You may want to consider third-party sources to decide such as <https://www.vpsbenchmarks.com/> as the test coverage is limited.

**Why a Cluster?**

If you want to deploy Spaced for a large user base, and have strict latency and availability requirements e.g. you want world wide access the Cluster option might be the better choice.

### 1.1. Tested VPS providers

The following list has been tested.

> Note: Some providers may offer a baseline you can surpass. When that happens extra costs are added to the monthly bill.

| Provider           | Zone             | Cost (/month)                              | Specs                                                                                                                                                     |
| ------------------ | ---------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [IONOS(de)][ionos] | Germany (Berlin) | €1 for 1 year plan _([see][ionos])_        | [VPS Linux XS](https://www.ionos.com/servers/vps) <br> 1 vCPU <br> 1 GB RAM <br> 10 GB SSD <br> 1 Gbit/s ([Unlimited](https://www.ionos.com/servers/vps)) |
| [IONOS(de)][ionos] | Germany (Berlin) | €4 (or €3 w/ 2 year plan) _([see][ionos])_ | [VPS Linux S](https://www.ionos.com/servers/vps) <br> 2 vCPU <br> 2 GB RAM <br> 80 GB SSD <br> 1 Gbit/s ([Unlimited](https://www.ionos.com/servers/vps))  |
| ...                |                  |                                            |                                                                                                                                                           |

<!-- **<100 concurrent users** -->

<!-- **1.000-5.000 concurrent users** -->

<!-- **>10.000 concurrent users** -->

### 1.2. Tested Kubernetes providers

<!--
| Provider | < 1.000 users | 10.000 users | > 100.000 users |
| -------- | ------------- | ------------ | --------------- |
|          |               |              |                 |
-->

<div style="page-break-after: always;"></div>

## 2. Setup Hosting

When you know what provider you want to go with, the next steps to deploy Spaced are described below.

### 2.1. VPS deployment

Each provider has it's own ways to create a VPS.

The general steps involved for setting up a VPS are as follows:

#### 2.1.1. Zone (data center location)

The data center location is important to reduce latency for your users. The **recommended** zone would be the one **nearest to most users** minimizing the **mean latency** across your user base. To learn more about various latency numbers you can check out the following AWS latency chart https://latency.bluegoat.net/.

#### 2.1.2. OS Image (Linux)

The **recommended** image may vary depending on the providers' offerings. A good choice is Debian as it's less bloated than e.g. Ubuntu, and is widely used and stable. Currently only tested on Linux with x86_64 architecture.

<!--
|          | Debian 12 | Ubuntu 24 |
| -------- | --------- | --------- |
| Idle RAM | ~3%       | ~10%      |
| Storage  | 1.6 GiB   | 2.5 GiB   |
-->

#### 2.1.3. Instance Type

The **recommended minimum** here is based on tests conducted in [1.1. Tested VPS providers](#11-tested-vps-providers). Using "shared servers" is recommended here, while that usually means everything runs on a virtual machine it will cut on costs. Dedicated servers are usually not needed unless performance is of up most importance.

| Use                                 | CPU    | RAM   | Storage |
| ----------------------------------- | ------ | ----- | ------- |
| Personal <!-- (up-to XXX users) --> | 1 vCPU | 1 GiB | 10 GB   |
| ...                                 |

<!-- TODO: add concurrent user counts based on load tests -->
<!-- TODO: consider adding traffic stats -->

#### 2.1.4. Networking

The networking on each provider can differ quite significantly. Some recommendations are choosing an IPv4 adress if that's important to you, and setting up firewall rules. The recommended firewall rules are to only expose TCP ports:

- 22 for SSH access
- 80 for HTTP traffic
- 443 for HTTPS traffic.

> **IONOS(de)**: The default firewall rules are set to ports 22, 80, 443, 8443, and 8447. Ports 8443 and 8447 don't need to be exposed can be disabled.

#### 2.1.5. SSH Key Pair

The provider may require you to configure an SSH key pair beforehand, and others may pre-define a password to get access to your VPS.

If you do not have an SSH key pair on your (unix) host system you can generate a pair using the following command. _You may specify a passphrase to encrypt the private key, make sure to keep it somewhere safe as you'll need it everytime you're accessing the VPS._

```sh
ssh-keygen
```

When generated copy the public key, you can use the following command to print it to the terminal.

```sh
cat ~/.ssh/*.pub
```

Lastly, configure it for the cloud provider.

#### 2.1.6. Other considerations

> **IONOS**: You can rename your VPS server to be called `spaced` for clarity.

#### 2.1.7. Configuring the VPS

When the VPS is ready, configure it either [manually](deployments/vps/manual.md) or through [Nix](deployments/vps/nix.md).

### 2.2. Kubernetes deployments

### 2.3. Additional requirements

#### 2.3.1 Adding a Domain Name

Configuring a domain name can be done when you've bought a domain. The registrar you bought the domain from should provide you with a DNS records table in which you can add a new DNS A record with your VPS or clusters' IP address<sup>[[1]][ttl]</sup>. You can configure the TTL value to be shorter if you want the DNS records to propagate faster for testing, however make sure to change it back to the default to reduce server traffic<sup>[[2]][ttl]</sup>.

<!--
**HTTPS and SSL/TLS Certificates**

Depending upon your domain registrar you may need to configure

**Cloudflare**

Configuring Cloudflare can be done by adding ... then pointing it to your server IP address. In case you also have a domain name adjust the DNS records pointing to your server to be pointing to ... cloudflare

**Metrics** -->

[a_record]: https://www.cloudflare.com/learning/dns/dns-records/dns-a-record/
[ttl]: https://www.ionos.com/digitalguide/server/configuration/understanding-and-configuring-dns-ttl
[ionos]: https://www.ionos.de/server/vps#tarife
