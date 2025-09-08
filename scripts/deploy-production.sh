#!/bin/bash

# NutritionPep - Production Deployment Script
# This script helps automate the production deployment process

set -e  # Exit on any error

echo "🚀 NutritionPep Production Deployment Script"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Check environment variables
check_environment() {
    print_status "Checking environment variables..."
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        print_error "NEXT_PUBLIC_SUPABASE_URL is not set"
        exit 1
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        print_error "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
        exit 1
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        print_error "SUPABASE_SERVICE_ROLE_KEY is not set"
        exit 1
    fi
    
    if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
        print_error "NEXT_PUBLIC_APP_URL is not set"
        exit 1
    fi
    
    print_success "Environment variables are configured"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Type checking
    print_status "Running TypeScript type checking..."
    npm run build --dry-run || {
        print_error "TypeScript compilation failed"
        exit 1
    }
    
    # Linting
    print_status "Running ESLint..."
    npm run lint || {
        print_warning "Linting issues found, but continuing..."
    }
    
    print_success "Tests completed"
}

# Build application
build_application() {
    print_status "Building application for production..."
    
    # Clean previous build
    rm -rf .next
    
    # Install dependencies
    npm ci --only=production
    
    # Build application
    npm run build || {
        print_error "Build failed"
        exit 1
    }
    
    print_success "Application built successfully"
}

# Security check
security_check() {
    print_status "Running security checks..."
    
    # Check for sensitive data in environment
    if grep -r "localhost" .env* 2>/dev/null; then
        print_warning "Found localhost references in environment files"
    fi
    
    # Check for development URLs
    if grep -r "http://" src/ 2>/dev/null; then
        print_warning "Found HTTP URLs in source code (should use HTTPS in production)"
    fi
    
    print_success "Security checks completed"
}

# Performance check
performance_check() {
    print_status "Running performance checks..."
    
    # Check bundle size
    if [ -d ".next" ]; then
        BUNDLE_SIZE=$(du -sh .next | cut -f1)
        print_status "Bundle size: $BUNDLE_SIZE"
    fi
    
    # Check for large dependencies
    print_status "Checking for large dependencies..."
    npm ls --depth=0 --long 2>/dev/null | head -20
    
    print_success "Performance checks completed"
}

# Database migration check
database_check() {
    print_status "Checking database migrations..."
    
    if [ -d "supabase/migrations" ]; then
        MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
        print_status "Found $MIGRATION_COUNT migration files"
        
        if [ $MIGRATION_COUNT -eq 0 ]; then
            print_warning "No migration files found"
        fi
    else
        print_warning "No migrations directory found"
    fi
    
    print_success "Database checks completed"
}

# Deployment summary
deployment_summary() {
    echo ""
    echo "📋 Deployment Summary"
    echo "===================="
    echo "Environment: Production"
    echo "App URL: $NEXT_PUBLIC_APP_URL"
    echo "Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
    echo "Node Environment: $NODE_ENV"
    echo "Build Date: $(date)"
    echo ""
}

# Main deployment process
main() {
    echo "Starting deployment process..."
    echo ""
    
    check_dependencies
    check_environment
    security_check
    database_check
    run_tests
    build_application
    performance_check
    
    deployment_summary
    
    print_success "🎉 Production deployment preparation completed!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy to your hosting platform (Vercel, Netlify, etc.)"
    echo "2. Configure domain and SSL"
    echo "3. Set up monitoring and analytics"
    echo "4. Run post-deployment tests"
    echo ""
    echo "For detailed instructions, see docs/PRODUCTION_DEPLOYMENT.md"
}

# Run main function
main "$@"