/**
 * Service Worker for NutritionPep
 * Provides offline caching and background sync capabilities
 */

const CACHE_NAME = 'nutritionpep-v1';
const STATIC_CACHE_NAME = 'nutritionpep-static-v1';
const DYNAMIC_CACHE_NAME = 'nutritionpep-dynamic-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/today',
  '/dashboard/search',
  '/dashboard/favorites',
  '/login',
  '/register',
  '/manifest.json',
  // Add critical CSS and JS files
  '/_next/static/css/',
  '/_next/static/js/',
];

// API routes to cache with different strategies
const API_CACHE_ROUTES = {
  // Cache food data for longer periods
  foods: {
    pattern: /\/api\/foods\//,
    strategy: 'cache-first',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  // Cache user favorites
  favorites: {
    pattern: /\/api\/user\/favorites/,
    strategy: 'network-first',
    maxAge: 5 * 60 * 1000, // 5 minutes
  },
  // Cache recent foods
  recent: {
    pattern: /\/api\/user\/recent-foods/,
    strategy: 'network-first',
    maxAge: 2 * 60 * 1000, // 2 minutes
  },
  // Cache search results briefly
  search: {
    pattern: /\/api\/foods\/search/,
    strategy: 'network-first',
    maxAge: 60 * 1000, // 1 minute
  },
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle API requests with specific strategies
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static assets
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }
  
  // Handle navigation requests (pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  
  // Default: network first for everything else
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// Handle API requests with different caching strategies
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Find matching API route configuration
  const routeConfig = Object.values(API_CACHE_ROUTES).find(
    config => config.pattern.test(url.pathname)
  );
  
  if (!routeConfig) {
    // No specific caching strategy, use network-only
    return fetch(request);
  }
  
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  if (routeConfig.strategy === 'cache-first') {
    return handleCacheFirst(request, cache, routeConfig.maxAge);
  } else if (routeConfig.strategy === 'network-first') {
    return handleNetworkFirst(request, cache, routeConfig.maxAge);
  }
  
  return fetch(request);
}

// Cache-first strategy
async function handleCacheFirst(request, cache, maxAge) {
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    const cachedDate = new Date(cachedResponse.headers.get('sw-cached-date'));
    const now = new Date();
    
    if (now - cachedDate < maxAge) {
      console.log('Service Worker: Serving from cache', request.url);
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
      console.log('Service Worker: Cached API response', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, serving stale cache', request.url);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function handleNetworkFirst(request, cache, maxAge) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
      console.log('Service Worker: Updated cache from network', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const cachedDate = new Date(cachedResponse.headers.get('sw-cached-date'));
      const now = new Date();
      
      if (now - cachedDate < maxAge * 2) { // Allow stale cache when offline
        return cachedResponse;
      }
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Handle static assets
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Serve offline page or cached version
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match('/') || 
                          await cache.match('/dashboard');
    
    return cachedResponse || new Response('App not available offline', {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Helper function to check if URL is a static asset
function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/') ||
         url.pathname.startsWith('/static/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.jpeg') ||
         url.pathname.endsWith('.gif') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico') ||
         url.pathname.endsWith('.webp') ||
         url.pathname.endsWith('.avif');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'diary-sync') {
    event.waitUntil(syncDiaryEntries());
  } else if (event.tag === 'favorites-sync') {
    event.waitUntil(syncFavorites());
  }
});

// Sync diary entries when back online
async function syncDiaryEntries() {
  try {
    // Get pending diary entries from IndexedDB
    const pendingEntries = await getPendingDiaryEntries();
    
    for (const entry of pendingEntries) {
      try {
        const response = await fetch('/api/diary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry.data)
        });
        
        if (response.ok) {
          await removePendingDiaryEntry(entry.id);
          console.log('Service Worker: Synced diary entry', entry.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync diary entry', entry.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Sync favorites when back online
async function syncFavorites() {
  try {
    // Get pending favorite actions from IndexedDB
    const pendingActions = await getPendingFavoriteActions();
    
    for (const action of pendingActions) {
      try {
        const response = await fetch('/api/user/favorites', {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action.data)
        });
        
        if (response.ok) {
          await removePendingFavoriteAction(action.id);
          console.log('Service Worker: Synced favorite action', action.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync favorite action', action.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Favorites sync failed', error);
  }
}

// IndexedDB helper functions (simplified - would need full implementation)
async function getPendingDiaryEntries() {
  // Implementation would use IndexedDB to get pending entries
  return [];
}

async function removePendingDiaryEntry(id) {
  // Implementation would remove entry from IndexedDB
}

async function getPendingFavoriteActions() {
  // Implementation would use IndexedDB to get pending actions
  return [];
}

async function removePendingFavoriteAction(id) {
  // Implementation would remove action from IndexedDB
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_DIARY_ENTRY':
      // Cache diary entry for offline access
      cacheDiaryEntry(data);
      break;
      
    case 'CACHE_FAVORITE_ACTION':
      // Cache favorite action for offline sync
      cacheFavoriteAction(data);
      break;
      
    default:
      console.log('Service Worker: Unknown message type', type);
  }
});

async function cacheDiaryEntry(entryData) {
  // Store diary entry in IndexedDB for offline sync
  console.log('Service Worker: Caching diary entry for offline sync');
}

async function cacheFavoriteAction(actionData) {
  // Store favorite action in IndexedDB for offline sync
  console.log('Service Worker: Caching favorite action for offline sync');
}