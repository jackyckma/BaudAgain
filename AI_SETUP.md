# AI Setup Guide for BaudAgain BBS

This guide will help you set up AI features for your BaudAgain BBS.

## Quick Start

### 1. Get Your Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (it starts with `sk-ant-`)

### 2. Add Your API Key

**Option A: Using .env file (Recommended)**

1. Open the `.env` file in the project root
2. Replace the empty value with your API key:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
   ```
3. Save the file

**Option B: Using environment variable**

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

### 3. Verify Setup

Start the server:
```bash
npm run dev
```

The server should start without errors. If you see an error about missing API key, double-check your `.env` file.

## Configuration Options

### AI Models

BaudAgain supports different Claude models. Edit `config.yaml` to change:

```yaml
ai:
  model: "claude-3-5-haiku-20241022"  # Fast and economical
  # model: "claude-3-5-sonnet-20241022"  # More capable, slower
```

Or set via environment variable:
```bash
AI_MODEL=claude-3-5-sonnet-20241022
```

### AI SysOp Personality

Customize the AI SysOp's personality in `config.yaml`:

```yaml
ai:
  sysop:
    enabled: true
    personality: |
      You are the AI SysOp of BaudAgain BBS...
      [Customize this text to change the AI's behavior]
```

### Disable AI Features

To run the BBS without AI (for testing):

```yaml
ai:
  sysop:
    enabled: false
  doors:
    enabled: false
```

## Cost Management

### Development vs Production

- **Development**: Use `claude-3-5-haiku-20241022` (cheaper, faster)
- **Production**: Use `claude-3-5-sonnet-20241022` (more capable)

### Rate Limiting

BaudAgain includes built-in rate limiting to control costs:

```yaml
security:
  rateLimit:
    doorRequestsPerMinute: 10  # Limit AI door game requests
```

### Monitor Usage

Check your usage at [Anthropic Console](https://console.anthropic.com/settings/usage)

## Troubleshooting

### Error: "ANTHROPIC_API_KEY environment variable is required"

**Solution**: Make sure your `.env` file exists and contains your API key.

### Error: "Anthropic API error: invalid_api_key"

**Solution**: 
1. Verify your API key is correct
2. Check that it starts with `sk-ant-`
3. Make sure there are no extra spaces or quotes

### AI responses are slow

**Solution**: 
1. Switch to Haiku model for faster responses
2. Check your internet connection
3. Verify Anthropic API status at [status.anthropic.com](https://status.anthropic.com)

### AI features not working

**Solution**:
1. Check that `ai.sysop.enabled` is `true` in `config.yaml`
2. Verify your API key is set correctly
3. Check server logs for error messages

## Security Best Practices

1. ✅ **Never commit your `.env` file** - It's already in `.gitignore`
2. ✅ **Never share your API key** - Treat it like a password
3. ✅ **Rotate keys regularly** - Generate new keys periodically
4. ✅ **Use different keys** - Use separate keys for dev and production
5. ✅ **Monitor usage** - Set up billing alerts in Anthropic Console

## Future AI Providers

BaudAgain is designed to support multiple AI providers:

- ✅ **Anthropic Claude** (Currently supported)
- ⏳ **OpenAI GPT** (Planned)
- ⏳ **Ollama** (Planned - for local/offline AI)

To switch providers in the future, just update `config.yaml`:

```yaml
ai:
  provider: "openai"  # or "ollama"
  model: "gpt-4"
```

## Getting Help

- Check the [Anthropic Documentation](https://docs.anthropic.com/)
- Review BaudAgain logs for error messages
- Open an issue on GitHub

---

**Ready to go?** Your AI SysOp is waiting to welcome users to your BBS! 🤖✨
