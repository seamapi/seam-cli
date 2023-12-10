# seam-cli - Seam Command Line Interface

A command line for interacting with [the Seam API](https://seam.co)

## Installation

```bash
curl #... TODO
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
