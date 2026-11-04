# Oracle Cloud: production-only website image

The repository keeps the source, tests, migration history and local development data needed to maintain E-Cure. Those are not the deployment payload. `.dockerignore` admits only the files required to build the app, and the final Docker stage copies only Next.js standalone output, compiled static files, public assets and the small startup wrapper.

## First connection from Windows

Wait for the instance to show Running. On its details page, locate the public IPv4 address and confirm the operating-system image. Ubuntu platform images use the SSH user `ubuntu`; Oracle Linux uses `opc`. Use the private `.key` file associated with the public key selected when this instance was created. Keep that private file on your computer; do not upload it into the application bundle or paste its contents into chat.

In Windows PowerShell, substitute the actual key path and instance address:

```powershell
ssh -i "C:\Users\Ziyad Usman Khan\Downloads\YOUR_KEY.key" ubuntu@YOUR_PUBLIC_IP
```

For Oracle Linux, replace `ubuntu` with `opc`. On the first connection verify the server host-key fingerprint against the instance where possible; do not disable SSH host-key checking. If OpenSSH reports an overly accessible private key, restrict that file's Windows permissions using Oracle's linked connection instructions.

After connecting, inspect the server before choosing installation commands:

```sh
cat /etc/os-release
uname -m
free -h
df -h /
```

Install Docker Engine using its official instructions for the confirmed operating system. The Ubuntu installation steps do not apply to Oracle Linux. Use Docker's official apt repository for Ubuntu; keep container port 3000 bound to loopback. Configure an attached OCI network security group/security list and host firewall to allow SSH from your administrator address, and HTTP/HTTPS on 80/443 for the public reverse proxy. Keep database and application-internal ports private.

Upload the clean archive from a second local PowerShell window:

```powershell
scp -i "C:\Users\Ziyad Usman Khan\Downloads\YOUR_KEY.key" "C:\Users\Ziyad Usman Khan\Desktop\ECure\dist\ecure-oracle-source.tar.gz" ubuntu@YOUR_PUBLIC_IP:ecure-oracle-source.tar.gz
```

On the VM, extract into a dedicated application directory:

```sh
mkdir -p ~/ecure
tar -xzf ~/ecure-oracle-source.tar.gz -C ~/ecure
cd ~/ecure
```

Continue with the Linux build below. To activate real staff login, CMS and bookings, first configure the production database, hosted HTTPS Auth service, approved deployment domain/origins and real Turnstile credentials. The current default E-Cure profile retains `demo: true`, which intentionally rejects live submissions and retains preview indexing behavior. This requires a reviewed production profile/content configuration before public launch; merely changing an environment mode is insufficient. Do not copy the local test database/Auth settings onto the public VM.

## Build

Create the small source upload from this workspace:

```sh
npm run package:oracle
```

Upload **only `dist/ecure-oracle-source.tar.gz`**, extract it in an application directory on the VM/build host, and run the Docker build there. This avoids transferring the large working folder before Docker's context filtering takes effect. The packaging script uses an explicit input allowlist and verifies archive paths.

Build on Linux or Docker for the VM's CPU architecture. This generates Linux-native Next.js/Sharp dependencies; the Windows `node_modules` folder and existing Windows builds are excluded.

```sh
docker build -t ecure:latest .
```

If building away from the VM, select its matching architecture with Docker Buildx (`linux/amd64` for an x86 VM or `linux/arm64` for an Ampere VM) and publish/load the resulting image using your normal deployment workflow. Only the architecture actually tested in the cleanup report is claimed verified.

Public build settings can be provided with `--build-arg NEXT_PUBLIC_SITE_PROFILE=default` and `--build-arg NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN`. They are build-time public values. Do not pass database URLs, session keys or Auth/Turnstile secrets as build arguments.

`ECURE_STANDALONE_BUILD=true` is set only in the Docker builder. Ordinary local `npm run build` / `npm start` retain their existing workflow. The Docker runtime uses generated `server.js` instead of installing development dependencies.

## Run

For an isolated visual check, leave service modes disabled and publish the container port only on loopback:

```sh
docker run -d --name ecure --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -e CMS_MODE=disabled -e ADMIN_AUTH_MODE=disabled -e SUBMISSIONS_MODE=disabled \
  ecure:latest
```

For the real site, supply production runtime configuration using a private server-side environment file or your secret manager, for example `--env-file /etc/ecure/runtime.env`. Keep it outside the upload/build context and Git. Consult `.env.example` and the authentication/submission architecture guides for the existing contracts: database-backed CMS, live Auth with MFA and approved HTTPS origins, and live submission credentials/settings. No production values are supplied or changed by this cleanup.

The cloud startup wrapper rejects `ADMIN_AUTH_MODE=local` and `SUBMISSIONS_MODE=local-test`, preserving the local server's rule that test modes must not be exposed publicly. Disabled modes remain available for a truthful visual preview. Real bookings, CMS data, staff identities and uploaded CMS media belong in the configured database/services, not in copied local PostgreSQL folders.

Put an HTTPS reverse proxy/load balancer in front of port 3000. Configure the Oracle VCN security rules and host firewall for the chosen public web entry points. The database/Auth services and production schema must already be prepared through the existing controlled setup; this image does not automatically migrate, seed or provision accounts.

## Files excluded from the image

- `.local/`, `.env.local`, credential/provisioning files and local database clusters.
- Windows `node_modules`, `.next` development caches and previous preview builds.
- Test code, Playwright browsers/reports/screenshots, coverage and database test results.
- Git history, design prompts, reference mockups, documentation and migration/maintenance tooling.
- The unused full-resolution source logo; the actual website logo, icon and other required images remain.

Tests and migration tooling stay in the source repository and can run in CI or a separate trusted maintenance environment. Alternate profile support is part of the existing website architecture and remains intact; deleting those definitions would change supported behavior for negligible storage savings.

The initial local cache-removal attempt was blocked by automatic approval review. Those local artifacts remain excluded from the Oracle build even where physical deletion was blocked. See the cleanup report for exact removals, measurements and executed checks.

## References

- [Installed Next.js standalone-output convention](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Docker's Next.js container guide](https://docs.docker.com/guides/nextjs/)
- [Oracle Compute security rules and host firewalls](https://docs.oracle.com/en-us/iaas/Content/Security/Reference/compute_security.htm)
- [Oracle SSH connection instructions, including Windows key permissions](https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/connect-to-linux-instance.htm)
- [Docker Engine installation on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
