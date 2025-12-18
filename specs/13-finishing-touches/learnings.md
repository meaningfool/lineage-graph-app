# Learnings: Finishing Touches

### Type-Safe Zod 4.x Metadata Extraction
*   **Discovery**: Zod 4.x uses `invalid_value` code and `.values` property for enum/literal failures, which aren't always reflected in standard types.
*   **Pattern**: Used a "Narrow Interface" (`{ values?: string[] }`) and `as unknown as Narrow` to safely probe for this metadata without using `any` or triggering Biome lint errors.

### Contextual Error Decoration
*   **Strategy**: Decoupled Zod schemas from user-facing messages.
*   **Implementation**: Centralized error formatting in the Importer layer. This allows dynamic decoration (e.g., prefixing `ID: `) and mapping internal Zod paths to user-facing CSV labels, which static schemas cannot do effectively.
