# inactive-user-sample

This action retrun users in your organizations.
## Inputs

## `token`

**Required** PAT token for accesing API. No Default value.

## `orgs-name`

**Required** Organization name for accesing users. No Default value.

## Outputs

## `status`

JSON response.

## Example usage

uses: actions/inactive-user-sample@v1.1
with:
  token: 'token'
  orgs-name: 'internal-test'