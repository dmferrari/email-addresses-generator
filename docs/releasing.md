# Releasing

This project uses manual GitHub Releases.

## Prerequisites

- A clean working tree
- `gh` authenticated against GitHub
- Your SSH signing key loaded in `ssh-agent`

## Release process

1. Verify the repository is clean:

```sh
git status --short
```

2. Run the test suite:

```sh
./test.sh
```

3. Build the release archive:

```sh
./package.sh
```

4. Create a signed tag:

```sh
git tag -s vX.Y.Z -m "vX.Y.Z"
```

5. Push the tag:

```sh
git push origin vX.Y.Z
```

6. Create the GitHub Release and upload the packaged extension:

```sh
gh release create vX.Y.Z dist/test-email-addresses@dmferrari.shell-extension.zip \
  --title "vX.Y.Z" \
  --notes "Release notes here."
```

## Example

The first public release was created as:

```sh
git tag -s v0.1.0 -m "v0.1.0"
git push origin v0.1.0
gh release create v0.1.0 dist/test-email-addresses@dmferrari.shell-extension.zip \
  --title "v0.1.0" \
  --notes "Initial public release."
```

## Notes

- `./package.sh` always writes the archive to `dist/test-email-addresses@dmferrari.shell-extension.zip`
- If the release process changes later, update this file first
