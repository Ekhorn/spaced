# Security audit

### Introduction

The audit is done by the same party that provides this software. Hopefully in the future third-party auditors can come in and give an indepedant look. This audit looks at the existing vulnerabilities in Spaced, and advices on solutions to fix them based on OWASP and NIST adivsories.

> DISCLAIMER: All vulnerabilities discussed are tracked through GitHub issues, including status updates. 
> 
> Use Spaced at your own risk.

### Vulnerabilities

1. No existing authentication. All data is accessible to anyone at this moment in time. Work on authentication has been put forward, in the following way, but has not yet been implemented fully:

Ongoing dicussion is to be had in [issue ]()

2. Misconfigurations

2.1. Missing content security policy, both for the browser version and desktop version.

In the browser this can mitigate XSRF?? cross-site request forgery?? and limit XSS? On desktop see https://tauri.app/security/csp/

2.2. No

3. Encryption

Spaced has no TLS/SSL certificate requesting system in place, and 

3. Dependency managment, and supply chain attacks

Spaced is maintained 

4. Container security

**Applied measures**

Container security has had a deeper look, and current [distroless images](https://github.com/GoogleContainerTools/distroless) are currently in use.

Specific hardening measures applied:

- non-root users.

```dockerfile
FROM gcr.io/distroless/cc-debian12:$DISTROLESS_TAG
WORKDIR /home/nonroot
COPY --from=build --chown=nonroot:nonroot --chmod=544 /app/target/release/item_producer /usr/bin
ENTRYPOINT ["item_producer"]
```

**Vulnerabilites**

**Mitigations**

Readonly file systems

### Conclusion

Considering rudementary security practices such as authentication, and encryption are not yet in place. It's currently **not recommended** to be deploying and using Spaced in the cloud in production using the **Cloud storage option**. Therefore this option is at the time of writing disabled, however images, build artifacts and guides to deploy spaced are coming soon, and will refer to this adivsory and the associated GitHub issues.

That said, using the **on device storage** solutions **are for the most part not affected** by the above mentioned vulnerabilities, except potentially XSS and overly privileged desktop configurations. So it's **recommended** to only use Spaced browser storage- and/or local storage to store your data, and to be wary of these vulnerabilities in your operational security. 


https://github.com/FHICT-S-Koen/Spaced/issues/1


### References

