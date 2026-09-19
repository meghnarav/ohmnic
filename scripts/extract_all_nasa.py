import os
import glob
import json
import argparse
import numpy as np
from scipy.io import loadmat

def extract_mat_to_json(mat_path, output_dir):
    try:
        mat_data = loadmat(mat_path)
    except Exception as e:
        print(f"Failed to load {mat_path}: {e}")
        return

    basename = os.path.basename(mat_path)
    dataset_name = os.path.splitext(basename)[0] # e.g. B0005
    
    # NASA Battery Dataset Structure typically involves a deep nested struct.
    # This is a generalized extractor that tries to find 'discharge' cycles.
    # Because MAT file parsing depends heavily on exact structure, we wrap in broad try-catch.
    
    cycles = []
    
    try:
        # The key is usually the same as the dataset name, e.g. mat_data['B0005']
        if dataset_name in mat_data:
            data = mat_data[dataset_name]['cycle'][0][0][0]
        else:
            # Try to find the main struct key dynamically
            keys = [k for k in mat_data.keys() if not k.startswith('__')]
            if not keys:
                return
            data = mat_data[keys[0]]['cycle'][0][0][0]
            
        for idx, cycle in enumerate(data):
            # cycle['type'] is typically 'charge', 'discharge', or 'impedance'
            # Check if type is 'discharge'
            cycle_type = cycle['type'][0]
            if cycle_type == 'discharge':
                # We specifically want degraded cycles (e.g., > 120)
                # But we'll just extract the last available discharge cycle for maximum degradation
                cycles.append((idx, cycle['data'][0][0]))
                
        if not cycles:
            print(f"No discharge cycles found in {basename}")
            return
            
        # Select the final discharge cycle (most degraded)
        last_cycle_idx, degraded_cycle_data = cycles[-1]
        print(f"Extracting highly degraded cycle (index {last_cycle_idx}) from {basename}...")
        
        # NASA keys: Voltage_measured, Current_measured, Temperature_measured, Time
        voltage = degraded_cycle_data['Voltage_measured'][0]
        current = degraded_cycle_data['Current_measured'][0]
        temperature = degraded_cycle_data['Temperature_measured'][0]
        
        telemetry_rows = []
        for i in range(len(voltage)):
            telemetry_rows.append({
                "pack_voltage": round(float(voltage[i]), 3),
                "pack_current": round(float(current[i]), 3),
                "pack_temp_c": round(float(temperature[i]), 2),
                "cell_voltage_delta": round(float(np.random.normal(0.015, 0.005)), 4) # NASA doesn't have parallel string deltas, simulate natural slight variance
            })
            
        out_filename = os.path.join(output_dir, f"fault_stream_{dataset_name}.json")
        with open(out_filename, 'w') as f:
            json.dump(telemetry_rows, f, indent=2)
            
        print(f"Successfully wrote {len(telemetry_rows)} telemetry points to {out_filename}")
        
    except Exception as e:
        print(f"Struct parsing error on {basename}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Bulk extract NASA .mat to JSON telemetry arrays.")
    parser.add_argument("--input-dir", type=str, default="./data", help="Directory containing .mat files")
    parser.add_argument("--output-dir", type=str, default="./data/processed", help="Directory to save .json files")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    from pathlib import Path
    mat_files = list(Path(args.input_dir).rglob("*.mat"))
    
    if not mat_files:
        print(f"No .mat files found in {args.input_dir} (searched recursively)")
        return
        
    for mat_file in mat_files:
        extract_mat_to_json(str(mat_file), args.output_dir)

if __name__ == '__main__':
    main()
