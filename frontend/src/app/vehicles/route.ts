// frontend/src/app/api/vehicles/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'ohmnic-vehicle-baselines';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session.userId) return NextResponse.json({ error: 'Unauthorized access request.' }, { status: 401 });

        const { vin, depot } = await request.json();
        if (!vin || !depot) return NextResponse.json({ error: 'Missing target VIN or Depot.' }, { status: 400 });

        const newAsset = {
            vin, depot,
            status: 'NOMINAL',
            anomaly_score: 0.0,
            last_updated: new Date().toISOString(),
            telemetry: {
                pack_voltage: 400.0, pack_current: 0.0, pack_temp_c: 25.0,
                cell_voltage_delta: 0.010, max_cell_temp_c: 25.5, charge_rate_kw: 0.0
            },
            shap_attribution: {
                pack_voltage: 0.0, pack_current: 0.0, pack_temp_c: 0.0,
                cell_voltage_delta: 0.0, max_cell_temp_c: 0.0, charge_rate_kw: 0.0
            }
        };

        await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: newAsset }));
        return NextResponse.json({ success: true, message: `Asset ${vin} successfully commissioned.` });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session.userId) return NextResponse.json({ error: 'Unauthorized access request.' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const vin = searchParams.get('vin');
        if (!vin) return NextResponse.json({ error: 'Missing target decommissioning VIN.' }, { status: 400 });

        await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { vin } }));
        return NextResponse.json({ success: true, message: `Asset ${vin} purged from live matrix.` });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
