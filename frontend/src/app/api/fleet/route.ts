// frontend/src/app/api/fleet/route.ts
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'ohmnic-vehicle-baselines';

export async function GET() {
    try {
        const response = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
        return NextResponse.json({ success: true, data: response.Items || [] }, { status: 200 });
    } catch (error: any) {
        console.error('DynamoDB Fleet Pipeline Query Execution Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to stream data from telemetry ledger.' },
            { status: 500 }
        );
    }
}
