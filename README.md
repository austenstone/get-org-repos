# Get Organization's Repositories

This is an [Action](https://docs.github.com/en/actions) to get all an organization's repositories by name.

The primary use case is for repeating a task for all the repositories in an organization.

:warning: A job matrix can generate a maximum of [256](https://docs.github.com/en/actions/using-jobs/using-a-build-matrix-for-your-jobs#:~:text=A%20job%20matrix%20can%20generate%20a%20maximum%20of%20256%20jobs%20per%20workflow%20run.%20This%20limit%20also%20applies%20to%20self%2Dhosted%20runners.) jobs per workflow run :warning:

### Default Workflow
```yml
name: Hello World

on:
  push:
  pull_request:
  workflow_dispatch:

jobs:
  get-org-repos:
    runs-on: ubuntu-latest
    steps:
      - uses: austenstone/get-org-repos@main
        with:
          github-token: ${{ secrets.TOKEN }}
        id: get-org-repos
    outputs:
      repos: ${{ steps.get-org-repos.outputs.repos }}

  print:
    runs-on: ubuntu-latest
    needs: [get-org-repos]
    strategy:
      matrix:
        repo: ${{ fromJson(needs.get-org-repos.outputs.repos) }}
      fail-fast: false
    steps:
      - run: echo "Hello ${{ matrix.repo }}!"
```

### Deliminate String Workflow
```yml
name: Hello World

on:
  push:
  pull_request:
  workflow_dispatch:

jobs:
  get-org-repos:
    runs-on: ubuntu-latest
    steps:
      - uses: austenstone/get-org-repos@main
        with:
          github-token: ${{ secrets.TOKEN }}
          delimiter: ","
        id: get-org-repos
      - run: echo "${{ steps.get-org-repos.outputs.repos }}" > repos.txt
```

### Git Workflow
```yml
name: Sync Repositories

on:
  push:
  pull_request:
  workflow_dispatch:

jobs:
  get-org-repos:
    runs-on: ubuntu-latest
    steps:
      - uses: austenstone/get-org-repos@main
        with:
          github-token: ${{ secrets.TOKEN }}
        id: get-org-repos
    outputs:
      repos: ${{ steps.get-org-repos.outputs.repos }}

  sync:
    needs:
      - get-org-repos
    runs-on: ubuntu-latest
    strategy:
      matrix:
        repo: ${{ fromJson(needs.get-org-repos.outputs.repos) }}
      fail-fast: false
    steps:
      - uses: actions/checkout@v3
        with:
          repository: ${{ github.event.organization.login }}/${{ matrix.repo }}
          token: ${{ secrets.TOKEN }}
      - run: ls -al
```

## ➡️ Input Settings
Various inputs are defined in [`action.yml`](action.yml):

| Name | Description | Default |
| --- | - | - |
| github&#x2011;token | Token to use to authorize. | ${{&nbsp;github.token&nbsp;}} |
| org | The organization name. | ${{&nbsp;github.event.organization.login&nbsp;}} |
| delimiter | The delimiter to use when joining the names. | N/A |

## Further help
To get more help on the Actions see [documentation](https://docs.github.com/en/actions).
