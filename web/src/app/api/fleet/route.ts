import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

// We use the AWS SDK directly. In production, these should be securely injected via env vars.
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.AWS_ENDPOINT_URL, // e.g. http://localhost:4566 for localstack
});

const docClient = DynamoDBDocumentClient.from(client);

export async function GET() {
  try {
    const command = new ScanCommand({
      TableName: process.env.STATE_TABLE || "ohmnic-vehicle-baselines",
    });

    const response = await docClient.send(command);
    return NextResponse.json(response.Items || []);
  } catch (error) {
    console.error("DynamoDB Scan Error:", error);
    return NextResponse.json({ error: "Failed to fetch telemetry data" }, { status: 500 });
  }
}
