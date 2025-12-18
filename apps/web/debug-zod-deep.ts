import { z } from "zod";

const stringEnum = z.enum(["A", "B", "C"]);
const nativeEnum = z.nativeEnum({ A: "A", B: "B", C: "C" } as const);
const literalUnion = z.union([z.literal("A"), z.literal("B"), z.literal("C")]);

console.log("--- String Enum ---");
try {
	stringEnum.parse("D");
} catch (e) {
	if (e instanceof z.ZodError) {
		console.log(JSON.stringify(e.issues[0], null, 2));
	}
}

console.log("\n--- Native Enum ---");
try {
	nativeEnum.parse("D");
} catch (e) {
	if (e instanceof z.ZodError) {
		console.log(JSON.stringify(e.issues[0], null, 2));
	}
}

console.log("\n--- Literal Union ---");
try {
	literalUnion.parse("D");
} catch (e) {
	if (e instanceof z.ZodError) {
		console.log(JSON.stringify(e.issues[0], null, 2));
	}
}

console.log("\n--- Mixed Union ---");
const mixedUnion = z.union([z.string(), z.number()]);
try {
	mixedUnion.parse(true);
} catch (e) {
	if (e instanceof z.ZodError) {
		console.log(JSON.stringify(e.issues[0], null, 2));
	}
}
