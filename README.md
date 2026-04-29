# derdeka/action-check-certificate

[![test](https://github.com/derdeka/action-check-certificate/actions/workflows/test.yml/badge.svg)](https://github.com/derdeka/action-check-certificate/actions/workflows/test.yml)

## versions

- `derdeka/action-check-certificate@v3` - using node24
- `derdeka/action-check-certificate@v2` - using node20
- `derdeka/action-check-certificate@v1` - using node16

## usage
example `.github/workflows/check-domains.yml` workflow - please replace domains:

```
name: check-domains

on:
  workflow_dispatch:
  schedule:
   - cron:  '0 9 * * *'

jobs:
  check-domains:
    timeout-minutes: 5
    runs-on: [self-hosted,linux]
    name: check-domain
    strategy:
      matrix:
        domain:
          - https://google.com
          - https://github.com

    steps:
      - name: Check domain SSL expire date
        id: check-certificate
        uses: derdeka/action-check-certificate@v3
        with:
          url: ${{ matrix.domain }}
          max-cert-expire-days-left: 10
```
