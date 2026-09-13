import { NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { orgId } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized: Missing organization context." }, { status: 401 });
  }

  const region = process.env.AWS_REGION || "us-east-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: "AWS credentials missing on server", vehicles: [] }, { status: 200 });
  }

  try {
    const client = new DynamoDBClient({ region, credentials: { accessKeyId, secretAccessKey } });
    const ddbDoc = DynamoDBDocumentClient.from(client);

    const response = await ddbDoc.send(
      new ScanCommand({
        TableName: process.env.STATE_TABLE || "ohmnic-vehicle-baselines",
        FilterExpression: "organization_id = :orgId",
        ExpressionAttributeValues: { ":orgId": orgId },
      })
    );

    return NextResponse.json({ vehicles: response.Items || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DynamoDB scan failure";
    return NextResponse.json({ error: message, vehicles: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { orgId } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { vin, fleet_id, pack_type, usable_capacity_kwh, nominal_voltage } = body;

  const region = process.env.AWS_REGION || "us-east-1";
  const client = new DynamoDBClient({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }
  });
  const ddbDoc = DynamoDBDocumentClient.from(client);

  try {
    await ddbDoc.send(
      new PutCommand({
        TableName: process.env.STATE_TABLE || "ohmnic-vehicle-baselines",
        Item: {
          vehicle_id: vin,
          organization_id: orgId,
          fleet_id,
          pack_type,
          usable_capacity_kwh,
          nominal_voltage,
          status: "NOMINAL",
          created_at: new Date().toISOString()
        }
      })
    );
    return NextResponse.json({ success: true, vin });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to onboard vehicle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { orgId } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const vin = searchParams.get("vin");
  
  if (!vin) return NextResponse.json({ error: "Missing VIN" }, { status: 400 });

  const region = process.env.AWS_REGION || "us-east-1";
  const client = new DynamoDBClient({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }
  });
  const ddbDoc = DynamoDBDocumentClient.from(client);

  try {
    await ddbDoc.send(
      new DeleteCommand({
        TableName: process.env.STATE_TABLE || "ohmnic-vehicle-baselines",
        Key: { vehicle_id: vin },
        ConditionExpression: "organization_id = :orgId",
        ExpressionAttributeValues: { ":orgId": orgId }
      })
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete vehicle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { orgId } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { vin, fleet_id, status } = body;
  if (!vin) return NextResponse.json({ error: "Missing VIN" }, { status: 400 });

  const region = process.env.AWS_REGION || "us-east-1";
  const client = new DynamoDBClient({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }
  });
  const ddbDoc = DynamoDBDocumentClient.from(client);

  let updateExpr = "SET ";
  const exprAttrValues: Record<string, any> = { ":orgId": orgId };
  const exprAttrNames: Record<string, string> = {};

  if (fleet_id) {
    updateExpr += "#f = :f, ";
    exprAttrNames["#f"] = "fleet_id";
    exprAttrValues[":f"] = fleet_id;
  }
  if (status) {
    updateExpr += "#s = :s, ";
    exprAttrNames["#s"] = "status";
    exprAttrValues[":s"] = status;
  }

  // Remove trailing comma and space
  updateExpr = updateExpr.slice(0, -2);

  try {
    await ddbDoc.send(
      new UpdateCommand({
        TableName: process.env.STATE_TABLE || "ohmnic-vehicle-baselines",
        Key: { vehicle_id: vin },
        UpdateExpression: updateExpr,
        ConditionExpression: "organization_id = :orgId",
        ExpressionAttributeNames: Object.keys(exprAttrNames).length ? exprAttrNames : undefined,
        ExpressionAttributeValues: exprAttrValues
      })
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to patch vehicle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
