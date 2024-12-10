# Spaced on IONOS VPS <!-- omit in toc -->

### Contents <!-- omit in toc -->

<div class="toc">
  <style>
    .toc > ul { padding-left: 1em; }
    .toc > * * ul { padding-left: 1em; }
    .toc > * > li { list-style-type: none; }
    .toc > * * > li { list-style-type: none; }
  </style>

- [1. Setup up a VPS](#1-setup-up-a-vps)
  - [1.1. Adding a domain](#11-adding-a-domain)
- [Configuring SSL/TLS renewal](#configuring-ssltls-renewal)
</div>

### 1. Setup up a VPS

You may choose to use the pre-defined NixOS VPS configuration (at ...) or manually configure the OS.

#### 1.1. Adding a domain

You can add a domain in IONOS that points to your VPS. If you wish to do so include the IP address of your VPS in the DNS A records.

Wait for everything to propegate, which can take up to ... (ref)

You can run dig to find out if your DNS records have been progegated.

```sh
dig example.com
```

### Configuring SSL/TLS renewal

> Important: Make sure you check the following configurations yourself before your trust them, as certain third-party configurations are required and need authorizated API access.

The SSL/TLS certificate for you Spaced instance can be requested using ACME protocol.

Certbot refers to the following third-party plugins for hosting providers https://eff-certbot.readthedocs.io/en/stable/using.html#dns-plugins, and the ionos plugin refers to https://github.com/ionos-cloud/certbot-dns-ionos-cloud?tab=readme-ov-file#related-plugins

Certbot helps with certificate requests. To make the ACME challenge work on IONOS we'll be using the following plugin for certbot:
https://github.com/helgeerbe/certbot-dns-ionos?tab=readme-ov-file

Doing certificate requests requires an IONOS API_TOKEN, which you can get here:

https://developer.hosting.ionos.com/docs/getstarted
https://developer.hosting.ionos.com/docs/dns

_If your VPS not on ionos.com, but e.g. ionos.de, make sure to login to the right zone?_
https://developer.hosting.ionos.com/?source=IonosControlPanel

NOTES

https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html

CONFIGURE DOCKER CAP_DROP ALL TO DROP KERNEL PRIVILGES

RATE LIMITS https://letsencrypt.org/docs/rate-limits/
