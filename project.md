# Data Lineage Application

## Project Overview

This application is designed to help users trace the lineage of data through a directed acyclic graph (DAG) structure. The system enables users to understand how data flows from source data through computed values to final metrics, providing transparency and traceability in data processing pipelines.

## Core Architecture

### Data Structure: Directed Acyclic Graph (DAG)

The application models data relationships as a DAG with three distinct node types:

```
Source Data → Computed Values → Metrics
     ↓              ↓            ↓
  (Leaves)     (Intermediate)  (Root)
```

#### Node Types

1. **Source Data (Leaf Nodes)**
   - Raw data that serves as the foundation
   - Origin points of all data lineage
   - Contains properties specific to source data

2. **Computed Values (Intermediate Nodes)**
   - Values calculated from source data or other computed values
   - Can be reused by multiple higher-level computations
   - Contains properties specific to computed values

3. **Metrics (Root Nodes)**
   - Final calculated metrics that represent business outcomes
   - Depend on computed values and/or source data
   - Contains properties specific to metrics

### Key Features

#### Phase 1: Core Lineage Visualization
- **Navigation & Search**: Users can search and select any node type (metrics, computed values, or source data)
- **Lineage Tracing**: 
  - Trace upstream: See what computed values or source data contribute to a metric
  - Trace downstream: See what metrics depend on specific computed values or source data
- **Property Inspection**: View detailed properties for each node type
- **DAG Visualization**: Interactive graph representation of data relationships

#### Phase 2: Data Integration
- **CSV Upload**: Import CSV files to view actual data within the lineage context
- **Data Preview**: Display sample data for each node in the lineage

#### Phase 3: Data Export
- **CSV Export**: Export lineage data and associated information to CSV format
- **Lineage Reports**: Generate comprehensive lineage reports

#### Phase 4: Graph Editing
- **Interactive DAG Editing**: Modify the lineage graph through the application interface
- **Node Management**: Add, edit, or remove nodes and relationships
- **Validation**: Ensure DAG integrity during modifications

## Use Cases

### For Data Engineers
- Understand data dependencies and impact analysis
- Identify bottlenecks in data processing pipelines
- Document data lineage for compliance and governance

### For Business Users
- Trace metric calculations back to source data
- Understand data quality and reliability
- Make informed decisions based on data lineage

### For Data Scientists
- Explore data relationships and dependencies
- Validate data transformations and calculations
- Collaborate on data pipeline development