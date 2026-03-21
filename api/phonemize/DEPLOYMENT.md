# G2P Microservice Deployment Guide

## Overview

The G2P (Grapheme-to-Phoneme) microservice is now **IMPLEMENTED** and ready for deployment. This service converts text to IPA (International Phonetic Alphabet) phonemes using epitran with graceful fallback.

## What Changed

- ✅ **api/phonemize/index.py**: Full FastAPI implementation with epitran integration
- ✅ **api/phonemize/requirements.txt**: Python dependencies for deployment
- ✅ **api/phonemize/vercel.json**: Python runtime configuration
- ✅ **.env.example**: Added `VITE_PHONEMIZE_API_URL` configuration

## Architecture

```
Client (phonemizeClient.ts)
    ↓ HTTP POST /api/phonemize
FastAPI Service (index.py)
    ↓ Try epitran first
    ↓ Fallback to graphemic approximation
    ↓ Return IPA + syllables + rhyme nucleus
Client receives & processes
```

## Deployment Options

### Option 1: Vercel Serverless (Recommended)

**Status**: ⚠️ Requires espeak-ng system dependency

Vercel's Python runtime may not include espeak-ng. Two solutions:

#### 1a. Deploy without espeak-ng (Graceful Degradation)
The service will run in "fallback mode" - still better than pure client-side:
```bash
vercel --prod
```

Set environment variable:
```bash
vercel env add VITE_PHONEMIZE_API_URL production
# Enter: https://your-app.vercel.app
```

#### 1b. Use Vercel with Docker (Full epitran)
Create `api/phonemize/Dockerfile`:
```dockerfile
FROM python:3.9-slim
RUN apt-get update && apt-get install -y espeak-ng
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY index.py .
CMD ["uvicorn", "index:app", "--host", "0.0.0.0", "--port", "8000"]
```

Deploy to Vercel with Docker support.

### Option 2: Separate Python Service (Docker)

Create a standalone Docker deployment:

```dockerfile
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y espeak-ng && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
WORKDIR /app
COPY api/phonemize/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY api/phonemize/index.py .

# Run service
EXPOSE 8000
CMD ["uvicorn", "index:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t g2p-service .
docker run -p 8000:8000 g2p-service
```

Deploy to:
- Google Cloud Run
- AWS ECS/Fargate
- Azure Container Instances
- Railway.app
- Fly.io

### Option 3: AWS Lambda

Use AWS Lambda with a custom layer containing espeak-ng:
1. Build espeak-ng in Amazon Linux environment
2. Create Lambda layer with espeak-ng binary
3. Deploy Python code as Lambda function
4. Use API Gateway for HTTP endpoint

### Option 4: Local Development

For testing and development:

```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get install espeak-ng

# Or macOS
brew install espeak-ng

# Install Python dependencies
cd api/phonemize
pip install -r requirements.txt

# Run server
python index.py
# Or: uvicorn index:app --reload
```

Set environment variable:
```bash
# .env.local
VITE_PHONEMIZE_API_URL=http://localhost:8000
```

## Testing the Service

### Health Check
```bash
curl https://your-app.vercel.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "epitran_available": true,
  "version": "1.0.0"
}
```

### Phonemize Text
```bash
curl -X POST https://your-app.vercel.app/api/phonemize \
  -H "Content-Type: application/json" \
  -d '{"text": "monde", "lang": "fr"}'
```

Expected response:
```json
{
  "algo_id": "ALGO-ROM",
  "lang": "fr",
  "input": "monde",
  "ipa": "/mɔ̃d/",
  "syllables": [...],
  "rhyme_nucleus": "ɔ̃d",
  "method": "epitran",
  "low_resource": false,
  "metadata": {}
}
```

## Integration with Frontend

Once deployed:

1. Set the environment variable:
   ```bash
   VITE_PHONEMIZE_API_URL=https://your-service-url
   ```

2. The client (`phonemizeClient.ts`) will automatically use the service

3. IPA pipeline will report `method: 'service'` instead of `method: 'client-fallback'`

4. Rhyme detection quality will improve significantly

## Language Support

Currently supported via epitran:
- ✅ French (fra-Latn)
- ✅ Spanish (spa-Latn)
- ✅ Italian (ita-Latn)
- ✅ Portuguese (por-Latn)
- ✅ German (deu-Latn)
- ✅ English (eng-Latn) - *limited, needs CMU dict for accuracy*
- ✅ Russian (rus-Cyrl)
- ✅ Arabic (ara-Arab)
- ✅ Hindi (hin-Deva)
- ✅ Turkish (tur-Latn)
- ✅ Vietnamese (vie-Latn)

Graceful fallback for all other languages.

## Future Enhancements

1. **CMU Dictionary for English**: Improve English G2P accuracy
2. **Advanced Syllabification**: Family-specific rules (currently basic)
3. **Tone Preservation**: Better tone diacritic handling for KWA/CRV
4. **Neural Fallback**: ByT5/CANINE for low-resource languages
5. **Caching**: Redis cache for common words

## Monitoring

Check service availability in production:
```typescript
import { isPhonemizeServiceAvailable } from './utils/phonemizeClient';

const available = await isPhonemizeServiceAvailable();
console.log('G2P Service:', available ? 'ONLINE' : 'OFFLINE (using fallback)');
```

## Rollback

The service deployment is **non-breaking**:
- If service is unavailable, frontend automatically uses client-side fallback
- No changes to existing API contracts
- Can be disabled by removing `VITE_PHONEMIZE_API_URL` environment variable

## Cost Considerations

- **Vercel Serverless**: Free tier includes 100GB-hours/month
- **Docker Services**: $5-20/month (Railway, Fly.io)
- **AWS Lambda**: Pay-per-request (very cheap for moderate usage)

## Next Steps

1. Choose deployment platform
2. Deploy service with espeak-ng support
3. Set `VITE_PHONEMIZE_API_URL` environment variable
4. Verify health check passes
5. Test phonemization with sample text
6. Monitor `method` field in IPA pipeline results

## Support

For issues or questions:
- Check epitran installation: `python -c "import epitran; print('OK')"`
- Check espeak-ng: `espeak-ng --version`
- Review service logs for errors
- Test health endpoint: `/health` and `/api/health`
