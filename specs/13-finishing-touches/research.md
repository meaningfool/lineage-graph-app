# Research: Finishing Touches (Importer & Warnings)

## 1. Type-Safe Discovery of Zod 4.x Metadata
The project utilizes **Zod 4.x**, which centralizes validation failures for enums and literals under a unified **`invalid_value`** error code. This structural change impacted how we generate "hint" messages for the user.

*   **The Metadata Challenge**: In Zod 4.x, the list of valid choices is stored in a **`.values`** property on the error issue. However, standard TypeScript type definitions for `ZodIssue` often treat this property as missing or inaccessible depending on the schema's complexity.
*   **The Narrowing Adapter Pattern**: To comply with Biome's `noExplicitAny` while accessing this runtime metadata, we adopted a safe "Discovery Pattern":
    *   **Narrow Interface**: We define `interface ZodEnumIssueNarrow { values?: string[]; }`.
    *   **Explicit Casting**: We cast the issue to `unknown` then to our narrow interface. This signals to the compiler and linter that we are intentionally probing for a runtime property.
    *   **Guaranteed Safety**: We only use the extracted list if `Array.isArray(values)` returns true, ensuring the importer remains robust.

## 2. Decoupling Schema Validation from User Messaging
We established a clear architectural boundary between **Schema Definitions** and **Import Warnings**, moving away from static error messages in Zod.

*   **The "Dumb Schema" Principle**: Schemas in `csv-schemas.ts` are kept strictly for structural validation (e.g., "Is this a string in this specific set?"). They do not contain human-readable labels or custom messages.
*   **The "Contextual Importer" Translator**: The `csv-graph-importer.ts` layer acts as the **exclusive translator** for errors. Because it processes data row-by-row, it has access to metadata that is unavailable at the schema level:
    *   **Row Identification**: It can dynamically choose between a prefixed ID (`ID: node-123`) or a positional reference (`Row 5`) to help the user locate the error.
    *   **Path Mapping**: It translates internal Zod paths (e.g., `["type"]`) into labels that match the UI's mapping labels, providing a seamless "field-to-error" connection.
*   **Unified Reporting**: This separation allows us to treat Zod validation failures, duplicate ID errors, and referential integrity issues (e.g., missing target nodes) as a single, hierarchical `ImportReport` structure.
