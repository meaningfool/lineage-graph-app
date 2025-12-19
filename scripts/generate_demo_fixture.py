
import csv
import random
import os
import uuid
from datetime import datetime, timedelta

# Configuration
OUTPUT_DIR = "apps/web/public/demo"
RANDOM_SEED = 42 # For reproducibility (optional, turn off for true random)

# Dimensions (Box)
N_INPUTS_RANGE = (3, 5)
N_OUTPUTS_RANGE = (4, 6)
MAX_DEPTH_RANGE = (6, 8)
MID_LAYER_DENSITY = (2, 5) # Min/Max nodes per mid layer

# Capacities
CAPACITY_IN_RANGE = (1, 2)
CAPACITY_OUT_RANGE = (1, 3)
P_FORCED_SKIP = 0.7 # Increased from 0.5 to force more jumping

# Vocabulary Pools (Expanded)
INGREDIENTS = [
    "Acetylsalicylic Acid", "Titanium Dioxide", "Purified Water", 
    "Corn Starch", "Ethanol 96%", "Lactose Monohydrate", 
    "Microcrystalline Cellulose", "Magnesium Stearate", "Silicon Dioxide",
    "Hypromellose", "Iron Oxide Red", "Talc", "Croscarmellose Sodium",
    "Povidone K30", "Stearic Acid", "Gelatin Type A", "Polyethylene Glycol",
    "Fd&C Blue #2", "Anhydrous Citric Acid", "Sodium Benzoate"
]
ACTIONS = [
    "High Shear Mixing", "Fluid Bed Drying", "Dry Milling", 
    "V-Blending", "Rotary Compression", "Film Coating", 
    "Laser Drilling", "Blister Packing", "Wet Granulation",
    "Sifting", "Spray Drying", "Capsule Filling", "Pan Coating",
    "Tray Drying", "Micronization", "Hot Melt Extrusion",
    "Roller Compaction", "Double Cone Blending", "Tablet Polishing",
    "Bottle Packing", "Induction Sealing", "Labeling", "Cartoning",
    "Checkweighing", "Metal Detection"
]
STATES = [
    "Granulated Bulk", "Dried Powder", "Milled Fines", 
    "Coated Tablet", "Tablets (Unpolished)", "Blend A", "Blend B",
    "Core Tablets", "Final Bulk", "Premix Blend", "Sifted Fraction",
    "Compacted Ribbons", "Extrudate Strands", "Pellets (Uncoated)",
    "Capsule Shells (Empty)", "Sort Buffer", "Quarantine Stock",
    "Rework Material", "Validation Batch", "Stability Sample"
]
QC_TESTS = [
    "Dissolution Profile", "Karl Fischer Moisture", "Hardness Limit", 
    "Friability Test", "Assay (HPLC)", "Uniformity of Dosage",
    "Disintegration Time", "Microbial Limit", "Viscosity Check",
    "pH Measurement", "Loss on Drying", "Particle Size Dist",
    "Impurity Profiling", "Residual Solvents", "Appearance Check",
    "Weight Variation"
]
PRODUCTS = [
    "PainRelief Max", "SleepAid Night", "HeartHealth 100mg",
    "AllergyStop 24h", "DigestEase", "Vitamin C 1000mg"
]
SUPPLIERS = ["ChemCorp", "BioSynth", "RawMat Ltd", "PureChem Inc", "GlobalPharma"]
LOCATIONS = ["Warehouse A", "Zone B", "Silo 1", "Tank 4", "Cold Storage"]

def generate_id():
    return str(uuid.uuid4())[:8]

def random_date():
    start = datetime(2025, 1, 1)
    end = datetime(2026, 12, 31)
    delta = end - start
    random_days = random.randint(0, delta.days)
    return (start + timedelta(days=random_days)).strftime("%Y-%m-%d")

# Track used labels to ensure uniqueness
USED_LABELS = set()

def get_unique_label(pool):
    # Try to find an unused label
    available = [l for l in pool if l not in USED_LABELS]
    if available:
        label = random.choice(available)
        USED_LABELS.add(label)
        return label
    else:
        # Fallback: Pick random and append suffix
        base = random.choice(pool)
        label = f"{base} ({random.randint(1, 99)})"
        while label in USED_LABELS:
            label = f"{base} ({random.randint(1, 99)})"
        USED_LABELS.add(label)
        return label

def get_node_metadata(node_type, depth):
    # Base properties (ensure at least 5)
    props = {
        "Recorded_By": f"User-{random.randint(100, 999)}",
        "Timestamp": datetime.now().isoformat(),
    }
    
    if node_type == "INPUT":
        props.update({
            "Batch": f"RM-{random.randint(1000, 9999)}",
            "Supplier": random.choice(SUPPLIERS),
            "Expiry": random_date(),
            "Location": random.choice(LOCATIONS),
            "Cert_ID": f"CERT-{random.randint(10000, 99999)}"
        })
        return get_unique_label(INGREDIENTS), props

    elif node_type == "OUTPUT":
        if random.random() < 0.7:
             props.update({
                "Status": random.choice(["Pass", "Pass", "Pass", "Fail"]),
                "Operator": f"Op-{random.randint(1,50)}",
                "Method": "USP <711>",
                "Instrument": f"Inst-{random.randint(1,10)}",
                "Reviewer": f"Mgr-{random.randint(1,5)}"
             })
             return get_unique_label(QC_TESTS), props
        else:
             props.update({
                "Batch": f"FG-{random.randint(20000, 99999)}",
                "Market": random.choice(["EU", "US", "JP"]),
                "Release_Date": random_date(),
                "Box_Count": str(random.randint(500, 5000)),
                "QA_Signoff": "Yes"
             })
             return get_unique_label(PRODUCTS), props

    else: # STEP
        if random.random() < 0.6:
            props.update({
                "Machine": f"Mach-{random.randint(100, 999)}",
                "Duration_Min": str(random.randint(30, 240)),
                "Temp_C": str(random.randint(20, 80)),
                "Speed_RPM": str(random.randint(500, 1500)),
                "Operator": f"Op-{random.randint(51, 99)}"
            })
            return get_unique_label(ACTIONS), props
        else:
            props.update({
                "Weight_Kg": str(random.randint(50, 500)),
                "Container": f"Bin-{random.randint(100, 200)}",
                "Moisture_Pct": f"{random.uniform(0.5, 5.0):.1f}%",
                "Density": f"{random.uniform(0.3, 0.8):.2f}",
                "Status": "Released"
            })
            return get_unique_label(STATES), props

class Node:
    def __init__(self, depth, n_type):
        self.id = generate_id()
        self.depth = depth
        self.type = n_type
        self.label, self.props = get_node_metadata(n_type, depth)
        self.max_in = random.randint(*CAPACITY_IN_RANGE)
        self.max_out = random.randint(*CAPACITY_OUT_RANGE)
        self.current_in = 0
        self.current_out = 0

    def can_accept_input(self):
        return self.current_in < self.max_in
    
    def can_accept_output(self):
        return self.current_out < self.max_out

def main():
    print(f"Generating Box-Filling fixture in {OUTPUT_DIR}...")
    
    # 1. Define Box
    n_inputs = random.randint(*N_INPUTS_RANGE)
    n_outputs = random.randint(*N_OUTPUTS_RANGE)
    max_depth = random.randint(*MAX_DEPTH_RANGE)
    
    print(f"Box: {n_inputs} Inputs -> {n_outputs} Outputs, Depth {max_depth}")

    layers = {} # depth -> [Node objects]
    all_nodes = []

    # 2. Fill Volume
    # Layer 0 (Inputs)
    layers[0] = [Node(0, "INPUT") for _ in range(n_inputs)]
    
    # Layer Max (Outputs)
    layers[max_depth] = [Node(max_depth, "OUTPUT") for _ in range(n_outputs)]
    
    # Mid Layers
    for d in range(1, max_depth):
        count = random.randint(*MID_LAYER_DENSITY)
        if count == 0: count = 1 
        layers[d] = [Node(d, "STEP") for _ in range(count)]
        
    for d in layers:
        all_nodes.extend(layers[d])

    edges = [] # (src_node, tgt_node)

    # 3. Wiring (Capacity Based)
    for d in range(max_depth):
        source_layer = layers[d]
        
        for src in source_layer:
            attempts = 0
            while src.can_accept_output() and attempts < 15: # Increased attempts
                attempts += 1
                target_found = None
                
                for lookahead in range(1, max_depth - d + 1):
                    # Forced Skipping: VERY aggressive skip
                    if lookahead == 1 and random.random() < P_FORCED_SKIP:
                        continue

                    target_d = d + lookahead
                    if target_d not in layers: continue
                    
                    candidates = [t for t in layers[target_d] if t.can_accept_input()]
                    if candidates:
                        target = random.choice(candidates)
                        edges.append((src, target))
                        src.current_out += 1
                        target.current_in += 1
                        target_found = target
                        break 
                
                if not target_found:
                    break

    # 4. Connectivity Cleanup
    for node in all_nodes:
        if node.depth == 0: continue
        if node.current_in == 0:
            prev_layer = layers.get(node.depth - 1, [])
            if not prev_layer: prev_layer = layers.get(node.depth - 2, [])
            if prev_layer:
                src = random.choice(prev_layer)
                edges.append((src, node))
                src.current_out += 1
                node.current_in += 1

    for node in all_nodes:
        if node.depth == max_depth: continue
        if node.current_out == 0:
            next_layer = layers.get(node.depth + 1, [])
            if not next_layer: next_layer = layers.get(node.depth + 2, [])
            if next_layer:
                tgt = random.choice(next_layer)
                edges.append((node, tgt))
                node.current_out += 1
                tgt.current_in += 1

    # 5. Inject Cycle & Orphan
    deep_nodes = [n for n in all_nodes if n.depth >= 3]
    shallow_nodes = [n for n in all_nodes if n.depth <= 1]
    if deep_nodes and shallow_nodes:
        c_src = random.choice(deep_nodes)
        c_tgt = random.choice(shallow_nodes)
        edges.append((c_src, c_tgt))
        print(f"Long Cycle: {c_src.label} -> {c_tgt.label}")

    # 5b. Self-Loop
    if len(all_nodes) > 5:
        self_loop_node = random.choice(all_nodes)
        edges.append((self_loop_node, self_loop_node))
        print(f"Self-Loop: {self_loop_node.label}")

    # 5c. Multi-Node Short Cycle (A->B->C->A)
    # Pick a random node and try to find a path of length 2, then connect back
    # Alternatively, just pick 3 random nodes and force a cycle
    if len(all_nodes) > 10:
        # Pick 3 random distinct nodes
        cycle_nodes = random.sample(all_nodes, 3)
        n1, n2, n3 = cycle_nodes[0], cycle_nodes[1], cycle_nodes[2]
        edges.append((n1, n2))
        edges.append((n2, n3))
        edges.append((n3, n1))
        print(f"Short Cycle: {n1.label} -> {n2.label} -> {n3.label} -> {n1.label}")

    # Orphan (Disconnected)
    orphan = Node(2, "STEP")
    orphan.label = "Orphaned Material"
    nodes_csv_list = all_nodes + [orphan]

    # 7. Inject Warnings (for Demo purposes)
    # 7a. Edge to non-existent node (will be dropped with warning)
    # We create a dummy source and target interaction where target is missing
    missing_target_id = "MISSING-ID-999"
    warning_src = random.choice(all_nodes)
    edges.append((warning_src, type('obj', (object,), {'id': missing_target_id})))
    print(f"Warning Injection: Edge from {warning_src.label} -> {missing_target_id} (Target Missing)")

    # 7b. Duplicate Node ID (will be dropped with warning)
    # We duplicate an existing node but give it different props/label to show it's a conflict
    duplicate_victim = random.choice(all_nodes)
    duplicate_node = Node(duplicate_victim.depth, duplicate_victim.type)
    duplicate_node.id = duplicate_victim.id # SAME ID
    duplicate_node.label = f"{duplicate_victim.label} (Duplicate)"
    nodes_csv_list.append(duplicate_node)
    print(f"Warning Injection: Duplicate Node ID {duplicate_node.id} ({duplicate_node.label})")

    # 6. Write CSV
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    with open(os.path.join(OUTPUT_DIR, "nodes.csv"), "w", newline="") as f:
        # Collect ALL possible keys from all nodes
        all_keys = set()
        for n in nodes_csv_list:
            all_keys.update(n.props.keys())
        
        # Enforce Order: ID, Label, Type, THEN sorted properties
        sorted_props = sorted(list(all_keys))
        fieldnames = ["ID", "Label", "Type"] + sorted_props
        
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for n in nodes_csv_list:
            row = {"ID": n.id, "Label": n.label, "Type": n.type, **n.props}
            writer.writerow(row)

    with open(os.path.join(OUTPUT_DIR, "edges.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Source", "Target"])
        for src, tgt in edges:
            writer.writerow([src.id, tgt.id])

    print(f"Generated {len(nodes_csv_list)} nodes, {len(edges)} edges.")

if __name__ == "__main__":
    main()
