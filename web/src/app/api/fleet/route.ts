import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "mock-access-key",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "mock-secret-key",
  },
  ...(process.env.AWS_ENDPOINT_URL && { endpoint: process.env.AWS_ENDPOINT_URL }),
});

const docClient = DynamoDBDocumentClient.from(client);

export async function GET() {
  try {
    const command = new ScanCommand({
      TableName: process.env.STATE_TABLE || "ohmnic-vehicle-baselines",
    });

    const response = await docClient.send(command);
    return NextResponse.json({
      vehicles: response.Items || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DynamoDB Scan Error:", error);
    return NextResponse.json({ error: "Failed to fetch telemetry data" }, { status: 500 });
  }
}
