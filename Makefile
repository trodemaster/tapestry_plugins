# Seattle Business Journal Tapestry Plugin Makefile

# Variables
PLUGIN_NAME = seattle-business-journal
PLUGIN_DIR = Connectors/com.bizjournals.seattle
OUTPUT_FILE = $(PLUGIN_NAME).tapestry
VERSION = 1.0.0

# Default target
.PHONY: all
all: build

# Build the plugin package
.PHONY: build
build: clean
	@echo "Building $(PLUGIN_NAME) plugin..."
	@cd $(PLUGIN_DIR) && zip -r ../../$(OUTPUT_FILE) .
	@echo "✅ Plugin built: $(OUTPUT_FILE)"
	@ls -la $(OUTPUT_FILE)

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	@rm -f *.tapestry
	@echo "✅ Cleanup complete"

# Validate plugin files exist
.PHONY: validate
validate:
	@echo "Validating plugin files..."
	@test -f $(PLUGIN_DIR)/plugin-config.json || (echo "❌ Missing plugin-config.json" && exit 1)
	@test -f $(PLUGIN_DIR)/plugin.js || (echo "❌ Missing plugin.js" && exit 1)
	@test -f $(PLUGIN_DIR)/ui-config.json || (echo "❌ Missing ui-config.json" && exit 1)
	@test -f $(PLUGIN_DIR)/discovery.json || (echo "❌ Missing discovery.json" && exit 1)
	@test -f $(PLUGIN_DIR)/README.md || (echo "❌ Missing README.md" && exit 1)
	@test -f $(PLUGIN_DIR)/suggestions.json || (echo "❌ Missing suggestions.json" && exit 1)
	@echo "✅ All required files present"

# Show plugin info
.PHONY: info
info:
	@echo "Plugin: $(PLUGIN_NAME)"
	@echo "Version: $(VERSION)"
	@echo "Source: $(PLUGIN_DIR)"
	@echo "Output: $(OUTPUT_FILE)"
	@echo ""
	@echo "Files in plugin:"
	@ls -la $(PLUGIN_DIR)/

# Release build with validation
.PHONY: release
release: validate build
	@echo "🚀 Release build complete: $(OUTPUT_FILE)"

# Install to Tapestry Loom (if Connectors folder is set up)
.PHONY: install-loom
install-loom: build
	@if [ -d "$$HOME/Library/Containers/com.iconfactory.Tapestry-Loom/Data/Documents/Connectors" ]; then \
		cp -r $(PLUGIN_DIR) "$$HOME/Library/Containers/com.iconfactory.Tapestry-Loom/Data/Documents/Connectors/"; \
		echo "✅ Plugin installed to Tapestry Loom"; \
	else \
		echo "⚠️  Tapestry Loom Connectors folder not found"; \
		echo "   Manual installation required"; \
	fi

# Help target
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  build        - Build the plugin package"
	@echo "  clean        - Remove build artifacts"
	@echo "  validate     - Check that all required files exist"
	@echo "  info         - Show plugin information"
	@echo "  release      - Build with validation"
	@echo "  install-loom - Install to Tapestry Loom (development)"
	@echo "  help         - Show this help message" 