# Oracle instance deployment status

## Current release — 5 November 2026 (Asia/Karachi)

- The [live HTTPS preview](https://144.24.117.229/) includes the blue/green E-Cure redesign, refreshed homepage and service photography, and the new [Meet Our Staff section](https://144.24.117.229/about#meet-our-staff) with four supplied portraits and labeled sample names and email addresses.
- Active release `/opt/ecure/releases/20261105-3875d77edef0` uses image `ecure:20261105-3875d77edef0` in healthy container `ecure`. `/opt/ecure/current` points to this release.
- The source archive is 23,630,052 bytes (22.54 MiB) with SHA-256 `3875d77edef0400decb307edc2ab6243b2c9ef3e24634e4c3079bad24e5e628b`.
- Caddy remains active; trusted HTTPS and the HTTP 308 redirect passed external checks. App port remains restricted to `127.0.0.1:3000`, with the existing runtime configuration and bounded logs.
- All 13 public routes returned 200 on the candidate and public URL. Live homepage branding, booking visibility and horizontal overflow checks passed at all eight requested widths. The original logo/favicon bytes match, mobile navigation and nursing-service booking prefill work, and no JavaScript page errors were observed. The corrected full-width 768px hero now selects an 828px image.
- The staff section passed layout checks at 320, 375, 390, 430, 768, 1024, 1280 and 1440px in Chromium, Firefox and WebKit, with an additional Chromium pass on the live preview. All four portraits loaded, and the section passed automated accessibility checks in all three engines.
- The immediately previous photography release is available as image `ecure:20261105-fc4386677647`, stopped container `ecure-previous-20261105-fc4386677647`, and its release directory. Approximately 37 GB was free after the update.
- Cloud CMS, staff authentication and submissions remain disabled pending production backend configuration. Local credentials/Auth settings were not copied or enabled publicly.
- The separate configured local CMS had saved generic branding that overrode the E-Cure defaults. Its name, short name and logo were corrected previously. The later client subtitle request updates only `brandLine` to `HOME HEALTH SERVICES`; the prior pending draft differed only in this subtitle, so draft/publication are now both revision 9. All other content is preserved. All 64 protected source files remain unchanged.

See [the completed Stage 5 report](../design/ECURE_BLUE_GREEN_STAGE_5_REPORT.md) and [handoff](../design/ECURE_BLUE_GREEN_HANDOFF.md). Stage 5 passed 104 browser cases, 39 unit tests and 81 database tests, plus builds/lint/TypeScript/boundaries/migration consistency and deployment smoke checks. The [earlier Stage 4 deployment record](ORACLE_BLUE_GREEN_UPDATE_2026-11-05.md) preserves the original branding correction and release history.

The subsequent [subtitle/interaction refinement](../design/ECURE_LOGO_AND_MOTION_REFINEMENT.md) passed 27 final affected browser cases across all three engines after fixing two timing issues found in its initial full run. Local/Linux builds, lint, TypeScript, boundaries and 39 unit tests passed. That record distinguishes the initial 79/81 result from the successful final focused suite.

The latest [client photography update](../design/ECURE_CLIENT_PHOTOGRAPHY_UPDATE.md) maps six supplied originals to the seven homepage/service placements. Its initial 27-case run passed 26 cases and exposed a Windows WebKit prefetch-cancellation issue in the repeated-navigation test. All three photo-placement rechecks passed after adjusting that test sequence. Original bytes match, all eight requested layout widths were exercised, 39 unit tests passed, and protected source/CMS content remained unchanged.

To roll back to the photography release, inspect the container names, stop and rename the current `ecure` container, rename `ecure-previous-20261105-fc4386677647` to `ecure`, and start it. Repoint `/opt/ecure/current` to `/opt/ecure/releases/20261105-fc4386677647` and verify the preview through Caddy.

## Initial deployment — 4 November 2026 (historical record)

The sections below record the original installation and release; the current release information above supersedes their image/archive identifiers and measurements.

## Installed and verified

- Instance public IPv4: `144.24.117.229`; SSH user: `ubuntu`.
- OS: Ubuntu 24.04.5 LTS, x86_64; approximately 7.7 GiB RAM and 48 GB root disk.
- Docker Engine 29.9.3 and Caddy 2.11.8 installed through their official package repositories.
- Clean source upload: `dist/ecure-oracle-source.tar.gz`, 642,866 bytes, SHA-256 `b966df9411141ddb64f2f05f208fba0c9b91c2e4d614ad58756861ca649842e2`.
- Release directory: `/opt/ecure/releases/20261104-b966df941114`; `/opt/ecure/current` points to it.
- Image: `ecure:20261104-b966df941114`, Linux/amd64, 394,452,534 bytes. Production compilation and TypeScript checking passed on the VM.
- Container: `ecure`, health checked, restart policy `unless-stopped`, bounded JSON logs. App port is published only to `127.0.0.1:3000`.
- Caddy proxy configuration: `/etc/caddy/Caddyfile`, now serving trusted HTTPS for the instance IP and forwarding to the loopback app. HTTP redirects to HTTPS with status 308. Caddy is enabled as a system service. The previous default configuration is backed up at `/etc/caddy/Caddyfile.before-ecure`; the initial HTTP-only setup is backed up at `/etc/caddy/Caddyfile.before-ip-https`.
- Runtime configuration: `/etc/ecure/runtime.env`, root-owned, mode `0600`. Contains disabled CMS/Auth/submission modes; no production credentials were supplied.
- Host firewall permits TCP 80/443. The same additions were made to the existing `/etc/iptables/rules.v4` for persistence. Existing Oracle infrastructure and SSH rules were retained, with the original file backed up at `/etc/iptables/rules.v4.before-ecure-web`.
- Through Caddy on the VM: all 13 public routes returned 200, the icon and optimized image returned valid images, the removed sandbox returned 404, and disabled staff-session access failed closed with 503. The homepage contains E-Cure branding and preview noindex metadata. Container memory was about 113 MiB at the measured idle snapshot.
- Browser smoke checks through an SSH tunnel passed at 1440px and 390px: all four homepage images loaded, fonts loaded, no horizontal overflow and no JavaScript page errors. The nursing-care booking link returned 200. Screenshots and the structural result are in ignored `.local/oracle-deploy/` on the local computer. The tunnel is currently available at `http://127.0.0.1:3701` while its SSH process remains running.
- The persisted host firewall rules passed `iptables-restore --test`. The VM had about 43 GB free after installation/build. Docker retains approximately 1.3 GB of reclaimable build cache for the upcoming domain/production rebuild; the running image is approximately 394.5 MB.

SSH key contents were never printed, included in the source upload or copied to the VM. The supplied local private key's permissions were restricted to the current Windows account because OpenSSH rejected its inherited group access.

## Public network status

Public HTTPS access to `https://144.24.117.229/` is now verified with normal certificate validation on Windows and in Chromium. HTTP redirects there with status 308. An earlier screenshot showed TCP 433 instead of 443; subsequent successful external HTTPS connections confirm TCP 443 is now reachable.

Caddy obtained a publicly trusted Let's Encrypt certificate using the ACME `shortlived` profile and HTTP-01 validation. The certificate's IP SAN matches `144.24.117.229`; the first certificate expires on 11 November 2026. Caddy's persistent automatic certificate maintenance/renewal remains enabled. This requires no purchased domain. Explicit `default_sni 144.24.117.229` supports normal IP-address clients that omit TLS SNI. No self-signed trust exception or disabled certificate verification was used.

Browser smoke checks against the actual public HTTPS URL passed at 1440px and 390px: fonts and all four images loaded, no overflow and no JavaScript page errors. The nursing-care booking page returned 200. HTTPS evidence is in `.local/oracle-deploy/oracle-https-browser-smoke.json` and its companion screenshots.

There are no configured local OCI API credentials; cloud-console rules were added by the user, not changed over SSH by this deployment.

On the instance's attached NSG or subnet security list, allow two stateful ingress rules:

| Source | Protocol | Source ports | Destination port |
| --- | --- | --- | --- |
| `0.0.0.0/0` | TCP | All | 80 |
| `0.0.0.0/0` | TCP | All | 443 |

An NSG must be attached to the instance VNIC for its rules to apply. Preserve the existing SSH rule. Both public HTTPS reachability and the HTTP redirect are verified.

## Production launch inputs still needed

- A reviewed canonical public URL. The current IP now supports trusted HTTPS without a domain; a business domain can be added later. Rebuild the app with the approved canonical URL before launch/indexing.
- A production application PostgreSQL database with the existing schema/restricted runtime role, reviewed business/CMS initialization, and a controlled production staff mapping.
- An HTTPS Supabase Auth service/project for live staff login and enforced MFA. Local development accounts and provider settings were not copied into production.
- Real Turnstile settings and approved HTTPS origins for live booking/contact submissions.
- A reviewed production profile/content configuration: the current default profile retains `demo: true`, so live submissions intentionally remain blocked. Editing only the runtime mode is insufficient.

The infrastructure and public HTTPS preview are installed and reachable. Production backend setup and the approved production profile/canonical URL remain outstanding. The user confirmed that no domain or hosted Supabase project exists yet. Live staff authentication, CMS and real submissions remain disabled until configured; HTTPS setup did not enable them or change application/data code.

## Inspection commands over SSH

```sh
sudo docker ps --filter name=ecure
sudo docker logs --tail 50 ecure
sudo docker inspect ecure --format '{{.State.Health.Status}}'
sudo systemctl status caddy --no-pager
curl -I -H 'Host: 144.24.117.229' http://127.0.0.1/
```

The preview can be inspected privately while cloud ingress is pending using an SSH tunnel to the loopback app. From Windows PowerShell, keep this command running:

```powershell
ssh -N -L 127.0.0.1:3701:127.0.0.1:3000 -i "C:\Users\Ziyad Usman Khan\Downloads\ssh-key-2026-11-04 (1).key" ubuntu@144.24.117.229
```

Then open `http://127.0.0.1:3701` locally. This is the app running on Oracle through the tunnel; it does not expose app port 3000 publicly.
