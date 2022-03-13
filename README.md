# TypeScript Action Template

This repository serves as a [template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template) for TypeScript [Actions](https://docs.github.com/en/actions).
<br>For JavaScript see [austenstone/action-javascript](https://github.com/austenstone/action-javascript).

## 🧑‍💻 Development
Use [ts-node-dev](https://github.com/wclr/ts-node-dev) for a hot-reload dev environment.
```
npm run dev
```

## 🔨 Build
Build the project with [ncc](https://github.com/vercel/ncc).<br>The build artifacts will be stored in a single file `dist/index.js`.
```
npm run build
```

## 🧪 Test
Test the project with [jest](https://github.com/facebook/jest).
```
npm test
```

## 🧹 Lint
Linting is done with [eslint](https://github.com/eslint/eslint).
```
npm run lint
```

## 🏃 Usage
[Create a workflow](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file) (eg: [`.github/workflows/run.yml`](.github/workflows/usage.yaml))

### Default Workflow
```yml
name: "Add to Project"
on:
  workflow_dispatch:

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: austenstone/action-typescript@main
```

## ➡️ Input Settings
Various inputs are defined in [`action.yml`](action.yml):

| Name | Description | Default |
| --- | - | - |
| github&#x2011;token | Token to use to authorize. | ${{&nbsp;github.token&nbsp;}} |

## Further help
To get more help on the Actions see [documentation](https://docs.github.com/en/actions).
