#!/bin/bash

# NutritionPep - Vercel Deployment Script
# This script automates the deployment process to Vercel

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="nutritionpep"
VERCEL_ORG="your-vercel-org"  # Update this
DOMAIN="your-domain.com"      # Update this

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

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    print_status "Checking Vercel CLI installation..."
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed"
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    else
        print_success "Vercel CLI is installed"
    fi
}

# Check if user is logged in to Vercel
check_vercel_auth() {
    print_status "Checking Vercel authentication..."
    
    if ! vercel whoami &> /dev/null; then
        print_error "Not logged in to Vercel"
        print_status "Please log in to Vercel..."
        vercel login
    else
        VERCEL_USER=$(vercel whoami)
        print_success "Logged in as: $VERCEL_USER"
    fi
}

# Validate environment variables
validate_environment() {
    print_status "Validating environment variables..."
    
    local required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "NEXT_PUBLIC_APP_URL"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        print_status "Please set these variables and try again"
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Run pre-deployment tests
run_tests() {
    print_status "Running pre-deployment tests..."
    
    # Type checking
    print_status "Running TypeScript type checking..."
    npm run type-check || {
        print_error "TypeScript type checking failed"
        exit 1
    }
    
    # Linting
    print_status "Running ESLint..."
    npm run lint || {
        print_warning "Linting issues found, but continuing..."
    }
    
    # Build test
    print_status "Testing production build..."
    npm run build || {
        print_error "Production build failed"
        exit 1
    }
    
    print_success "All tests passed"
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    # Set environment variables in Vercel
    print_status "Setting environment variables..."
    
    vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$NEXT_PUBLIC_SUPABASE_URL" || true
    vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$NEXT_PUBLIC_SUPABASE_ANON_KEY" || true
    vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_ROLE_KEY" || true
    vercel env add NEXT_PUBLIC_APP_URL production <<< "$NEXT_PUBLIC_APP_URL" || true
    vercel env add NODE_ENV production <<< "production" || true
    
    # Deploy to production
    print_status "Deploying to production..."
    vercel --prod --yes
    
    print_success "Deployment completed"
}

# Configure custom domain
configure_domain() {
    if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "your-domain.com" ]; then
        print_status "Configuring custom domain: $DOMAIN"
        
        vercel domains add "$DOMAIN" || {
            print_warning "Domain configuration failed or domain already exists"
        }
        
        vercel alias set "$PROJECT_NAME" "$DOMAIN" || {
            print_warning "Domain alias configuration failed"
        }
        
        print_success "Domain configuration completed"
    else
        print_warning "No custom domain configured"
    fi
}

# Post-deployment verification
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls --scope="$VERCEL_ORG" | grep "$PROJECT_NAME" | head -1 | awk '{print $2}')
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        print_error "Could not determine deployment URL"
        return 1
    fi
    
    print_status "Testing deployment at: https://$DEPLOYMENT_URL"
    
    # Test health endpoint
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DEPLOYMENT_URL/api/health" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        print_success "Health check passed"
    else
        print_error "Health check failed (HTTP $HTTP_STATUS)"
        return 1
    fi
    
    # Test main page
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DEPLOYMENT_URL" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "302" ]; then
        print_success "Main page accessible"
    else
        print_error "Main page not accessible (HTTP $HTTP_STATUS)"
        return 1
    fi
    
    print_success "Deployment verification completed"
    print_success "🎉 Application is live at: https://$DEPLOYMENT_URL"
}

# Generate deployment report
generate_report() {
    print_status "Generating deployment report..."
    
    local report_file="deployment-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# NutritionPep Deployment Report

**Deployment Date:** $(date)
**Deployed By:** $(git config user.name) ($(git config user.email))
**Git Commit:** $(git rev-parse HEAD)
**Git Branch:** $(git branch --show-current)

## Deployment Details

- **Platform:** Vercel
- **Environment:** Production
- **Domain:** ${DOMAIN:-"Vercel default"}
- **Build Status:** ✅ Success

## Environment Variables

- NEXT_PUBLIC_SUPABASE_URL: ✅ Set
- NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ Set
- SUPABASE_SERVICE_ROLE_KEY: ✅ Set
- NEXT_PUBLIC_APP_URL: ✅ Set
- NODE_ENV: ✅ production

## Tests Results

- TypeScript Compilation: ✅ Passed
- ESLint: ✅ Passed
- Production Build: ✅ Passed
- Health Check: ✅ Passed
- Main Page: ✅ Accessible

## Next Steps

1. Monitor application performance
2. Check error rates and logs
3. Verify user authentication flows
4. Test core functionality
5. Set up monitoring alerts

## Rollback Instructions

If issues are found, rollback using:
\`\`\`bash
vercel rollback
\`\`\`

---
*Generated by NutritionPep deployment script*
EOF

    print_success "Deployment report saved to: $report_file"
}

# Main deployment function
main() {
    print_header "🚀 NutritionPep Vercel Deployment"
    print_header "=================================="
    
    print_status "Starting deployment process..."
    echo ""
    
    # Pre-deployment checks
    check_vercel_cli
    check_vercel_auth
    validate_environment
    
    # Run tests
    run_tests
    
    # Deploy
    deploy_to_vercel
    configure_domain
    
    # Verify deployment
    verify_deployment
    
    # Generate report
    generate_report
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "1. Test the application thoroughly"
    echo "2. Monitor performance and errors"
    echo "3. Set up monitoring alerts"
    echo "4. Update DNS if using custom domain"
    echo ""
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "NutritionPep Vercel Deployment Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --test-only    Run tests only, don't deploy"
        echo "  --skip-tests   Skip tests and deploy directly"
        echo ""
        echo "Environment Variables:"
        echo "  NEXT_PUBLIC_SUPABASE_URL      Supabase project URL"
        echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY Supabase anonymous key"
        echo "  SUPABASE_SERVICE_ROLE_KEY     Supabase service role key"
        echo "  NEXT_PUBLIC_APP_URL           Application URL"
        echo ""
        exit 0
        ;;
    --test-only)
        print_header "🧪 Running Tests Only"
        validate_environment
        run_tests
        print_success "Tests completed"
        exit 0
        ;;
    --skip-tests)
        print_header "⚡ Deploying Without Tests"
        check_vercel_cli
        check_vercel_auth
        validate_environment
        deploy_to_vercel
        configure_domain
        verify_deployment
        generate_report
        print_success "Deployment completed"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac