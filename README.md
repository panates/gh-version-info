# Version Info
Action for retrieving version info


[GitHub Action](https://github.com/features/actions) that extracts version info from commit tags and github releases.


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

- For each filter, it sets output variable named by the filter to the text:
    - `'true'` - if **any** of changed files matches any of filter rules
    - `'false'` - if **none** of changed files matches any of filter rules
- For each filter, it sets an output variable with the name `${FILTER_NAME}_count` to the count of matching files.
- If enabled, for each filter it sets an output variable with the name `${FILTER_NAME}_files`. It will contain a list of all files matching the filter.
- `changes` - JSON array with names of all filters matching any of the changed files.

## Examples

### Conditional execution

<details>
  <summary>Execute <b>step</b> in a workflow job only if some file in a subfolder is changed</summary>

```yaml
jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          backend:
            - 'backend/**'
          frontend:
            - 'frontend/**'

    # run only if 'backend' files were changed
    - name: backend tests
      if: steps.filter.outputs.backend == 'true'
      run: ...

    # run only if 'frontend' files were changed
    - name: frontend tests
      if: steps.filter.outputs.frontend == 'true'
      run: ...

    # run if 'backend' or 'frontend' files were changed
    - name: e2e tests
      if: steps.filter.outputs.backend == 'true' || steps.filter.outputs.frontend == 'true'
      run: ...
```

</details>

<details>
  <summary>Execute <b>job</b> in a workflow only if some file in a subfolder is changed</summary>

```yml
jobs:
  # JOB to run change detection
  changes:
    runs-on: ubuntu-latest
    # Required permissions
    permissions:
      pull-requests: read
    # Set job outputs to values from filter step
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
    steps:
    # For pull requests it's not necessary to checkout the code
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          backend:
            - 'backend/**'
          frontend:
            - 'frontend/**'

  # JOB to build and test backend code
  backend:
    needs: changes
    if: ${{ needs.changes.outputs.backend == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - ...

  # JOB to build and test frontend code
  frontend:
    needs: changes
    if: ${{ needs.changes.outputs.frontend == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - ...
```

</details>

<details>
<summary>Use change detection to configure matrix job</summary>

```yaml
jobs:
  # JOB to run change detection
  changes:
    runs-on: ubuntu-latest
    # Required permissions
    permissions:
      pull-requests: read
    outputs:
      # Expose matched filters as job 'packages' output variable
      packages: ${{ steps.filter.outputs.changes }}
    steps:
    # For pull requests it's not necessary to checkout the code
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          package1: src/package1
          package2: src/package2

  # JOB to build and test each of modified packages
  build:
    needs: changes
    strategy:
      matrix:
        # Parse JSON array containing names of all filters matching any of changed files
        # e.g. ['package1', 'package2'] if both package folders contains changes
        package: ${{ fromJSON(needs.changes.outputs.packages) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - ...
```

</details>

### Change detection workflows

<details>
  <summary><b>Pull requests:</b> Detect changes against PR base branch</summary>

```yaml
on:
  pull_request:
    branches: # PRs to the following branches will trigger the workflow
      - master
      - develop
jobs:
  build:
    runs-on: ubuntu-latest
    # Required permissions
    permissions:
      pull-requests: read
    steps:
    - uses: actions/checkout@v4
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: ... # Configure your filters
```

</details>

<details>
  <summary><b>Feature branch:</b> Detect changes against configured base branch</summary>

```yaml
on:
  push:
    branches: # Push to following branches will trigger the workflow
      - feature/**
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        # This may save additional git fetch roundtrip if
        # merge-base is found within latest 20 commits
        fetch-depth: 20
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        base: develop # Change detection against merge-base with this branch
        filters: ... # Configure your filters
```

</details>

<details>
  <summary><b>Long lived branches:</b> Detect changes against the most recent commit on the same branch before the push</summary>

```yaml
on:
  push:
    branches: # Push to the following branches will trigger the workflow
      - master
      - develop
      - release/**
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        # Use context to get the branch where commits were pushed.
        # If there is only one long-lived branch (e.g. master),
        # you can specify it directly.
        # If it's not configured, the repository default branch is used.
        base: ${{ github.ref }}
        filters: ... # Configure your filters
```

</details>

<details>
  <summary><b>Local changes:</b> Detect staged and unstaged local changes</summary>

```yaml
on:
  push:
    branches: # Push to following branches will trigger the workflow
      - master
      - develop
      - release/**
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

      # Some action that modifies files tracked by git (e.g. code linter)
    - uses: johndoe/some-action@v1

      # Filter to detect which files were modified
      # Changes could be, for example, automatically committed
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        base: HEAD
        filters: ... # Configure your filters
```

</details>

### Advanced options

<details>
  <summary>Define filter rules in own file</summary>

```yaml
- uses: dorny/paths-filter@v3
      id: filter
      with:
        # Path to file where filters are defined
        filters: .github/filters.yaml
```

</details>

<details>
  <summary>Use YAML anchors to reuse path expression(s) inside another rule</summary>

```yaml
- uses: dorny/paths-filter@v3
      id: filter
      with:
        # &shared is YAML anchor,
        # *shared references previously defined anchor
        # src filter will match any path under common, config and src folders
        filters: |
          shared: &shared
            - common/**
            - config/**
          src:
            - *shared
            - src/**
```

</details>

<details>
  <summary>Consider if file was added, modified or deleted</summary>

```yaml
- uses: dorny/paths-filter@v3
      id: filter
      with:
        # Changed file can be 'added', 'modified', or 'deleted'.
        # By default, the type of change is not considered.
        # Optionally, it's possible to specify it using nested
        # dictionary, where the type of change composes the key.
        # Multiple change types can be specified using `|` as the delimiter.
        filters: |
          shared: &shared
            - common/**
            - config/**
          addedOrModified:
            - added|modified: '**'
          allChanges:
            - added|deleted|modified: '**'
          addedOrModifiedAnchors:
            - added|modified: *shared
```

</details>

<details>
  <summary>Detect changes in folder only for some file extensions</summary>

```yaml
- uses: dorny/paths-filter@v3
      id: filter
      with:
        # This makes it so that all the patterns have to match a file for it to be
        # considered changed. Because we have the exclusions for .jpeg and .md files
        # the end result is that if those files are changed they will be ignored
        # because they don't match the respective rules excluding them.
        #
        # This can be leveraged to ensure that you only build & test software changes
        # that have real impact on the behavior of the code, e.g. you can set up your
        # build to run when Typescript/Rust/etc. files are changed but markdown
        # changes in the diff will be ignored and you consume less resources to build.
        predicate-quantifier: 'every'
        filters: |
          backend:
            - 'pkg/a/b/c/**'
            - '!**/*.jpeg'
            - '!**/*.md'
```

</details>

### Custom processing of changed files

<details>
  <summary>Passing list of modified files as command line args in Linux shell</summary>

```yaml
- uses: dorny/paths-filter@v3
  id: filter
  with:
    # Enable listing of files matching each filter.
    # Paths to files will be available in `${FILTER_NAME}_files` output variable.
    # Paths will be escaped and space-delimited.
    # Output is usable as command-line argument list in Linux shell
    list-files: shell

    # In this example changed files will be checked by linter.
    # It doesn't make sense to lint deleted files.
    # Therefore we specify we are only interested in added or modified files.
    filters: |
      markdown:
        - added|modified: '*.md'
- name: Lint Markdown
  if: ${{ steps.filter.outputs.markdown == 'true' }}
  run: npx textlint ${{ steps.filter.outputs.markdown_files }}
```

</details>

<details>
  <summary>Passing list of modified files as JSON array to another action</summary>

```yaml
- uses: dorny/paths-filter@v3
  id: filter
  with:
    # Enable listing of files matching each filter.
    # Paths to files will be available in `${FILTER_NAME}_files` output variable.
    # Paths will be formatted as JSON array
    list-files: json

    # In this example all changed files are passed to the following action to do
    # some custom processing.
    filters: |
      changed:
        - '**'
- name: Lint Markdown
  uses: johndoe/some-action@v1
  with:
    files: ${{ steps.filter.outputs.changed_files }}
```

</details>

## See also

- [test-reporter](https://github.com/dorny/test-reporter) - Displays test results from popular testing frameworks directly in GitHub

## License

The scripts and documentation in this project are released under the [MIT License](https://github.com/dorny/paths-filter/blob/master/LICENSE)
