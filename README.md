# Version Info
Action for retrieving version info


[GitHub Action](https://github.com/features/actions) that extracts version info 
from commit tags and github releases.


## Usage

```yaml
- uses: panates/gh-version-info@v1
  with:
    # Indicates to retrieve info from released tags only.
    # Default: 'true'
    released-only: 'true'

    # Personal access token used to fetch a list of changed files from GitHub REST API.
    # GitHub token from workflow context is used as default value.
    # Default: ${{ github.token }}
    token: ''
```

## Outputs

- *count*: Number of version info found
- *list*: Array of version info objects
- *last*: Info object for last version found
- *previous*: Info object for previous version found
- *first*: Info object for first version found

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
