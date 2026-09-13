from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TelemetryPayload(BaseModel):
    vehicle_id: str = Field(..., description="Unique identifier for the vehicle")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Time of the telemetry event")
    session_type: str = Field(..., description="Type of session (e.g., driving, charging, parked)")
    state_of_charge: float = Field(..., ge=0, le=100, description="Battery state of charge percentage")
    pack_voltage: float = Field(..., description="Total battery pack voltage")
    pack_current: float = Field(..., description="Total battery pack current (amps)")
    pack_temp_c: float = Field(..., description="Average pack temperature in Celsius")
    cell_voltage_delta: float = Field(..., description="Difference between highest and lowest cell voltages")
    max_cell_temp_c: float = Field(..., description="Maximum single cell temperature in Celsius")
    min_cell_temp_c: float = Field(..., description="Minimum single cell temperature in Celsius")
    charge_rate_kw: Optional[float] = Field(None, description="Charge rate in kW if charging")
