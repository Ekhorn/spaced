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
    - [2.3.2 Add HTTPS with free certificate auto renewal](#232-add-https-with-free-certificate-auto-renewal)

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

| Provider                                                      | Zone                         | Cost (/month)                               | Specs                                                                                                                                                                                           |
| ------------------------------------------------------------- | ---------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [AWS (EC2)](https://eu-central-1.console.aws.amazon.com/ec2/) | eu-central-1b                | < €1 (depends) / free tier\* _([see][aws])_ | [t2.micro](https://aws.amazon.com/ec2/instance-types/) <br> 1 vCPU <br> 1 GB RAM <br> 10 GB SSD <br> [Low to Moderate](https://docs.aws.amazon.com/ec2/latest/instancetypes/gp.html#gp_network) |
| [DigitalOcean][digitalocean]                                  | Netherlands (Amsterdam)      | $6 or less _([see][digitalocean])_          | [Basic][digitalocean] <br> 1 vCPU <br> 1 GB RAM <br> 25 GB SSD <br> Up to 1 TiB                                                                                                                 |
| [Google Cloud][google_cloud]                                  | europe-west4-b (Netherlands) | $7.83 _([see][google_cloud])_               | [e2-custom-micro-1280][google_cloud] <br> 0.25 vCPU <br> 1.25 GB RAM <br> 10 GB <br> 1 Gbps                                                                                                     |
| [Hetzner][hetzner]                                            | Germany (Nuremberg)          | € 3.79\* _([see][hetzner])_                 | [CX22][hetzner] <br> 1 vCPU <br> 1 GB RAM <br> 10 GB SSD <br> [Up to 20 TB][hetzner]                                                                                                            |
| [IONOS(de)][ionos]                                            | Germany (Berlin)             | €1 for 1 year plan _([see][ionos])_         | [VPS Linux XS](https://www.ionos.com/servers/vps) <br> 1 vCPU <br> 1 GB RAM <br> 10 GB SSD <br> 1 Gbit/s ([Unlimited](https://www.ionos.com/servers/vps))                                       |
| [IONOS(de)][ionos]                                            | Germany (Berlin)             | €4 (or €3 w/ 2 year plan) _([see][ionos])_  | [VPS Linux S](https://www.ionos.com/servers/vps) <br> 2 vCPU <br> 2 GB RAM <br> 80 GB SSD <br> 1 Gbit/s ([Unlimited](https://www.ionos.com/servers/vps))                                        |
| ...                                                           |                              |                                             |                                                                                                                                                                                                 |

> **AWS (EC2)**: See the [AWS Free Tier limits](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-eligibility.html).
>
> **DigitalOcean**: The network traffic is up to 1TiB. The network bandwith is currently unknown. You may be billed less depending on usage.
>
> **Hetzner**: The network traffic is up to 20TB a month. Every TB afterwards costs €1.00 in the EU and US, and €7.40 in Singapore. The network bandwith is currently unknown.

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

> **AWS**: [Amazon EC2](https://aws.amazon.com/ec2/) is **recommended** over [Amazon Lightsail](https://aws.amazon.com/lightsail/). While Amazon Lightsail is advertised as VPS product it's considerably more expsensive (at the time of writing) compared to EC2. If you would like to use Lightsail instead you can follow the general instructions.
>
> **DigitalOcean**: Uses the term Droplet to refer to Virtual Private Server.https://www.digitalocean.com/products/droplets

### 2.1. VPS deployment

Each provider has it's own ways to create a VPS.

> **Hetzner**: In the cloud console, a default project is created, it can be renamed to e.g. Spaced. Or you can create a new project entirely.

The general steps involved for setting up a VPS are as follows:

#### 2.1.1. Zone (data center location)

The data center location is important to reduce latency for your users. The **recommended** zone would be the one **nearest to most users** minimizing the **mean latency** across your user base. To learn more about various latency numbers you can check out the following AWS latency chart <https://latency.bluegoat.net/>.

> **Hetzner**: At the time of writing some locations may not support all plans available.

#### 2.1.2. OS Image (Linux)

The **recommended** image may vary depending on the providers' offerings. A good choice is Debian as it's less bloated than e.g. Ubuntu, and is widely used and stable. Currently only tested on Linux with x86_64 architecture.

<!--
|          | Debian 12 | Ubuntu 24 |
| -------- | --------- | --------- |
| Idle RAM | ~3%       | ~10%      |
| Storage  | 1.6 GiB   | 2.5 GiB   |
-->

> **AWS (EC2)**: The default image is the Amazon Linux which is recommended as it has free plan support and is designed to be lightweight.
>
> **Google Cloud**: To configure NixOS the easiest way would be to upload a custom ISO image, such as the "Minimal Image" from <https://nixos.org/.download/>, since passwordless login is disabled by default. You could also circumvent this by using browser console SSH option, and setting a password using `sudo passwd`, then temporarily enabling `PasswordAuthentication` and `PermitRootLogin` by editing `sudo nano /etc/ssh/sshd_config` and then running `sudo systemctl reload ssh` allowing you to continue with [Nix](./deployments/vps/nix.md).

#### 2.1.3. Instance Type

The **recommended minimum** here is based on tests conducted in [1.1. Tested VPS providers](#11-tested-vps-providers). Using "shared servers" is recommended here, while that usually means everything runs on a virtual machine it will cut on costs. Dedicated servers are usually not needed unless performance is of up most importance.

> **Google Cloud**: Using a custom E2 machine type with 0.25 (shared) vCPUs, and 1.25 GB RAM NixOS OS can be installed when following [nix](./deployments/vps/nix.md). You may be able to get away with less memory when configuring manually, allowing you to use e.g. e2-micro with 0.25-2 (shared) vCPUs and 1 GB RAM.

| Use                                 | CPU    | RAM   | Storage |
| ----------------------------------- | ------ | ----- | ------- |
| Personal <!-- (up-to XXX users) --> | 1 vCPU | 1 GiB | 8 GB    |
| ...                                 |

<!-- TODO: add concurrent user counts based on load tests -->
<!-- TODO: consider adding traffic stats -->

#### 2.1.4. Networking

The networking on each provider can differ quite significantly. Some recommendations are choosing an IPv4 adress if that's important to you, and setting up firewall rules. The recommended firewall rules are to only expose TCP ports:

- 22 for SSH access
- 80 for HTTP traffic
- 443 for HTTPS traffic

> **Google Cloud**: The default firewall has ports 80 and 443 disabled. To enable go to "Networking > Firewall", and enable HTTP/s traffic.
>
> **IONOS(de)**: The default firewall rules are set to ports 22, 80, 443, 8443, and 8447. Ports 8443 and 8447 don't need to be exposed can be disabled.

#### 2.1.5. SSH Key Pair

The provider may require you to configure an SSH key pair beforehand, and others may pre-define a password to get access to your VPS.

> **AWS (EC2)**: The key pair must instead be generated and downloaded from the console during configuration which you can then use by adding the path to the identity file with `-i /path/to/<my-identity>.pem`.
>
> **Google Cloud**: Public key pairs can be added before and after the instance is created.
> <br>- Before: Security > Manage Access > Add manually generated SSH keys
> <br>- After: Settings > Metadata > SSH Keys

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

> **DigitalOcean**: The following are **not required**: Volumes and Backups. You can give the droplet a "project name". Additionally you may enable improved metrics monitoring and alerting as it's free.
>
> **Google Cloud**: There are tons more options, but recommended is leaving things on the default.
>
> **Hetzner**: The following are **not required**: Volumes, Backups, Placement groups, Labels and Cloud Config. You can name your VPS server to be called `spaced`.
>
> **IONOS**: You can rename your VPS server to be called `spaced` for clarity.

#### 2.1.7. Configuring the VPS

> Note: Nix requires at least 696Mi available RAM (tested on Google Cloud E2 custom). Running `free -h` on [IONOS(de) VPS Linux XS](https://www.ionos.de/server/vps) (with 1GB RAM) only actually shows 556Mi available RAM, and ran out of memory during kernel swapping.

When the VPS is ready, configure it either [manually](deployments/vps/manual.md) or through [Nix](deployments/vps/nix.md).

### 2.2. Kubernetes deployments

### 2.3. Additional requirements

#### 2.3.1 Adding a Domain Name

Configuring a domain name can be done when you've bought a domain. The registrar you bought the domain from should provide you with a DNS records table in which you can add a new DNS A record with your VPS or clusters' IP address<sup>[[1]][ttl]</sup>. You can configure the TTL value to be shorter if you want the DNS records to propagate faster for testing, however make sure to change it back to the default to reduce server traffic<sup>[[2]][ttl]</sup>.

#### 2.3.2 Add HTTPS with free certificate auto renewal

Supporting for HTTPS traffic is vital to securely send data encrypted to and from the server hosting Spaced. Setting this up can be done easily for free using [Traefik's out-of-the-box ACME support](https://doc.traefik.io/traefik/https/acme/). Each provider will require some form of proof that the server hosting the application to be secured (in this case Spaced) is indeed authorized. This is usually done through a set of secrets that allow access to the providers' API which your server, and in this case Traefik can proof itself via a [challenge type](https://letsencrypt.org/docs/challenge-types/). The secrets needed depend on the provider, see the following list to see if yours supports this feature: https://doc.traefik.io/traefik/https/acme/#providers.

To enable HTTPS go to the deployment method that applies to you, see:

- [Spaced on Docker Swarm](./deployments/swarm.md)
- ~~[Spaced on Kubernetes](./deployments/kubernetes.md)~~ (Coming soon)

<!--

**Cloudflare**

Configuring Cloudflare can be done by adding ... then pointing it to your server IP address. In case you also have a domain name adjust the DNS records pointing to your server to be pointing to ... cloudflare

**Metrics** -->

[a_record]: https://www.cloudflare.com/learning/dns/dns-records/dns-a-record/
[aws]: https://aws.amazon.com/free
[digitalocean]: https://cloud.digitalocean.com/droplets/new?region=ams3&size=s-1vcpu-1gb&distro=debian&distroImage=debian-12-x64
[google_cloud]: https://console.cloud.google.com/compute/instancesAdd
[hetzner]: https://www.hetzner.com/cloud/
[ttl]: https://www.ionos.com/digitalguide/server/configuration/understanding-and-configuring-dns-ttl
[ionos]: https://www.ionos.de/server/vps#tarife
