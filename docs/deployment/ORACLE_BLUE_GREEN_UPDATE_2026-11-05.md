# Oracle E-Cure branding/deployment update — 5 November 2026

This historical record describes the initial deployment of the approved redesign through Stage 4 at **https://144.24.117.229/** and the saved-brand correction. The subsequent approved Stage 5 is now complete; see [current deployment status](ORACLE_INSTANCE_STATUS.md) for release `20261105-c3dcbde7beec` and [the Stage 5 report](../design/ECURE_BLUE_GREEN_STAGE_5_REPORT.md) for final verification. Dates in this report use Asia/Karachi; machine-readable verification timestamps are UTC. Release identifiers below describe the initial Stage 4 update.

## Why the generic name appeared

The configured local application on port 3000 reads its published CMS document. That saved document contained `Home Health Services`, short name `Home Health`, and an empty logo path, so it displayed the generic text brand instead of the new source defaults. Its older CMS values also supplied the document title and accessible home-link name. The source-design preview on 3602 already showed E-Cure correctly.

Oracle was a separate case: it still ran the previous black/green release and its older E-Cure artwork. The redesign had deliberately remained local until this deployment request.

## Branding correction

A constrained, one-off local CMS content correction updated only the brand's `name`, `shortName` and `logo` in the saved draft and publication. The existing document validation was executed before the transactional write. The corresponding business display name and matching legacy homepage title were synchronized, and a structural publication audit event was recorded. This was a content update; no backend source, schema, migration, authentication policy or API contract was changed.

The old CMS state was backed up under the ignored `.local/oracle-bluegreen-update/` directory before modification. Every other draft/published content field was compared afterward and verified unchanged. The separate unpublished draft remains pending: draft revision 8, published revision 7. No unrelated pending draft was published or discarded. Staff identities, sessions, appointments, inquiries, service records and production settings were not modified by this correction.

The configured local site's header/title now identify **E-Cure Home Health Services**, use the supplied official JPEG, and no longer render the generic Home Health text logo. The backup and local Auth/credential files were excluded from the cloud archive.

## Release

| Item | Verified value |
| --- | --- |
| Source archive | `dist/ecure-oracle-source.tar.gz`, 218 allowlisted entries, 7,037,405 bytes |
| SHA-256 | `f3e9ee22a32a094949dcd08ab2d971a2f46a9a879ec42cf8533e105288e7b510` |
| Release directory | `/opt/ecure/releases/20261105-f3e9ee22a32a` |
| Docker image | `ecure:20261105-f3e9ee22a32a` |
| Active container | `ecure`, running and healthy |
| App binding | `127.0.0.1:3000` only |
| Runtime file | Existing `/etc/ecure/runtime.env`, root-owned mode 0600, retained |
| Reverse proxy | Existing Caddy service/configuration, active; no certificate/firewall change |
| Rollback container | `ecure-previous-20261104-b966df941114`, stopped and retained |

The new Linux/amd64 standalone image was built on the VM. Production compilation, TypeScript and route generation passed. A candidate on loopback port 3001 was checked before replacing the active container. The switch retained the previous container/image and included restoration on switch failure. The new container became healthy, `/opt/ecure/current` was updated, and the temporary candidate was stopped/removed. The current container retains `unless-stopped` restart behavior and bounded JSON logging. About 41 GB of root storage remained free.

The image contains the approved public and admin visual updates. Its existing cloud CMS/Auth/submission modes remain **disabled**, because production database/Auth/Turnstile configuration has not been supplied. Deploying the UI does not activate real staff login or real booking delivery, and local test-mode credentials/services were not exposed publicly.

## Executed deployment verification

- VM candidate: all 13 public routes returned HTTP 200; homepage included E-Cure and the official asset path.
- Public HTTPS: all 13 public routes returned HTTP 200 using normal TLS validation.
- Live homepage: brand loading, readable framed logo, visible booking access and no horizontal overflow at **320, 375, 390, 430, 768, 1024, 1280 and 1440px**. This is an eight-width homepage deployment smoke check; the complete all-route responsive matrix remains part of the recorded Stage 3/4 checks and upcoming Stage 5.
- Live mobile navigation: service expansion/navigation and nursing-care booking prefill passed without submitting a form.
- Official JPEG and PNG favicon served byte-for-byte matches to the installed source assets.
- Live homepage images decoded successfully; title and exact `Compassionate Care at Home` headline passed. No JavaScript page errors were observed.
- Live staff sign-in: official branding present, authentication intentionally disabled; private session endpoint returned 503 as configured.
- HTTP redirects to HTTPS with 308. Caddy active and the deployed Docker health check healthy.
- Configured local CMS: corrected E-Cure title/home link/logo confirmed through the browser. Other draft/published content compared unchanged, pending draft retained, and all **64 protected source files** match the Stage 4 baseline.

These were executed deployment checks, not an unperformed claim that Stage 5 is complete. No application source fix was necessary for the generic branding: saved CMS data was the cause. The previously passed Stage 4 suites were not re-run as part of this deployment-only update; the on-VM build and live smoke checks above were run against the deployed release.

Machine-readable evidence and screenshots are retained in `.local/oracle-bluegreen-update/`: `release.json`, `branding-verification.json`, `cms-brand-correction.json`, `public-smoke.json`, and desktop/mobile public-site captures. The CMS backup and credential files are private local maintenance artifacts, not deployment deliverables.

## Rollback reference

If a rollback to the retained original release is explicitly requested, the current state supports these commands on the VM:

```sh
sudo docker stop ecure
sudo docker rename ecure ecure-replaced-20261105-f3e9ee22a32a
sudo docker rename ecure-previous-20261104-b966df941114 ecure
sudo docker start ecure
sudo ln -sfn /opt/ecure/releases/20261104-b966df941114 /opt/ecure/current
```

Check the container names first if a later deployment has occurred. Caddy continues to target the same loopback port; no TLS change is needed for this retained-release rollback.
