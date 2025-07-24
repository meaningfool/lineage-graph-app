#!/bin/bash

# Test setup script to handle PostCSS config conflicts
# This script temporarily renames the PostCSS config during tests

# Function to backup PostCSS config
backup_postcss_config() {
    if [ -f "postcss.config.mjs" ]; then
        mv postcss.config.mjs postcss.config.mjs.backup
        echo "PostCSS config backed up for testing"
    fi
}

# Function to restore PostCSS config
restore_postcss_config() {
    if [ -f "postcss.config.mjs.backup" ]; then
        mv postcss.config.mjs.backup postcss.config.mjs
        echo "PostCSS config restored"
    fi
}

# Handle cleanup on script exit
trap restore_postcss_config EXIT

# Backup config before tests
backup_postcss_config

# Run the test command passed as arguments
exec "$@" 