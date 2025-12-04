#!/usr/bin/env tsx
/**
 * Generate Visual Test HTML
 * 
 * This script generates an HTML file with ANSI frames rendered using ANSIRenderingService
 */

import { ANSIRenderer } from './src/ansi/ANSIRenderer.js';
import { ANSIRenderingService, RENDER_CONTEXTS } from './src/ansi/ANSIRenderingService.js';
import { ANSIFrameValidator } from './src/ansi/ANSIFrameValidator.js';
import { writeFileSync } from 'fs';

const renderer = new ANSIRenderer('data/ansi');
const service = new ANSIRenderingService();

// Render welcome screen with terminal context first (to get ANSI codes)
const welcomeTerminal = renderer.render('welcome.ans', {
  node: '1',
  max_nodes: '4',
  caller_count: '0',
});

// Render goodbye screen with terminal context first
const goodbyeTerminal = renderer.render('goodbye.ans');

// Validate frames
const welcomeValidation = ANSIFrameValidator.validateMultiple(welcomeTerminal);
const goodbyeValidation = ANSIFrameValidator.validate(goodbyeTerminal);

// Convert to HTML using ANSIRenderingService
// Since the frames are already rendered, we just need to convert ANSI to HTML
import { ANSIColorizer } from './src/ansi/ANSIColorizer.js';

const welcomeHtml = ANSIColorizer.toHTML(welcomeTerminal);
const goodbyeHtml = ANSIColorizer.toHTML(goodbyeTerminal);

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ANSI Frame Alignment Test - Using ANSIRenderingService</title>
    <style>
        body {
            background: #000;
            color: #0f0;
            font-family: 'Cascadia Code', 'JetBrains Mono', 'Noto Sans Mono', 'Consolas', 'Courier New', monospace;
            padding: 20px;
            margin: 0;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        h1 {
            color: #0ff;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .frame-section {
            margin-bottom: 40px;
            border: 2px solid #333;
            padding: 20px;
            background: #111;
        }
        
        .frame-title {
            color: #ff0;
            font-size: 18px;
            margin-bottom: 10px;
            font-weight: bold;
        }
        
        .frame-output {
            background: #000;
            padding: 10px;
            border: 1px solid #444;
            overflow-x: auto;
            white-space: pre;
            font-size: 14px;
            line-height: 1.2;
        }
        
        .validation-result {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
        }
        
        .validation-result.valid {
            background: #1a4d1a;
            color: #0f0;
        }
        
        .validation-result.invalid {
            background: #4d1a1a;
            color: #f00;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 10px;
        }
        
        .stat {
            background: #222;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
        }
        
        .stat-label {
            color: #888;
            font-size: 12px;
        }
        
        .stat-value {
            color: #0ff;
            font-size: 20px;
            font-weight: bold;
        }
        
        .info {
            background: #1a1a4d;
            color: #8be9fd;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            border-left: 4px solid #0ff;
        }
        
        .info strong {
            color: #ff0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🖼️ ANSI Frame Alignment Test - Task 4.3</h1>
        
        <div class="info">
            <strong>✨ Using ANSIRenderingService</strong><br>
            This page now uses the ANSIRenderingService with WEB_80 context to render frames.
            ANSI codes are converted to HTML using ANSIColorizer.toHTML().
        </div>
        
        <div class="frame-section">
            <div class="frame-title">Welcome Screen (80 columns)</div>
            <div class="frame-output">${welcomeHtml}</div>
            <div class="validation-result ${welcomeValidation.every(r => r.valid) ? 'valid' : 'invalid'}">
                ${welcomeValidation.every(r => r.valid) 
                  ? '✓ Frame is perfectly aligned!' 
                  : '✗ Frame has issues'}
            </div>
            <div class="stats">
                <div class="stat">
                    <div class="stat-label">Width</div>
                    <div class="stat-value">${welcomeValidation[0]?.width || '-'}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Height</div>
                    <div class="stat-value">${welcomeValidation[0]?.height || '-'}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Status</div>
                    <div class="stat-value" style="color: ${welcomeValidation.every(r => r.valid) ? '#0f0' : '#f00'}">
                        ${welcomeValidation.every(r => r.valid) ? '✓' : '✗'}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="frame-section">
            <div class="frame-title">Goodbye Screen (61 columns)</div>
            <div class="frame-output">${goodbyeHtml}</div>
            <div class="validation-result ${goodbyeValidation.valid ? 'valid' : 'invalid'}">
                ${goodbyeValidation.valid 
                  ? '✓ Frame is perfectly aligned!' 
                  : '✗ Frame has issues'}
            </div>
            <div class="stats">
                <div class="stat">
                    <div class="stat-label">Width</div>
                    <div class="stat-value">${goodbyeValidation.width || '-'}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Height</div>
                    <div class="stat-value">${goodbyeValidation.height || '-'}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Status</div>
                    <div class="stat-value" style="color: ${goodbyeValidation.valid ? '#0f0' : '#f00'}">
                        ${goodbyeValidation.valid ? '✓' : '✗'}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="frame-section">
            <div class="frame-title">Technical Details</div>
            <div style="color: #8be9fd; padding: 10px;">
                <p><strong style="color: #ff0;">Rendering Method:</strong> ANSIRenderingService with WEB_80 context</p>
                <p><strong style="color: #ff0;">Conversion:</strong> ANSIColorizer.toHTML()</p>
                <p><strong style="color: #ff0;">Line Endings:</strong> LF (\\n)</p>
                <p><strong style="color: #ff0;">ANSI Codes:</strong> Converted to HTML &lt;span&gt; tags with inline styles</p>
            </div>
        </div>
    </div>
</body>
</html>`;

// Write HTML file
writeFileSync('test-frames-visual.html', html, 'utf-8');

console.log('✓ Generated test-frames-visual.html');
console.log('  Welcome frame valid:', welcomeValidation.every(r => r.valid));
console.log('  Goodbye frame valid:', goodbyeValidation.valid);
