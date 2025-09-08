# 🥗 NutritionPep - Smart Nutrition Tracker

A modern, comprehensive nutrition tracking application built with Next.js, Supabase, and TypeScript. Track your daily nutrition, set goals, and maintain a healthy lifestyle with smart food logging and progress visualization.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![Production](https://img.shields.io/badge/production-ready-green)
![PWA](https://img.shields.io/badge/PWA-enabled-purple)

## 🚀 **Production Ready!**

NutritionPep is fully developed and ready for production deployment. All pre-launch tasks have been completed, including comprehensive testing, security audits, and deployment automation.

**[📋 View Deployment Checklist](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)**

---

## ✨ Features

### **Core Functionality**

- 🔐 **Secure Authentication** - Google OAuth integration with Supabase Auth
- 🍎 **Smart Food Search** - Comprehensive food database with nutritional information
- 📱 **Barcode Scanning** - Instant food logging via barcode recognition
- 📊 **Nutrition Tracking** - Real-time macro and micronutrient monitoring
- 🎯 **Goal Setting** - Personalized nutrition targets and progress tracking
- 📈 **Progress Visualization** - Interactive charts and health insights
- 📱 **PWA Support** - Install as mobile app with offline capabilities

### **User Experience**

- 🎨 **Modern UI/UX** - Clean, intuitive interface built with shadcn/ui
- 📱 **Responsive Design** - Optimized for mobile, tablet, and desktop
- ⚡ **Fast Performance** - Optimized loading times and smooth interactions
- 🌙 **Dark Mode** - Comfortable viewing in any lighting condition
- 🔄 **Real-time Updates** - Instant synchronization across devices

### **Data & Privacy**

- 🔒 **GDPR Compliant** - Complete data export and deletion capabilities
- 🛡️ **Secure by Design** - Row-level security and data encryption
- 📤 **Data Export** - Export your nutrition data anytime
- 🗑️ **Account Deletion** - Complete data removal on request

### **Admin Features**

- 👨‍💼 **Admin Dashboard** - Comprehensive food database management
- 📊 **Analytics** - User engagement and system health metrics
- 🍽️ **Food Management** - Add, edit, and manage food entries
- 📥 **Bulk Import** - CSV import for large food databases

---

## 🛠️ Tech Stack

### **Frontend**

- **Framework:** Next.js 15.5.2 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Icons:** Radix UI Icons + Lucide React

### **Backend**

- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Edge Functions:** Supabase Functions (Deno)
- **Real-time:** Supabase Realtime

### **Deployment & DevOps**

- **Hosting:** Vercel
- **CI/CD:** GitHub Actions (via Vercel)
- **Monitoring:** Built-in health checks
- **Analytics:** Ready for Google Analytics integration

---

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### **Development Setup**

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd nutritionpep
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Fill in your Supabase credentials
   ```

4. **Set up Supabase**

   ```bash
   npx supabase start
   npx supabase db push
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

### **Production Deployment**

1. **Prepare for deployment**

   ```bash
   npm run deploy:check
   ```

2. **Deploy to Vercel**

   ```bash
   ./scripts/deploy-vercel.sh
   ```

3. **Verify deployment**
   ```bash
   node scripts/test-deployment.js
   ```

**[📖 Full Deployment Guide](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)**

---

## 📁 Project Structure

```
nutritionpep/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main application
│   │   ├── onboarding/        # User onboarding flow
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable UI components
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                   # Utility functions
│   │   └── supabase/         # Supabase client configuration
│   └── middleware.ts          # Authentication middleware
├── supabase/
│   ├── functions/            # Edge functions
│   ├── migrations/           # Database migrations
│   └── config.toml          # Supabase configuration
├── public/                   # Static assets
├── docs/                     # Documentation
├── scripts/                  # Deployment and utility scripts
└── package.json
```

---

## 🧪 Testing

### **Run Tests**

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Full test suite
npm run test

# Build test
npm run build
```

### **Deployment Testing**

```bash
# Test deployment readiness
node scripts/test-deployment.js

# Test production build
npm run build:production
```

---

## 📊 Performance

### **Build Metrics**

- **Build Time:** ~8 seconds
- **Bundle Size:** Optimized for production
- **First Load JS:** 102 kB (shared)
- **Largest Route:** 116 kB (/dashboard/scan)

### **Performance Targets**

- ✅ Page load time < 2 seconds
- ✅ Lighthouse score > 90
- ✅ Core Web Vitals optimized
- ✅ Mobile-first responsive design

---

## 🔒 Security

### **Security Features**

- 🔐 Row Level Security (RLS) policies
- 🛡️ Input validation and sanitization
- 🔒 Security headers (XSS, CSRF protection)
- 🌐 HTTPS enforcement
- 🔑 JWT-based authentication
- 📊 Audit logging

### **Privacy Compliance**

- ✅ GDPR compliant data handling
- ✅ Data export functionality
- ✅ Account deletion capability
- ✅ Privacy policy integration
- ✅ Cookie consent management

---

## 📖 Documentation

### **User Guides**

- [Production Deployment](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- [Supabase Setup](docs/SUPABASE_PRODUCTION_SETUP.md)
- [Post-MVP Roadmap](docs/POST_MVP_ROADMAP.md)

### **Development**

- [API Documentation](docs/API.md)
- [Database Schema](supabase/migrations/)
- [Component Library](src/components/ui/)

---

## 🗺️ Roadmap

### **Phase 1: Core Enhancements (Months 1-3)**

- Recipe management and meal planning
- Advanced analytics and insights
- Social features and community challenges

### **Phase 2: Advanced Features (Months 4-6)**

- AI-powered food recognition
- Health device integration
- Personalized nutrition recommendations

### **Phase 3: Platform Expansion (Months 7-9)**

- Native mobile apps (iOS/Android)
- Third-party integrations
- Restaurant and brand partnerships

**[📋 Full Roadmap](docs/POST_MVP_ROADMAP.md)**

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details.

### **Development Workflow**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### **Code Standards**

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Conventional commits

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Supabase** - Backend infrastructure and authentication
- **Vercel** - Hosting and deployment platform
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Next.js** - React framework for production

---

## 📞 Support

### **Getting Help**

- 📧 Email: support@nutritionpep.com
- 💬 Discord: [Join our community]
- 📖 Documentation: [docs.nutritionpep.com]
- 🐛 Issues: [GitHub Issues]

### **Status**

- 🟢 **Production Ready**
- 🔄 **Actively Maintained**
- 📈 **Growing Community**

---

**Built with ❤️ for better nutrition tracking**

_NutritionPep - Track your nutrition, reach your goals, live healthier._
