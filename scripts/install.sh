#!/usr/bin/env sh

set -e

# error codes
# 1 general
# 2 insufficient perms

DEBUG=0
CLEAN_EXIT=0
BINARY_INSTALLED_PATH=""

tempdir=""
filename=""
sig_filename=""
key_filename=""

cleanup() {
  exit_code=$?
  if [ "$exit_code" -ne 0 ] && [ "$CLEAN_EXIT" -ne 1 ]; then
   log "$exit_code"
    log "ERROR: script failed during execution"

    if [ "$DEBUG" -eq 0 ]; then
      log "For more verbose output, re-run this script with the debug flag (./install.sh --debug)"
    fi
  fi

  if [ -n "$tempdir" ]; then
    delete_tempdir
  fi

  clean_exit "$exit_code"
}
trap cleanup EXIT
trap cleanup INT

clean_exit() {
  CLEAN_EXIT=1
  exit "$1"
}

log() {
  # print to stderr
  >&2 echo "$1"
}

log_debug() {
  if [ "$DEBUG" -eq 1 ]; then
    # print to stderr
    >&2 echo "DEBUG: $1"
  fi
}

log_warning() {
  # print to stderr
  >&2 echo "WARNING: $1"
}

delete_tempdir() {
  # log_debug "Removing temp directory"
  # rm -rf "$tempdir"
  tempdir=""
}

linux_shell() {
  user="$(whoami)"
  grep -E "^$user:" < /etc/passwd | cut -f 7 -d ":" | head -1
}

macos_shell() {
  dscl . -read ~/ UserShell | sed 's/UserShell: //'
}

# we currently only support Git Bash for Windows with this script
# so the shell will always be /usr/bin/bash
windows_shell() {
  echo "/usr/bin/bash"
}

# exit code
# 0=installed
# 1=path not writable
# 2=path not in PATH
# 3=path not a directory
# 4=path not found
install_binary() {
  install_dir="$1"
  # defaults to true
  require_dir_in_path="$2"
  # defaults to false
  create_if_not_exist="$3"

  if [ "$require_dir_in_path" != "false" ] && ! is_dir_in_path "$install_dir"; then
    return 2
  fi

  if [ "$create_if_not_exist" = "true" ] && [ ! -e "$install_dir" ]; then
    log_debug "$install_dir is in PATH but doesn't exist"
    log_debug "Creating $install_dir"
    mkdir -m 755 "$install_dir" > /dev/null 2>&1
  fi

  if [ ! -e "$install_dir" ]; then
    return 4
  fi

  if [ ! -d "$install_dir" ]; then
    return 3
  fi

  if ! is_path_writable "$install_dir"; then
    return 1
  fi

  log_debug "Moving binary to $install_dir"
  mv -f "$filename" "$install_dir"
  return 0
}

curl_download() {
  url="$1"
  output_file="$2"
  component="$3"

  # allow curl to fail w/o exiting
  set +e
  headers=$(curl --tlsv1.2 --proto "=https" -w "%{http_code}" --silent --retry 5 -o "$output_file" -LN -D - "$url" 2>&1)
  exit_code=$?
  set -e

  status_code="$(echo "$headers" | tail -1)"

  if [ "$status_code" -ne 200 ]; then
    log_debug "Request failed with http status $status_code"
    log_debug "Response headers:"
    log_debug "$headers"
  fi

  if [ "$exit_code" -ne 0 ]; then
    log "ERROR: curl failed with exit code $exit_code"

    if [ "$exit_code" -eq 60 ]; then
      log ""
      log "Ensure the ca-certificates package is installed for your distribution"
    elif [ "$exit_code" -eq 35 ]; then
      # A TLS/SSL connect error. The SSL handshake failed. The SSL handshake can fail due to numerous different reasons so the error message may offer some additional clues. Maybe the parties could not agree to a SSL/TLS version, an agreeable cipher suite or similar.
      log ""
      log "Failed to complete TLS handshake. Please ensure your system's TLS library is up-to-date (OpenSSL, GnuTLS, libressl, etc.)"
    fi
    clean_exit 1
  fi


  # this could be >255, so print HTTP status code rather than using as return code
  echo "$status_code"
}

# note: wget does not retry on 5xx
wget_download() {
  url="$1"
  output_file="$2"
  component="$3"

  security_flags="--secure-protocol=TLSv1_2 --https-only"
  # determine if using BusyBox wget (bad) or GNU wget (good)
  (wget --help 2>&1 | head -1 | grep -iv busybox > /dev/null 2>&1) || security_flags=""
  # only print this warning once per script invocation
  if [ -z "$security_flags" ] && [ "$component" = "Binary" ]; then
    log_debug "Skipping additional security flags that are unsupported by BusyBox wget"
    # log to stderr b/c this function's stdout is parsed
    log_warning "This system's wget binary is provided by BusyBox. We strongly suggests installing GNU wget, which provides additional security features."
  fi

  # allow wget to fail w/o exiting
  set +e
  # we explicitly disable shellcheck here b/c security_flags isn't parsed properly when quoted
  # shellcheck disable=SC2086
  headers=$(wget $security_flags -q -t 5 -S -O "$output_file" "$url" 2>&1)
  exit_code=$?
  set -e

  status_code="$(echo "$headers" | grep -o -E '^\s*HTTP/[0-9.]+ [0-9]{3}' | tail -1 | grep -o -E '[0-9]{3}')"
  # it's possible for this value to be blank, so confirm that it's a valid status code
  valid_status_code=0
  if expr "$status_code" : '[0-9][0-9][0-9]$'>/dev/null; then
    valid_status_code=1
  fi

  if [ "$exit_code" -ne 0 ]; then
    if [ "$valid_status_code" -eq 1 ]; then
      # print the code and continue
      log_debug "Request failed with http status $status_code"
      log_debug "Response headers:"
      log_debug "$headers"
    else
      # exit immediately
      log "ERROR: wget failed with exit code $exit_code"

      if [ "$exit_code" -eq 5 ]; then
        log ""
        log "Ensure the ca-certificates package is installed for your distribution"
      fi
      clean_exit 1
    fi
  fi


  # this could be >255, so print HTTP status code rather than using as return code
  echo "$status_code"
}

check_http_status() {
  status_code="$1"
  component="$2"

  if [ "$status_code" -ne 200 ]; then
    error="ERROR: $component download failed with status code $status_code."
    if [ "$status_code" -ne 404 ]; then
      error="${error} Please try again."
    fi

    log ""
    log "$error"

    clean_exit 1
  fi
}

is_dir_in_path() {
  dir="$1"
  # ensure dir is the full path and not a substring of some longer path.
  # after performing a regex search, perform another search w/o regex to filter out matches due to special characters in `$dir`
  echo "$PATH" | grep -o -E "(^|:)$dir(:|$)" | grep -q -F "$dir"
}

is_path_writable() {
  dir="$1"
  test -w "$dir"
}

# flag parsing
for arg; do
  if [ "$arg" = "--debug" ]; then
    DEBUG=1
  fi
done


# identify OS
os="unknown"
uname_os=$(uname -s)
case "$uname_os" in
  Darwin)    os="macos"   ;;
  Linux)     os="linux"   ;;
  FreeBSD)   os="freebsd" ;;
  OpenBSD)   os="openbsd" ;;
  NetBSD)    os="netbsd"  ;;
  *MINGW64*) os="win" ;;
  *)
    log "ERROR: Unsupported OS '$uname_os'"
    clean_exit 1
    ;;
esac

log_debug "Detected OS '$os'"

# identify arch
arch="unknown"
uname_machine=$(uname -m)
if [ "$uname_machine" = "i386" ] || [ "$uname_machine" = "i686" ]; then
  arch="i386"
elif [ "$uname_machine" = "amd64" ] || [ "$uname_machine" = "x86_64" ]; then
  arch="amd64"
elif [ "$uname_machine" = "armv6" ] || [ "$uname_machine" = "armv6l" ]; then
  arch="armv6"
elif [ "$uname_machine" = "armv7" ] || [ "$uname_machine" = "armv7l" ]; then
  arch="armv7"
# armv8?
elif [ "$uname_machine" = "arm64" ] || [ "$uname_machine" = "aarch64" ]; then
  arch="arm64"
else
  log "ERROR: Unsupported architecture '$uname_machine'"
  clean_exit 1
fi

log_debug "Detected architecture '$arch'"


# identify format
if [ "$os" = "windows" ]; then
  format="zip"
else
  format="tar"
fi

log_debug "Detected format '$format'"

url=https://github.com/seamapi/seam-cli/releases/download/v0.0.8/seam-$os


set +e
curl_binary="$(command -v curl)"
wget_binary="$(command -v wget)"

# check if curl is available
[ -x "$curl_binary" ]
curl_installed=$? # 0 = yes

# check if wget is available
[ -x "$wget_binary" ]
wget_installed=$? # 0 = yes
set -e

if [ "$curl_installed" -eq 0 ] || [ "$wget_installed" -eq 0 ]; then
  # create hidden temp dir in user's home directory to ensure no other users have write perms
  tempdir="$(mktemp -d ~/.tmp.XXXXXXXX)"
  log_debug "Using temp directory $tempdir"

  log "Downloading Seam CLI"
  file="seam"
  filename="$tempdir/$file"

  if [ "$curl_installed" -eq 0 ]; then
    log_debug "Using $curl_binary for requests"

    # download binary
    log_debug "Downloading binary from $url"
    status_code=$(curl_download "$url" "$filename" "Binary")
    check_http_status "$status_code" "Binary"
  elif [ "$wget_installed" -eq 0 ]; then
    log_debug "Using $wget_binary for requests"

    log_debug "Downloading binary from $url"
    status_code=$(wget_download "$url" "$filename" "Binary")
    check_http_status "$status_code" "Binary"
  fi
else
  log "ERROR: You must have curl or wget installed"
  clean_exit 1
fi


# set appropriate perms
chown "$(id -u):$(id -g)" "$filename"
chmod 755 "$filename"

# install
log "Installing..."
binary_installed=0
found_non_writable_path=0

if [ "$binary_installed" -eq 0 ]; then
  install_dir="/usr/local/bin"
  # capture exit code without exiting
  set +e
  install_binary "$install_dir"
  exit_code=$?
  set -e
  if [ $exit_code -eq 0 ]; then
    binary_installed=1
    BINARY_INSTALLED_PATH="$install_dir"
  elif [ $exit_code -eq 1 ]; then
    found_non_writable_path=1
  fi
fi

if [ "$binary_installed" -eq 0 ]; then
  install_dir="/usr/bin"
  # capture exit code without exiting
  set +e
  install_binary "$install_dir"
  exit_code=$?
  set -e
  if [ $exit_code -eq 0 ]; then
    binary_installed=1
    BINARY_INSTALLED_PATH="$install_dir"
  elif [ $exit_code -eq 1 ]; then
    found_non_writable_path=1
  fi
fi

if [ "$binary_installed" -eq 0 ]; then
  install_dir="/usr/sbin"
  # capture exit code without exiting
  set +e
  install_binary "$install_dir"
  exit_code=$?
  set -e
  if [ $exit_code -eq 0 ]; then
    binary_installed=1
    BINARY_INSTALLED_PATH="$install_dir"
  elif [ $exit_code -eq 1 ]; then
    found_non_writable_path=1
  fi
fi

if [ "$binary_installed" -eq 0 ]; then
  # run again for this directory, but this time create it if it doesn't exist
  # this fixes an issue with clean installs on macOS 12+
  install_dir="/usr/local/bin"
  # capture exit code without exiting
  set +e
  install_binary "$install_dir" "true" "true"
  exit_code=$?
  set -e
  if [ $exit_code -eq 0 ]; then
    binary_installed=1
    BINARY_INSTALLED_PATH="$install_dir"
  elif [ $exit_code -eq 1 ]; then
    found_non_writable_path=1
  fi
fi

if [ "$binary_installed" -eq 0 ]; then
  if [ "$found_non_writable_path" -eq 1 ]; then
    log "Unable to write to bin directory; please re-run with \`sudo\` or adjust your PATH"
    clean_exit 2
  else
    log "No supported bin directories are available; please adjust your PATH"
    clean_exit 1
  fi
fi


delete_tempdir

message="Installed Seam CLI" 
if [ "$CUSTOM_INSTALL_PATH" != "" ]; then
  message="$message to $BINARY_INSTALLED_PATH"
fi
echo "$message"
