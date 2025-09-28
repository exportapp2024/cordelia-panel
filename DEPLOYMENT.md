# Deployment Guide

## Environment Variables

Bu proje aşağıdaki environment variable'ları kullanır:

### Supabase Configuration
- `VITE_SUPABASE_URL`: Supabase projenizin URL'i
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

### Backend API Configuration
- `VITE_API_BASE_URL`: Railway'de deploy ettiğiniz backend API'nin URL'i

## Local Development

1. Proje root'unda `.env` dosyası oluşturun:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:3000
```

2. Development server'ı başlatın:
```bash
npm run dev
```

## Netlify Deployment

### Environment Variables Setup

Netlify'da environment variable'ları ayarlarken **mutlaka** `VITE_` prefix'ini kullanın:

1. Netlify Dashboard → Site Settings → Environment Variables
2. Aşağıdaki variable'ları ekleyin:

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key-here
VITE_API_BASE_URL = https://your-backend.railway.app
```

### ⚠️ Önemli Notlar:

- **VITE_ prefix zorunludur**: Vite sadece `VITE_` ile başlayan environment variable'ları client-side'da kullanılabilir hale getirir
- Local'deki `.env` dosyasında nasıl `VITE_` kullanıyorsanız, Netlify'da da aynı şekilde kullanmalısınız
- Environment variable'lar build time'da inject edilir, runtime'da değiştiremezsiniz

### Build Settings

Netlify'da build ayarları:
- **Build command**: `npm run build`
- **Publish directory**: `dist`

## Railway Backend URL

Backend URL'inizi `src/lib/config.ts` dosyasında environment variable olarak kullanabilirsiniz:

```typescript
import { buildApiUrl } from './lib/config';

// Kullanım örneği:
const apiUrl = buildApiUrl('/api/users'); // https://your-backend.railway.app/api/users
```

## API Client Usage

```typescript
import { ApiClient } from './lib/api';

// GET request
const users = await ApiClient.get('/api/users');

// POST request
const newUser = await ApiClient.post('/api/users', { name: 'John Doe' });
```
