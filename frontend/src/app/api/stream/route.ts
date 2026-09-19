import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'ohmnic-vehicle-baselines';

export const runtime = 'nodejs'; // Use nodejs to allow AWS SDK to read ~/.aws/credentials
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            let isClosed = false;

            req.signal.addEventListener('abort', () => {
                isClosed = true;
            });

            while (!isClosed) {
                try {
                    const response = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
                    const data = JSON.stringify({ success: true, data: response.Items || [] });
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                } catch (error) {
                    console.error('DynamoDB SSE Stream Error:', error);
                    // Don't close immediately on error, just log it
                }
                
                if (isClosed) break;
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
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
