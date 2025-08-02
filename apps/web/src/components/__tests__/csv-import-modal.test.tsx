import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CSVImportModal } from "../csv-import-modal";

describe("CSVImportModal", () => {
	const mockOnClose = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	// Helper function to navigate to validation step - used by multiple test suites
	// Assumes files are already uploaded and user is on upload step
	async function navigateToValidationStep(user: any) {
		// Step 1: Go from upload to mapping
		let continueButton = screen.getByRole("button", { name: /continue/i });
		await user.click(continueButton); // Go to mapping

		// Step 2: Configure required mappings (mapping → validation)
		// Select Node ID column (required)
		const nodeIdSelect = screen.getByLabelText(/node id column/i);
		await user.selectOptions(nodeIdSelect, "id");

		// Select Node Title column (required)  
		const nodeTitleSelect = screen.getByLabelText(/node title column/i);
		await user.selectOptions(nodeTitleSelect, "title");

		// Select Node Type column (required) - NEWLY REQUIRED
		const nodeTypeSelect = screen.getByLabelText(/node type column/i);
		await user.selectOptions(nodeTypeSelect, "type");

		// Select Source and Target columns (required)
		const sourceSelect = screen.getByLabelText(/source node column/i);
		await user.selectOptions(sourceSelect, "source");

		const targetSelect = screen.getByLabelText(/target node column/i);
		await user.selectOptions(targetSelect, "target");

		continueButton = screen.getByRole("button", { name: /continue/i });
		await user.click(continueButton); // Go to validation
	}

	describe("File Drop Zone", () => {
		it("displays file drop zone when modal is open", () => {
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			expect(screen.getByText(/upload nodes csv/i)).toBeInTheDocument();
			expect(screen.getByText(/upload edges csv/i)).toBeInTheDocument();
		});

		it("accepts CSV file drop", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			const fileInput = screen.getByLabelText(/nodes csv file/i);

			const file = new File(["col1,col2\nval1,val2"], "test.csv", {
				type: "text/csv",
			});
			await user.upload(fileInput, file);

			expect(screen.getByText("test.csv")).toBeInTheDocument();
		});

		it("rejects non-CSV files", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			const fileInput = screen.getByLabelText(/nodes csv file/i);

			// Try to upload a non-CSV file - react-dropzone should prevent it
			const file = new File(["data"], "test.txt", { type: "text/plain" });
			await user.upload(fileInput, file);

			// No file should be shown since it was rejected
			expect(screen.queryByText("test.txt")).not.toBeInTheDocument();
			// No error should be shown since react-dropzone prevents the upload
			expect(
				screen.queryByText(/only csv files allowed/i),
			).not.toBeInTheDocument();
		});

		it("shows file name when valid CSV uploaded", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			const fileInput = screen.getByLabelText(/nodes csv file/i);

			const file = new File(["id,name\n1,test"], "my-data.csv", {
				type: "text/csv",
			});
			await user.upload(fileInput, file);

			expect(screen.getByText("my-data.csv")).toBeInTheDocument();
			expect(
				screen.queryByText(/only csv files allowed/i),
			).not.toBeInTheDocument();
		});

		it("allows browsing for files via button", () => {
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			const browseButtons = screen.getAllByRole("button", {
				name: /browse files/i,
			});
			expect(browseButtons).toHaveLength(2); // One for nodes, one for edges
			expect(browseButtons[0]).toBeInTheDocument();
			expect(browseButtons[1]).toBeInTheDocument();
		});

		it("shows proper file input for accessibility", () => {
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const edgesInput = screen.getByLabelText(/edges csv file/i);

			expect(nodesInput).toBeInTheDocument();
			expect(nodesInput).toHaveAttribute("type", "file");
			expect(nodesInput).toHaveAttribute("accept", ".csv,text/csv");

			expect(edgesInput).toBeInTheDocument();
			expect(edgesInput).toHaveAttribute("type", "file");
			expect(edgesInput).toHaveAttribute("accept", ".csv,text/csv");
		});
	});

	describe("CSV Validation", () => {
		it("shows error for empty CSV file", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			const fileInput = screen.getByLabelText(/nodes csv file/i);
			const file = new File([""], "empty.csv", { type: "text/csv" });
			await user.upload(fileInput, file);

			expect(
				screen.getByText(/nodes file: file is empty/i),
			).toBeInTheDocument();
		});

		it("shows error for malformed CSV", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			const fileInput = screen.getByLabelText(/nodes csv file/i);
			const file = new File(['col1,col2\n"unclosed quote'], "bad.csv", {
				type: "text/csv",
			});
			await user.upload(fileInput, file);

			expect(
				screen.getByText(/nodes file: invalid csv format/i),
			).toBeInTheDocument();
		});

		it("shows success for valid CSV", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			const fileInput = screen.getByLabelText(/nodes csv file/i);
			const file = new File(["col1,col2\nval1,val2"], "good.csv", {
				type: "text/csv",
			});
			await user.upload(fileInput, file);

			expect(screen.getByText("good.csv")).toBeInTheDocument();
			expect(
				screen.queryByText(/nodes file: invalid csv format/i),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(/nodes file: file is empty/i),
			).not.toBeInTheDocument();
		});

		it("displays parsing progress during file processing", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			const fileInput = screen.getByLabelText(/nodes csv file/i);
			const file = new File(["col1,col2\nval1,val2"], "processing.csv", {
				type: "text/csv",
			});

			// Start upload
			await user.upload(fileInput, file);

			// Should show final success state with filename
			expect(screen.getByText("processing.csv")).toBeInTheDocument();
		});

		it("shows detailed error messages for parsing failures", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			const fileInput = screen.getByLabelText(/nodes csv file/i);
			// Create a CSV with inconsistent columns (PapaParse treats this as format error)
			const file = new File(
				["col1,col2\nval1", "col1,col2,col3\nval1,val2,val3"],
				"inconsistent.csv",
				{ type: "text/csv" },
			);
			await user.upload(fileInput, file);

			expect(
				screen.getByText(/nodes file: invalid csv format/i),
			).toBeInTheDocument();
		});
	});

	describe("Dual File Upload System", () => {
		it("displays two drop zones for nodes and edges", () => {
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			expect(screen.getByText(/upload nodes csv/i)).toBeInTheDocument();
			expect(screen.getByText(/upload edges csv/i)).toBeInTheDocument();
		});

		it("shows which files are uploaded and missing", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload nodes file only
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				["id,title,type\n1,Users,input"],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			// Check that the nodes file shows up in status
			expect(screen.getByText("nodes.csv")).toBeInTheDocument();
			expect(screen.getByText("Not uploaded")).toBeInTheDocument(); // edges file status
		});

		it("enables next step only when both files uploaded", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Continue button should be disabled initially
			expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

			// Upload nodes file
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				["id,title,type\n1,Users,input"],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			// Still disabled with only one file
			expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

			// Upload edges file
			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(["source,target\n1,2"], "edges.csv", {
				type: "text/csv",
			});
			await user.upload(edgesInput, edgesFile);

			// Now should be enabled
			expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
		});
	});

	describe("Column Mapping Setup", () => {
		it("shows column mapping interface after file upload", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload both files
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				["id,title,type,description\n1,Users,input,User data"],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(["source,target\n1,2"], "edges.csv", {
				type: "text/csv",
			});
			await user.upload(edgesInput, edgesFile);

			// Click continue to go to column mapping
			const continueButton = screen.getByRole("button", { name: /continue/i });
			await user.click(continueButton);

			// Should show column mapping interface
			expect(screen.getByText(/column mapping/i)).toBeInTheDocument();
			expect(screen.getByText(/map your csv columns/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/node id column/i)).toBeInTheDocument();
		});

		it("populates column dropdowns with available CSV columns", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload both files
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(["id,title\n1,Users"], "nodes.csv", {
				type: "text/csv",
			});
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(
				["source,target,weight\n1,2,0.5"],
				"edges.csv",
				{ type: "text/csv" },
			);
			await user.upload(edgesInput, edgesFile);

			// Click continue to go to column mapping
			const continueButton = screen.getByRole("button", { name: /continue/i });
			await user.click(continueButton);

			// Check columns are available in dropdowns (node columns in node ID selector)
			const nodeIdSelect = screen.getByLabelText(/node id column/i);
			expect(within(nodeIdSelect).getByText("id")).toBeInTheDocument();
			expect(within(nodeIdSelect).getByText("title")).toBeInTheDocument();
		});

		it("displays required fields in column mapping", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload both files with multiple rows
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				["id,title,type\n1,Users,input\n2,Orders,input\n3,Revenue,output"],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(["source,target\n1,2\n2,3"], "edges.csv", {
				type: "text/csv",
			});
			await user.upload(edgesInput, edgesFile);

			// Click continue to go to column mapping
			const continueButton = screen.getByRole("button", { name: /continue/i });
			await user.click(continueButton);

			// Should show required field selectors
			expect(screen.getByLabelText(/node id column.*\*/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/node title column.*\*/i)).toBeInTheDocument();
		});

		it("provides navigation back to file upload", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload both files and navigate to column detection
			await uploadBothValidFiles(user);
			const continueButton = screen.getByRole("button", { name: /continue/i });
			await user.click(continueButton);

			// Should have back button
			const backButton = screen.getByRole("button", { name: /back/i });
			expect(backButton).toBeInTheDocument();

			// Click back should return to file upload view
			await user.click(backButton);
			expect(screen.getByText(/upload nodes csv/i)).toBeInTheDocument();
			expect(screen.getByText(/upload edges csv/i)).toBeInTheDocument();
		});

		it("provides continue button to next step", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload both files and navigate to column detection
			await uploadBothValidFiles(user);
			let continueButton = screen.getByRole("button", { name: /continue/i });
			await user.click(continueButton);

			// Should have continue button for next step (validation) - initially disabled
			continueButton = screen.getByRole("button", { name: /continue/i });
			expect(continueButton).toBeInTheDocument();
			expect(continueButton).toBeDisabled(); // Disabled until all required mappings selected

			// Select all required mappings
			await selectMapping(user, "node-id", "id");
			await selectMapping(user, "node-title", "title");
			await selectMapping(user, "node-type", "type");
			await selectMapping(user, "source-node", "source");
			await selectMapping(user, "target-node", "target");

			// Now continue button should be enabled
			expect(continueButton).toBeEnabled();
		});
	});

	describe("Column Mapping Interface", () => {
		it("displays column mapping dropdowns for required fields", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Navigate to column mapping step
			await navigateToColumnMapping(user);

			// Nodes mapping
			expect(screen.getByLabelText(/node id column/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/node title column/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/node type column/i)).toBeInTheDocument();

			// Edges mapping
			expect(screen.getByLabelText(/source node column/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/target node column/i)).toBeInTheDocument();
		});

		it("validates required mappings before allowing continue", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload files with non-standard column names that won't auto-detect
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				["col1,col2,col3\n1,Users,input"],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(["col1,col2\n1,2"], "edges.csv", {
				type: "text/csv",
			});
			await user.upload(edgesInput, edgesFile);

			// Navigate through steps
			let continueButton = screen.getByRole("button", { name: /continue/i });
			await user.click(continueButton); // Go to columns
			continueButton = screen.getByRole("button", { name: /continue/i });
			await user.click(continueButton); // Go to mapping

			// Continue should be disabled without proper mappings (auto-detection won't find standard names)
			expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

			// Map required fields manually
			await selectMapping(user, "node-id", "col1");
			await selectMapping(user, "node-title", "col2");
			await selectMapping(user, "node-type", "col3");
			await selectMapping(user, "source-node", "col1");
			await selectMapping(user, "target-node", "col2");

			expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
		});



		it("shows mapping validation errors", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload files with non-standard column names to prevent auto-detection
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				["col1,col2,col3\n1,Users,input"],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(["col1,col2\n1,2"], "edges.csv", {
				type: "text/csv",
			});
			await user.upload(edgesInput, edgesFile);

			// Navigate through steps
			let continueButton = screen.getByRole("button", { name: /continue/i });
			await user.click(continueButton); // Go to columns
			continueButton = screen.getByRole("button", { name: /continue/i });
			await user.click(continueButton); // Go to mapping

			// Should show which required fields are missing (no auto-detection for non-standard names)
			expect(screen.getByText(/required.*missing/i)).toBeInTheDocument();

			// Map some fields
			await selectMapping(user, "node-id", "col1");
			await selectMapping(user, "node-title", "col2");

			// Should still show missing fields message
			expect(screen.getByText(/required.*missing/i)).toBeInTheDocument();
		});

		it("should show type column as required in mapping step", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Navigate to column mapping step
			await navigateToColumnMapping(user);

			expect(screen.getByLabelText("Node Type Column *")).toBeInTheDocument();
			expect(screen.getByLabelText("Node Type Column *")).toHaveAttribute("aria-required", "true");
		});

		it("should disable continue when type column not selected", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Navigate to column mapping step  
			await navigateToColumnMapping(user);

			// Select other required fields but not type
			await selectMapping(user, "node-id", "id");
			await selectMapping(user, "source-node", "source");
			await selectMapping(user, "target-node", "target");
			// Don't select type column

			expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
		});
	});

	describe("CSV Import Modal - Required Fields Validation", () => {
		it("should show validation step after column mapping is complete", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload files with missing required fields
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				["id,title,type\n,Node 2,STEP\nnode3,Node 3,OUTPUT"],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(["source,target\nnode1,node2"], "edges.csv", {
				type: "text/csv",
			});
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: should display "Step 4: Validate Data" with validation results
			expect(screen.getByText(/step.*4.*validate.*data/i)).toBeInTheDocument();
		});

		it("should show specific missing field errors in validation step", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload CSV with node missing 'id' at row 2 (second data row)
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				["id,title,type\nnode1,Node 1,INPUT\n,Node 2,STEP"],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(["source,target\nnode1,node2"], "edges.csv", {
				type: "text/csv",
			});
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: should display specific error message
			expect(
				screen.getByText(/node at row 2 is missing required field: id/i),
			).toBeInTheDocument();
		});

		it("should show validation errors but allow import with missing fields", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload CSV with missing required fields
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(["id,title,type\n,Node 1,STEP\nvalid-node,Node 2,INPUT"], "nodes.csv", {
				type: "text/csv",
			});
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(["source,target\nvalid-node,missing"], "edges.csv", {
				type: "text/csv",
			});
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: Should show validation errors for missing fields
			expect(
				screen.getByText(/node at row 1 is missing required field: id/i),
			).toBeInTheDocument();
			
			// But import should still be allowed (non-blocking errors)
			const importButton = screen.getByRole("button", { name: /import/i });
			expect(importButton).toBeEnabled();
		});

		it("should show invalid node type errors with suggestions", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload CSV with invalid node type 'PROCESSING'
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				["id,title,type\nnode1,Node 1,INPUT\nnode2,Node 2,PROCESSING"],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(["source,target\nnode1,node2"], "edges.csv", {
				type: "text/csv",
			});
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: should show error with valid type suggestions
			expect(
				screen.getByText(
					/node at row 2 has invalid type: PROCESSING. Must be INPUT, STEP, or OUTPUT/i,
				),
			).toBeInTheDocument();
		});

		it("should show duplicate node ID removal message", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload CSV with duplicate node IDs
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				[
					"id,title,type\nuser-count,User Count,STEP\norders,Orders,INPUT\nuser-count,User Count Duplicate,OUTPUT",
				],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(
				["source,target\nuser-count,orders"],
				"edges.csv",
				{ type: "text/csv" },
			);
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: should display deduplication message (not error)
			expect(
				screen.getByText(/removed 1 duplicate node/i),
			).toBeInTheDocument();
			
			// Should also show explanation
			expect(
				screen.getByText(/kept first occurrence of each duplicate/i),
			).toBeInTheDocument();
		});

		it("should allow import with edge reference mismatches (treated as warnings)", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload CSV with orphaned edge (references missing node)
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				["id,title,type\nnode1,Node 1,INPUT\nnode2,Node 2,OUTPUT"],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(
				["source,target\nnode1,node2\nmissing-node,node2"],
				"edges.csv",
				{ type: "text/csv" },
			);
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: Import should be enabled as edge mismatches are non-blocking warnings
			const importButton = screen.getByRole("button", { name: /import/i });
			expect(importButton).toBeEnabled();

			// Should show successful edge validation (warnings don't block)
			expect(screen.getByText(/all edges validation passed/i)).toBeInTheDocument();
		});

		it("should run all validations and display categorized results", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload CSV with multiple validation issues
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				[
					"id,title,type\n" +
						",Node Missing ID,INPUT\n" + // missing required field
						"duplicate-id,Node 1,INVALID_TYPE\n" + // invalid type
						"duplicate-id,Node 2,OUTPUT\n" + // duplicate ID
						"valid-node,Valid Node,STEP",
				],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(
				[
					"source,target\n" +
						"valid-node,duplicate-id\n" + // valid edge
						",valid-node\n" + // missing source
						"missing-node,valid-node", // orphaned edge
				],
				"edges.csv",
				{ type: "text/csv" },
			);
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: should show validation results with error counts
			expect(screen.getByText(/step.*4.*validate.*data/i)).toBeInTheDocument();
			expect(screen.getByText(/nodes validation/i)).toBeInTheDocument();
			expect(screen.getByText(/edges validation/i)).toBeInTheDocument();

			// Should show specific error types
			expect(
				screen.getByText(/missing required field.*id/i),
			).toBeInTheDocument();
			expect(
				screen.getByText(/invalid type.*INVALID_TYPE/i),
			).toBeInTheDocument();
			// Duplicates are handled via deduplication message, not validation errors
			expect(screen.getByText(/removed.*duplicate.*node/i)).toBeInTheDocument();
			expect(
				screen.getByText(/missing required field.*source/i),
			).toBeInTheDocument();
			// Edge reference mismatches are warnings, not errors - no longer displayed
		});

		it("should enable import only when no critical errors exist", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload valid CSV data with no critical errors
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				["id,title,type\nnode1,Node 1,INPUT\nnode2,Node 2,OUTPUT"],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(["source,target\nnode1,node2"], "edges.csv", {
				type: "text/csv",
			});
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: Import button should be enabled when no critical errors
			const importButton = screen.getByRole("button", { name: /import/i });
			expect(importButton).toBeEnabled();
			expect(
				screen.getByText(/all nodes validation passed/i),
			).toBeInTheDocument();
			expect(
				screen.getByText(/all edges validation passed/i),
			).toBeInTheDocument();
		});

		it("should allow import with missing required fields (non-blocking errors)", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload CSV with missing required fields (non-blocking)
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				["id,title,type\n,Missing ID,INPUT\nvalid-id,Valid Node,OUTPUT"],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(["source,target\nvalid-id,valid-id"], "edges.csv", {
				type: "text/csv",
			});
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: Import should be enabled since missing fields are non-blocking
			const importButton = screen.getByRole("button", { name: /import/i });
			expect(importButton).toBeEnabled();

			// Should show missing field errors but they don't block import
			expect(
				screen.getByText(/missing required field.*id/i),
			).toBeInTheDocument();
		});
	});

	describe("Modal Behavior", () => {
		it("does not render when closed", () => {
			render(<CSVImportModal isOpen={false} onClose={mockOnClose} />);

			expect(screen.queryByText(/upload nodes csv/i)).not.toBeInTheDocument();
			expect(screen.queryByText(/upload edges csv/i)).not.toBeInTheDocument();
		});
	});

	describe("CSV Import Modal - Graph Structure Validation", () => {
		it("should show connectivity warnings for isolated INPUT nodes", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload CSV with INPUT node having no outgoing edges
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				[
					"id,title,type\nraw-data,Raw Data,INPUT\nprocessed,Processed Data,STEP",
				],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(
				["source,target\nprocessed,final"],
				"edges.csv",
				{ type: "text/csv" },
			);
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: should display connectivity warning for INPUT node
			expect(
				screen.getByText(
					/INPUT node "raw-data" at row 1 has no outgoing connections/i,
				),
			).toBeInTheDocument();
		});

		it("should show connectivity warnings for isolated OUTPUT nodes", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload CSV with OUTPUT node having no incoming edges
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				[
					"id,title,type\nsource,Source Data,INPUT\nfinal-metric,Final Metric,OUTPUT",
				],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(
				["source,target\nsource,intermediate"],
				"edges.csv",
				{ type: "text/csv" },
			);
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: should display connectivity warning for OUTPUT node
			expect(
				screen.getByText(
					/OUTPUT node "final-metric" at row 2 has no incoming connections/i,
				),
			).toBeInTheDocument();
		});

		it("should show critical errors for orphaned STEP nodes", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload CSV with STEP node having no connections
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				[
					"id,title,type\nsource,Source,INPUT\norphaned-step,Orphaned Step,STEP\ntarget,Target,OUTPUT",
				],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(
				["source,target\nsource,target"],
				"edges.csv",
				{ type: "text/csv" },
			);
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: should display critical error for orphaned STEP node
			expect(
				screen.getByText(
					/STEP node "orphaned-step" at row 2 has no incoming or outgoing connections/i,
				),
			).toBeInTheDocument();
		});

		it("should allow import with connectivity warnings only", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload CSV with warnings but no critical graph structure errors
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				[
					"id,title,type\ninput1,Input 1,INPUT\nstep1,Step 1,STEP\noutput1,Output 1,OUTPUT\nisolated-input,Isolated Input,INPUT",
				],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(
				["source,target\ninput1,step1\nstep1,output1"],
				"edges.csv",
				{ type: "text/csv" },
			);
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: Import button should be enabled with warnings
			const importButton = screen.getByRole("button", { name: /import/i });
			expect(importButton).toBeEnabled();

			// Should show warning message about proceeding with warnings
			expect(
				screen.getByText(
					/INPUT node "isolated-input" at row 4 has no outgoing connections/i,
				),
			).toBeInTheDocument();
		});

		it("should prevent import when critical graph structure errors exist", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload CSV with critical graph structure errors (orphaned STEP node)
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				[
					"id,title,type\nvalid-input,Valid Input,INPUT\norphaned-step,Orphaned Step,STEP",
				],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(
				["source,target\n"], // Empty edges file
				"edges.csv",
				{ type: "text/csv" },
			);
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: Import button should be disabled due to critical errors
			const importButton = screen.getByRole("button", { name: /import/i });
			expect(importButton).toBeDisabled();

			// Should show critical error messages
			expect(
				screen.getByText(
					/STEP node "orphaned-step" at row 2 has no incoming or outgoing connections/i,
				),
			).toBeInTheDocument();
		});

		it("should show graph structure validation section in validation step", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload valid CSV data
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				[
					"id,title,type\ninput,Input Data,INPUT\nstep,Processing Step,STEP\noutput,Final Output,OUTPUT",
				],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(
				["source,target\ninput,step\nstep,output"],
				"edges.csv",
				{ type: "text/csv" },
			);
			await user.upload(edgesInput, edgesFile);

			// Navigate to validation step
			await navigateToValidationStep(user);

			// Then: should show graph structure validation section
			expect(
				screen.getByText("Graph Structure Validation"),
			).toBeInTheDocument();
		});

		it("should show Graph Structure Validation section with appropriate styling", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload CSV with graph structure issues
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				["id,title,type\norphaned,Orphaned Step,STEP"],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(["source,target"], "edges.csv", {
				type: "text/csv",
			});
			await user.upload(edgesInput, edgesFile);

			await navigateToValidationStep(user);

			// Should show Graph Structure Validation section
			expect(screen.getByText("Graph Structure Validation")).toBeInTheDocument();
			
			// Should show graph structure errors with appropriate styling
			expect(screen.getByText(/STEP node.*orphaned.*has no incoming or outgoing connections/)).toBeInTheDocument();
		});

		it("should allow import with structure warnings but block with critical errors", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload CSV with critical graph structure errors (isolated STEP node)
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(
				["id,title,type\nisolated,Isolated Step,STEP\nvalid,Valid Input,INPUT"],
				"nodes.csv",
				{ type: "text/csv" },
			);
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(["source,target"], "edges.csv", {
				type: "text/csv",
			});
			await user.upload(edgesInput, edgesFile);

			await navigateToValidationStep(user);

			// Import should be blocked due to graph structure errors
			const importButton = screen.getByRole("button", { name: /import/i });
			expect(importButton).toBeDisabled();

			// Should show blocking graph structure error
			expect(screen.getByText(/STEP node.*isolated.*has no incoming or outgoing connections/)).toBeInTheDocument();
		});
	});

	describe("CSV Import Modal - Required Node ID Column", () => {
		it("should show required Node ID column selector in mapping step", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Navigate to column mapping step
			await navigateToColumnMapping(user);
			
			// Then: Should display Node ID column selector with required indicator
			expect(screen.getByLabelText("Node ID Column *")).toBeInTheDocument();
			expect(screen.getByLabelText("Node ID Column *")).toHaveAttribute("aria-required", "true");
		});

		it("should disable continue when Node ID not selected", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Upload files with columns that won't auto-detect ID field
			const nodesInput = screen.getByLabelText(/nodes csv file/i);
			const nodesFile = new File(["name,label,category\nUser Count,Users,metric"], "nodes.csv", {
				type: "text/csv",
			});
			await user.upload(nodesInput, nodesFile);

			const edgesInput = screen.getByLabelText(/edges csv file/i);
			const edgesFile = new File(["from,to\nuser-count,orders"], "edges.csv", {
				type: "text/csv",
			});
			await user.upload(edgesInput, edgesFile);

			// Navigate to mapping step
			const continueButton = screen.getByRole("button", { name: /continue/i });
			await user.click(continueButton);

			// Select other required fields but leave Node ID empty
			await selectMapping(user, "node-title", "name");
			await selectMapping(user, "source-node", "from");
			await selectMapping(user, "target-node", "to");
			
			// Then: Continue should be disabled because Node ID is required but not selected
			expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
		});

		it("should show 'Use ID as labels' checkbox (default checked)", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Navigate to column mapping step
			await navigateToColumnMapping(user);
			
			// Then: Should display "Use ID as labels" checkbox that is checked by default
			const useIdAsLabelsCheckbox = screen.getByLabelText(/use id as labels/i);
			expect(useIdAsLabelsCheckbox).toBeInTheDocument();
			expect(useIdAsLabelsCheckbox).toBeChecked();
		});

		it("should allow unchecking 'Use ID as labels' checkbox", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Navigate to column mapping step
			await navigateToColumnMapping(user);
			
			// When: User unchecks the "Use ID as labels" checkbox
			const useIdAsLabelsCheckbox = screen.getByLabelText(/use id as labels/i);
			await user.click(useIdAsLabelsCheckbox);
			
			// Then: Checkbox should be unchecked
			expect(useIdAsLabelsCheckbox).not.toBeChecked();
		});

		it("should show Node Label Column selector when 'Use ID as labels' is unchecked", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Navigate to column mapping step
			await navigateToColumnMapping(user);
			
			// When: User unchecks the "Use ID as labels" checkbox
			const useIdAsLabelsCheckbox = screen.getByLabelText(/use id as labels/i);
			await user.click(useIdAsLabelsCheckbox);
			
			// Then: Node Label Column selector should appear
			expect(screen.getByLabelText(/node label column/i)).toBeInTheDocument();
		});

		it("should hide Node Label Column selector when 'Use ID as labels' is checked", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Navigate to column mapping step  
			await navigateToColumnMapping(user);
			
			// Given: Checkbox starts checked, so label selector should be hidden
			expect(screen.queryByLabelText(/node label column/i)).not.toBeInTheDocument();
			
			// When: User unchecks then re-checks the checkbox
			const useIdAsLabelsCheckbox = screen.getByLabelText(/use id as labels/i);
			await user.click(useIdAsLabelsCheckbox); // Uncheck
			await user.click(useIdAsLabelsCheckbox); // Re-check
			
			// Then: Node Label Column selector should be hidden again
			expect(screen.queryByLabelText(/node label column/i)).not.toBeInTheDocument();
		});

		it("should populate Node Label Column selector with available CSV columns", async () => {
			const user = userEvent.setup();
			render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

			// Navigate to column mapping step
			await navigateToColumnMapping(user);
			
			// When: User unchecks the "Use ID as labels" checkbox
			const useIdAsLabelsCheckbox = screen.getByLabelText(/use id as labels/i);
			await user.click(useIdAsLabelsCheckbox);
			
			// Then: Node Label Column selector should have available columns
			const labelSelector = screen.getByLabelText(/node label column/i);
			expect(within(labelSelector).getByText("id")).toBeInTheDocument();
			expect(within(labelSelector).getByText("title")).toBeInTheDocument();
			expect(within(labelSelector).getByText("type")).toBeInTheDocument();
		});
	});

	// Helper functions for tests
	async function uploadBothValidFiles(user: any) {
		const nodesInput = screen.getByLabelText(/nodes csv file/i);
		const nodesFile = new File(["id,title,type\n1,Users,input"], "nodes.csv", {
			type: "text/csv",
		});
		await user.upload(nodesInput, nodesFile);

		const edgesInput = screen.getByLabelText(/edges csv file/i);
		const edgesFile = new File(["source,target\n1,2"], "edges.csv", {
			type: "text/csv",
		});
		await user.upload(edgesInput, edgesFile);
	}

	async function navigateToColumnMapping(user: any) {
		// Upload both files
		await uploadBothValidFiles(user);

		// Navigate to mapping step (upload → mapping)
		const continueButton = screen.getByRole("button", { name: /continue/i });
		await user.click(continueButton);
	}

	async function selectMapping(
		user: any,
		fieldName: string,
		columnValue: string,
	) {
		const dropdown = screen.getByLabelText(
			new RegExp(fieldName.replace("-", ".*"), "i"),
		);
		await user.selectOptions(dropdown, columnValue);
	}
});
