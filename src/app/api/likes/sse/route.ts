import { redis } from '@/lib/redis';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const userName = request.nextUrl.searchParams.get('userName') || '';

  // Create Redis pub/sub client for the edge runtime
  const encoder = new TextEncoder();
  const customEncode = (data: unknown) => encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

  const stream = new ReadableStream({
    async start(controller) {
      const sub = redis.duplicate();

      // Subscribe to like updates channel
      await sub.subscribe(['like-updates'], (err, count) => {
        if (err) {
          console.error('Redis subscribe error:', err);
          return;
        }
        console.log(`Subscribed to ${count} channels`);
      });

      // Set up message handler
      sub.on('message', (channel: string, message: string) => {
        try {
          const data = JSON.parse(message);
          // Only send update if it's not from the current user
          if (data.userName !== userName) {
            controller.enqueue(customEncode(data));
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });
    },
    cancel() {
      // Cleanup subscription when client disconnects
      redis.unsubscribe('like-updates').catch(console.error);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 