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

- *last*: Info object for last version found
- *previous*: Info object for previous version found
- *released*: Info object for last released version found
- *lastVersion*: Last version tag name
- *lastSha*: Last version sha
- *prevVersion*: Previous version tag name
- *prevSha*: Previous version sha
- *releasedVersion*: Last released version tag name
- *releasedSha*: Last released version sha
- *versions*: Array of version info objects
- *releasedVersions*: Array of released version info objects

## Examples

```yaml
jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: panates/gh-version-info@main
        id: version_info

      # run only if 'backend' files were changed
      - name: backend tests
        if: steps.filter.outputs.last.name == 'v1.0.0'
        run: ...    
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
