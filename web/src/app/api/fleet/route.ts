import { NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const region = process.env.AWS_REGION || "us-east-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return NextResponse.json(
      { error: "AWS credentials not configured on server", vehicles: [] },
      { status: 200 }
    );
  }

  try {
    const client = new DynamoDBClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
    const ddbDoc = DynamoDBDocumentClient.from(client);

    const response = await ddbDoc.send(
      new ScanCommand({
        TableName: process.env.STATE_TABLE || "ohmnic-vehicle-baselines",
      })
    );

    return NextResponse.json({
      vehicles: response.Items || [],
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DynamoDB scan failure";
    return NextResponse.json({ error: message, vehicles: [] }, { status: 500 });
  }
}