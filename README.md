
![seam-cli-chromatic-dark-blog-cover-repo](https://github.com/seamapi/seam-cli/assets/852751/e63bbaaa-d8a9-4417-ac69-d21b172e6de6)


# seam-cli - Seam Command Line Interface

A command line for interacting with [the Seam API](https://seam.co)

## Installation

```bash
curl #... TODO
```

or for npm uses

```bash
npm install -g seam-cli
```

## Usage

Every `seam` command is interactive and will prompt you for any missing
required properties with helpful suggestions. To avoid automatic behavior,
pass `-y`

```bash
# Login to Seam
seam login

# Select your workspace
seam select workspace

# Interactively select commands to execute
seam

# Create a connect webview to connect devices
seam connect-webviews create

# List devices in your workspace
seam devices list

MY_DOOR=$(seam devices get --name "Front Door" --id-only)

# Unlock a lock
seam locks unlock-door --device-id $MY_DOOR

# Create an access code
seam access-codes create --code "1234" --name "My Code"

# List you access codes
seam access-codes list --device-id $MY_DOOR
```
