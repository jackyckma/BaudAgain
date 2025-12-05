/**
 * Test script to verify art gallery emoji frame alignment via WebSocket
 */
import WebSocket from 'ws';

const WS_URL = 'ws://localhost:8080/ws';

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testArtGallery(): Promise<void> {
  const ws = new WebSocket(WS_URL);
  const messages: string[] = [];
  let lastMessage = '';
  
  ws.on('open', () => console.log('Connected to BBS'));
  ws.on('message', (data: Buffer) => {
    const msg = data.toString();
    messages.push(msg);
    lastMessage = msg;
  });
  ws.on('error', (err) => console.error('WebSocket error:', err));
  
  await sleep(1000);
  
  console.log('1. Logging in as sysop...');
  ws.send('sysop');
  await sleep(1500);
  
  console.log('2. Entering password...');
  ws.send('admin123');
  await sleep(2000);
  
  console.log('3. Opening Art Gallery (A)...');
  ws.send('A');
  await sleep(1500);
  
  console.log('4. Viewing art piece #2 (dog face)...');
  ws.send('2');
  await sleep(1500);

  const artMessage = lastMessage;
  console.log('\n=== ART PIECE OUTPUT (dog face) ===');
  console.log(artMessage);
  console.log('=== END OUTPUT ===\n');
  
  // Analyze frame alignment
  const lines = artMessage.split('\r\n');
  console.log('Analyzing frame alignment...\n');
  
  let frameWidth = 0;
  let misalignments = 0;
  for (let i = 0; i < lines.length; i++) {
    const stripped = stripAnsi(lines[i]);
    if (stripped.startsWith('╔') || stripped.startsWith('║') || stripped.startsWith('╚') || stripped.startsWith('╠')) {
      if (stripped.startsWith('╔')) {
        frameWidth = stripped.length;
        console.log(`Frame top border: ${stripped.length} chars`);
      } else {
        const diff = stripped.length - frameWidth;
        if (diff !== 0) {
          console.log(`❌ Line ${i + 1}: ${stripped.length} chars (diff: ${diff > 0 ? '+' : ''}${diff})`);
          console.log(`   Content: "${stripped.substring(0, 60)}..."`);
          misalignments++;
        } else {
          console.log(`✅ Line ${i + 1}: ${stripped.length} chars - OK`);
        }
      }
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total misalignments: ${misalignments}`);
  if (misalignments === 0) {
    console.log('✅ All frame lines are properly aligned!');
  } else {
    console.log('❌ Frame alignment issues detected');
  }
  
  ws.close();
}

testArtGallery().catch(console.error);
