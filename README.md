# Version Info

Action for retrieving version info

[GitHub Action](https://github.com/features/actions) that extracts version info
from commit tags and github releases.

## Usage

```yaml
- uses: panates/gh-version-info@v1
  with:  
    # Personal access token used to fetch a list of changed files from GitHub REST API.
    # GitHub token from workflow context is used as default value.
    # Default: ${{ github.token }}
    token: ''
```

## Outputs

- *lastVersion*: Last version tag name
- *lastSha*: Last version sha
- *prevVersion*: Previous version tag name
- *prevSha*: Previous version sha
- *releasedVersion*: Last released version tag name
- *releasedSha*: Last released version sha
- *versions*: Array of version info objects
- *releasedVersions*: Array of released version info objects
- *last*: Info object for last version found
- *needRelease*: `true` if last sha differs from released sha, `false` otherwise 
- *previous*: Info object for previous version found
- *released*: Info object for last released version found

## Examples

```yaml
jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: panates/gh-version-info@v2
        id: version_info

      # run only if 'backend' files were changed
      - name: create release
        if: ${{ steps.filter.outputs.needRelease == 'true' }}
        run: ...

      # run only if latest version starts with v1
      - name: v1 tests
        if: ${{ startsWith(steps.filter.outputs.lastVersion, 'v1') }}
        run: ...

      # run only if released version starts with v1
      - name: v1 tests
        if: ${{ startsWith(steps.filter.outputs.releasedVersion, 'v1') }}
        run: ...
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
